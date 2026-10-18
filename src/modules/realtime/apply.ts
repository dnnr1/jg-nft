import type { QueryClient } from '@tanstack/react-query'

import { cartKeys } from '@/modules/cart/keys'
import { computeCartSummary, lineTotalOf } from '@/modules/cart/pricing'
import { quoteEtagOf } from '@/modules/cart/quote'
import type { Cart } from '@/modules/cart/types'
import { catalogKeys } from '@/modules/catalog/keys'
import type { CatalogListResponse, Nft } from '@/modules/catalog/types'
import { detailKeys } from '@/modules/nft-detail/queries'
import { orderKeys } from '@/modules/orders/keys'
import type { Order } from '@/modules/orders/types'

import type { NftUpdatedMessage, OrderUpdatedMessage } from './messages'

export type RealtimeOutcome = 'applied' | 'ignored'

/** Situações finais de um pedido: nenhum evento posterior pode regredi-las. */
const TERMINAL_ORDER_STATUSES: ReadonlyArray<Order['status']> = [
  'confirmed',
  'refused',
]

/**
 * Aplica eventos de tempo real no cache do TanStack Query.
 *
 * Regras de convergência:
 * - cada recurso guarda a última versão aplicada; eventos duplicados ou mais
 *   antigos que o dado já em cache são descartados (entrega idempotente);
 * - o catálogo, as recomendações e o carrinho são atualizados com o mesmo
 *   objeto que a API REST devolve, para que as duas vias não divirjam;
 * - o carrinho recalculado também refaz o `etag` da cotação com o mesmo cálculo
 *   do servidor — se algo escapar, o `If-Match` da confirmação detecta;
 * - pedidos em situação final são terminais e eventos de outra sessão nunca são
 *   aplicados.
 */
export function createRealtimeApplier(queryClient: QueryClient) {
  const appliedVersions = new Map<string, number>()

  function accept(key: string, version: number, cached = 0): boolean {
    const last = Math.max(appliedVersions.get(key) ?? 0, cached)
    if (version <= last) return false
    appliedVersions.set(key, version)
    return true
  }

  function patchNft(nft: Nft): void {
    // Listas do catálogo (início, busca, recomendações, relacionadas).
    queryClient.setQueriesData<CatalogListResponse>(
      { queryKey: catalogKeys.lists() },
      (previous) => {
        if (!previous?.items?.some((item) => item.id === nft.id)) return previous
        return {
          ...previous,
          items: previous.items.map((item) =>
            item.id === nft.id ? nft : item,
          ),
        }
      },
    )

    // Detalhe do NFT.
    queryClient.setQueryData<Nft>(detailKeys.item(nft.id), (previous) =>
      previous ? nft : previous,
    )

    // Carrinho: preço, disponibilidade e o resumo exibido.
    queryClient.setQueryData<Cart>(cartKeys.detail(), (previous) => {
      if (!previous?.items.some((item) => item.id === nft.id)) return previous

      const items = previous.items.map((item) =>
        item.id === nft.id
          ? {
              ...item,
              unitPrice: nft.price,
              available: nft.available,
              editable: nft.editable,
              lineTotal: lineTotalOf(nft.price, item.quantity),
              nft,
            }
          : item,
      )

      return {
        ...previous,
        items,
        summary: computeCartSummary(items, previous.coupon?.percentOff ?? 0),
        etag: quoteEtagOf(items, previous.coupon?.code ?? null),
      }
    })
  }

  function applyNft(message: NftUpdatedMessage): RealtimeOutcome {
    const cached =
      queryClient.getQueryData<Nft>(detailKeys.item(message.id))?.version ?? 0
    if (!accept(`nft:${message.id}`, message.version, cached)) return 'ignored'
    patchNft(message.payload)
    return 'applied'
  }

  function applyOrder(
    message: OrderUpdatedMessage,
    currentUserId: string | null,
  ): RealtimeOutcome {
    // Evento privado: só a sessão dona pode aplicá-lo.
    if (!currentUserId || message.ownerId !== currentUserId) return 'ignored'

    const cached = queryClient.getQueryData<Order>(orderKeys.detail(message.id))
    if (cached && TERMINAL_ORDER_STATUSES.includes(cached.status)) {
      return 'ignored'
    }
    if (!accept(`order:${message.id}`, message.version, cached?.version ?? 0)) {
      return 'ignored'
    }

    queryClient.setQueryData<Order>(orderKeys.detail(message.id), message.payload)
    return 'applied'
  }

  return {
    applyNft,
    applyOrder,
    /** Quantidade de recursos com versão controlada (usado nas verificações). */
    trackedResources: () => appliedVersions.size,
    reset: () => appliedVersions.clear(),
  }
}

export type RealtimeApplier = ReturnType<typeof createRealtimeApplier>

/**
 * Recursos que podem mudar por evento. Ao reconectar, só eles são
 * reconciliados com a API REST — é o que devolve o estado correto depois de
 * uma queda de conexão, sem criar uma segunda compra.
 */
const LIVE_QUERY_ROOTS: ReadonlyArray<readonly unknown[]> = [
  catalogKeys.all,
  detailKeys.all,
  cartKeys.all,
  orderKeys.all,
]

export function reconcileLiveQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: (query) =>
      LIVE_QUERY_ROOTS.some((root) => query.queryKey[0] === root[0]),
  })
}
