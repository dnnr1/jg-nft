import { computeCartSummary, lineTotalOf } from '@/modules/cart/pricing'
import {
  NETWORK_LABELS,
  type CatalogNetwork,
} from '@/modules/catalog/search-params'
import type { WalletProviderId } from '@/modules/checkout/constants'
import type { Order, OrderItem } from '@/modules/orders/types'

import { readCart, removeCartEntries } from './cart-store'
import { readNft } from './nft-store'
import { publishOrderUpdated } from './realtime-bus'
import { hasScenario, scenarioDelayMs } from './scenarios'

const STORAGE_KEY = 'kurio.orders.v1'

const DEFAULT_NETWORK: CatalogNetwork = 'ethereum'

/** Rótulo curto do provedor usado na coluna "Carteira" do recibo. */
const PROVIDER_LABELS: Record<WalletProviderId, string> = {
  browser: 'Carteira do navegador',
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

/** Id do recibo de demonstração, reproduzindo o layout de referência. */
export const DEMO_ORDER_ID = 'ord_demo_20260729'

const DEMO_TRANSACTION_ID =
  '0xA91F3D7B9C2E4A6F8B1D3E5A7C9B2D4F6A8C1E82C'
const DEMO_CREATED_AT = '2026-07-29T14:32:00.000Z'

const DEMO_ENTRIES: ReadonlyArray<{ id: string; quantity: number }> = [
  { id: 'emerald-ape-042', quantity: 2 },
  { id: 'violet-nomad-314', quantity: 6 },
  { id: 'ivory-baron-088', quantity: 9 },
]

interface IdempotencyRecord {
  key: string
  /** Impressão digital do conteúdo da requisição (provedor escolhido). */
  fingerprint: string
  orderId: string
}

interface OrderState {
  orders: Order[]
  idempotency: IdempotencyRecord[]
  /** Sessão dona de cada pedido: usada para entregar `order.updated` só ao dono. */
  owners: Record<string, string>
}

export class OrderError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'OrderError'
    this.status = status
    this.code = code
  }
}

function randomTransactionId(): string {
  const hex = '0123456789ABCDEF'
  let hash = '0x'
  for (let index = 0; index < 40; index += 1) {
    hash += hex[Math.floor(Math.random() * hex.length)]
  }
  return hash
}

function providerLabel(provider: WalletProviderId | null): string {
  return provider ? PROVIDER_LABELS[provider] : PROVIDER_LABELS.browser
}

function fingerprintOf(provider: WalletProviderId | null): string {
  return provider ?? 'none'
}

/** Constrói o snapshot imutável dos itens comprados. */
function snapshotItems(
  entries: ReadonlyArray<{ id: string; quantity: number }>,
): OrderItem[] {
  return entries.flatMap(({ id, quantity }) => {
    const nft = readNft(id)
    if (!nft) return []
    return [
      {
        id,
        name: nft.name,
        image: nft.image,
        tokenId: nft.tokenId ?? null,
        quantity,
        unitPrice: nft.price,
        lineTotal: lineTotalOf(nft.price, quantity),
      },
    ]
  })
}

function demoOrder(): Order {
  const items = snapshotItems(DEMO_ENTRIES)
  return {
    id: DEMO_ORDER_ID,
    status: 'confirmed',
    transactionId: DEMO_TRANSACTION_ID,
    createdAt: DEMO_CREATED_AT,
    network: DEFAULT_NETWORK,
    networkLabel: NETWORK_LABELS[DEFAULT_NETWORK] ?? 'Ethereum',
    walletLabel: PROVIDER_LABELS.metamask,
    explorerUrl: `https://etherscan.io/tx/${DEMO_TRANSACTION_ID}`,
    items,
    summary: computeCartSummary(items, 0),
    failureReason: null,
    version: 1,
  }
}

function seedState(): OrderState {
  return { orders: [demoOrder()], idempotency: [], owners: {} }
}

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function loadState(): OrderState {
  const store = storage()
  if (!store) return seedState()
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw) as Partial<OrderState>
    return {
      orders: Array.isArray(parsed.orders) ? (parsed.orders as Order[]) : [],
      idempotency: Array.isArray(parsed.idempotency)
        ? (parsed.idempotency as IdempotencyRecord[])
        : [],
      owners:
        parsed.owners && typeof parsed.owners === 'object'
          ? (parsed.owners as Record<string, string>)
          : {},
    }
  } catch {
    return seedState()
  }
}

let state: OrderState = loadState()

function persist(): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Persistência é best-effort: os pedidos continuam válidos em memória.
  }
}

export function readOrder(id: string): Order | null {
  return state.orders.find((order) => order.id === id) ?? null
}

/** Sessão dona do pedido, quando criado por um usuário autenticado. */
export function readOrderOwner(id: string): string | null {
  return state.owners[id] ?? null
}

export interface CreateOrderInput {
  provider: WalletProviderId | null
  idempotencyKey: string | null
  /** Sessão que está comprando (token da sessão simulada). */
  ownerId?: string | null
  /**
   * ETag da cotação revisada (`If-Match`). Quando informado e diferente da
   * cotação atual, o pedido é recusado com `QUOTE_CHANGED`, o que impede fechar
   * uma compra com preço, cupom ou disponibilidade desatualizados.
   */
  quoteEtag?: string | null
}

/** Motivo exibido no recibo quando o pagamento é recusado. */
const REFUSAL_REASON = 'Pagamento recusado pela carteira escolhida'

/**
 * Situação inicial do pedido. Sem cenário ativo o pagamento é confirmado na
 * hora; com `order-pending`/`order-refused` o pedido nasce pendente para que a
 * transição chegue pelo evento `order.updated`.
 */
function initialStatus(): Order['status'] {
  return hasScenario('order-refused') || hasScenario('order-pending')
    ? 'pending'
    : 'confirmed'
}

/** Agenda a transição do cenário, publicando `order.updated` ao concluir. */
function scheduleScenarioResolution(orderId: string): void {
  const target: Order['status'] | null = hasScenario('order-refused')
    ? 'refused'
    : hasScenario('order-pending')
      ? 'confirmed'
      : null
  if (!target) return

  const timer = setTimeout(() => {
    updateOrderStatus(orderId, target)
  }, scenarioDelayMs())

  // Em Node (verificações de contrato) o timer não deve segurar o processo.
  ;(timer as unknown as { unref?: () => void }).unref?.()
}

/**
 * Muda a situação de um pedido pendente e publica `order.updated`.
 * Estados finais (confirmado/recusado) são terminais e não regridem.
 */
export function updateOrderStatus(
  id: string,
  status: Order['status'],
  failureReason: string | null = status === 'refused' ? REFUSAL_REASON : null,
): Order | null {
  const current = readOrder(id)
  if (!current || current.status !== 'pending' || status === 'pending') {
    return current
  }

  const next: Order = {
    ...current,
    status,
    failureReason,
    version: current.version + 1,
  }

  state = {
    ...state,
    orders: state.orders.map((order) => (order.id === id ? next : order)),
  }
  persist()

  const owner = readOrderOwner(id)
  if (owner) publishOrderUpdated(next, owner)

  return next
}

/**
 * Cria o pedido a partir da cotação atual do carrinho e remove do carrinho
 * apenas os itens comprados. Repetir a chamada com a mesma chave recupera o
 * mesmo pedido (sem duplicar a compra).
 */
export function createOrder(input: CreateOrderInput): Order {
  const fingerprint = fingerprintOf(input.provider)

  if (input.idempotencyKey) {
    const record = state.idempotency.find(
      (item) => item.key === input.idempotencyKey,
    )
    if (record) {
      if (record.fingerprint !== fingerprint) {
        throw new OrderError(
          409,
          'IDEMPOTENCY_CONFLICT',
          'Esta chave de idempotência já foi usada com outro conteúdo',
        )
      }
      const existing = readOrder(record.orderId)
      if (existing) return existing
    }
  }

  const cart = readCart()

  // Revalidação da cotação: a chave de idempotência é checada antes, para que
  // uma nova tentativa ainda recupere o pedido já criado.
  if (input.quoteEtag && input.quoteEtag !== cart.etag) {
    throw new OrderError(
      409,
      'QUOTE_CHANGED',
      'A cotação do carrinho mudou desde a última revisão. Revise o novo total e confirme novamente',
    )
  }

  if (cart.items.length === 0) {
    throw new OrderError(
      409,
      'EMPTY_CART',
      'Não há itens no carrinho para confirmar',
    )
  }

  const items = snapshotItems(
    cart.items.map((item) => ({ id: item.id, quantity: item.quantity })),
  )
  const transactionId = randomTransactionId()
  const status = initialStatus()
  const order: Order = {
    id: `ord_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    status,
    transactionId,
    createdAt: new Date().toISOString(),
    network: DEFAULT_NETWORK,
    networkLabel: NETWORK_LABELS[DEFAULT_NETWORK] ?? 'Ethereum',
    walletLabel: providerLabel(input.provider),
    explorerUrl: `https://etherscan.io/tx/${transactionId}`,
    items,
    summary: computeCartSummary(items, 0),
    failureReason: null,
    version: 1,
  }

  state = {
    orders: [order, ...state.orders],
    idempotency: input.idempotencyKey
      ? [
          ...state.idempotency,
          { key: input.idempotencyKey, fingerprint, orderId: order.id },
        ]
      : state.idempotency,
    owners: input.ownerId
      ? { ...state.owners, [order.id]: input.ownerId }
      : state.owners,
  }
  persist()

  removeCartEntries(cart.items.map((item) => item.id))

  // O pedido pendente só é resolvido depois: a resposta REST devolve a situação
  // pendente e a confirmação/recusa chega pelo canal de tempo real.
  if (status === 'pending') {
    scheduleScenarioResolution(order.id)
  }

  return order
}

/** Restaura o cenário conhecido (usado por testes e pelo reset de demonstração). */
export function resetOrders(): void {
  state = seedState()
  persist()
}
