/**
 * Verificações do camada de tempo real fora do navegador:
 *
 * 1. O aplicador puro (`createRealtimeApplier`): guardas de versão, dono da
 *    sessão, estados terminais e idempotência da entrega.
 * 2. O contrato HTTP dos mocks (MSW): `QUOTE_CHANGED` com `If-Match` desatualizado,
 *    recuperação por chave de idempotência e conflito de conteúdo.
 *
 * Rodar com: `npm run check:realtime` (`tsx scripts/check-realtime.ts`).
 */

import { QueryClient } from '@tanstack/react-query'

import { cartKeys } from '../src/modules/cart/keys'
import { computeCartSummary, lineTotalOf } from '../src/modules/cart/pricing'
import {
  quoteEtagOf,
  type QuoteLine,
} from '../src/modules/cart/quote'
import { catalogKeys } from '../src/modules/catalog/keys'
import { detailKeys } from '../src/modules/nft-detail/queries'
import { orderKeys } from '../src/modules/orders/keys'
import { createRealtimeApplier } from '../src/modules/realtime/apply'
import { orderUpdatedMessageSchema, nftUpdatedMessageSchema } from '../src/modules/realtime/messages'
import { readNfts } from '../src/mocks/nft-store'
import { setupServer } from 'msw/node'
import { handlers } from '../src/mocks/handlers'
import axios from 'axios'

let failures = 0

function check(condition: unknown, message: string): void {
  if (condition) {
    console.log(`  ok: ${message}`)
  } else {
    failures += 1
    console.error(`  FALHOU: ${message}`)
  }
}

function now(): string {
  return new Date().toISOString()
}

async function applierChecks(): Promise<void> {
  const queryClient = new QueryClient()

  const nft = readNfts()[0]
  if (!nft) throw new Error('catálogo sem itens')

  const lines: QuoteLine[] = [
    { id: nft.id, quantity: 2, unitPrice: nft.price, available: nft.available },
  ]
  const cart = {
    items: [
      {
        id: nft.id,
        quantity: 2,
        unitPrice: nft.price,
        lineTotal: lineTotalOf(nft.price, 2),
        available: nft.available,
        editable: true,
        nft,
      },
    ],
    coupon: null,
    summary: computeCartSummary(lines, 0),
    version: 1,
    updatedAt: now(),
    etag: quoteEtagOf(lines, null),
  }
  queryClient.setQueryData(cartKeys.detail(), cart)
  queryClient.setQueryData(detailKeys.item(nft.id), nft)
  queryClient.setQueryData(catalogKeys.lists(), {
    items: [nft],
    page: 1,
    pageSize: 12,
    total: 1,
    facets: { categories: [], networks: [] },
  })

  const applier = createRealtimeApplier(queryClient)

  const updatedNft = { ...nft, price: '2.50', available: 3 }
  const nftMessage = nftUpdatedMessageSchema.parse({
    event: 'nft.updated',
    resource: 'nft',
    id: nft.id,
    version: 2,
    emittedAt: now(),
    payload: updatedNft,
  })

  // 1. Evento aplicado: catálogo, detalhe e carrinho são atualizados.
  check(applier.applyNft(nftMessage) === 'applied', 'nft.updated aplicado')
  const patchedCart = queryClient.getQueryData(cartKeys.detail())
  check(
    patchedCart?.items.some(
      (item) => item.id === nft.id && item.unitPrice === '2.50',
    ),
    'carrinho recebe o novo preço do evento',
  )
  check(
    patchedCart?.etag === quoteEtagOf(
      [{ id: nft.id, quantity: 2, unitPrice: '2.50', available: 3 }],
      null,
    ),
    'etag do carrinho é recalculado após o evento',
  )
  check(
    queryClient.getQueryData(detailKeys.item(nft.id))?.price === '2.50',
    'detalhe do NFT recebe o novo preço',
  )

  // 2. Duplicata/versão antiga é descartada.
  check(
    applier.applyNft(nftMessage) === 'ignored',
    'nft.ueditado duplicado é ignorado',
  )
  const oldMessage = nftUpdatedMessageSchema.parse({
    ...nftMessage,
    version: 1,
  })
  check(applier.applyNft(oldMessage) === 'ignored', 'versão antiga é ignorada')

  const orderBase = {
    id: 'ord_teste',
    status: 'pending' as const,
    transactionId: '0xabc',
    createdAt: now(),
    network: 'ethereum' as const,
    networkLabel: 'Ethereum',
    walletLabel: 'Carteira do navegador',
    explorerUrl: 'https://etherscan.io/tx/0xabc',
    items: [
      {
        id: nft.id,
        name: nft.name,
        image: nft.image,
        tokenId: null,
        quantity: 1,
        unitPrice: nft.price,
        lineTotal: nft.price,
      },
    ],
    summary: computeCartSummary([{ unitPrice: nft.price, quantity: 1 }], 0),
    failureReason: null,
    version: 1,
  }

  // 3. Evento privado só é aplicado ao dono da sessão.
  const orderMessage = orderUpdatedMessageSchema.parse({
    event: 'order.updated',
    resource: 'order',
    id: orderBase.id,
    ownerId: 'usr_alice',
    version: 2,
    emittedAt: now(),
    payload: { ...orderBase, status: 'confirmed', version: 2 },
  })
  queryClient.setQueryData(orderKeys.detail(orderBase.id), orderBase)
  check(
    applier.applyOrder(orderMessage, 'usr_bob') === 'ignored',
    'order.updated de outra sessão é ignorado',
  )

  // 4. Mesmo dono, versão maior: aplicado.
  check(
    applier.applyOrder(orderMessage, 'usr_alice') === 'applied',
    'order.updated do dono é aplicado',
  )

  // 5. Estado terminal é blindado: não regredir.
  const terminalMessage = orderUpdatedMessageSchema.parse({
    ...orderMessage,
    version: 3,
    payload: { ...orderBase, status: 'refused', version: 3 },
  })
  check(
    applier.applyOrder(terminalMessage, 'usr_alice') === 'ignored',
    'evento sobre estado terminal é ignorado',
  )

  // 6. Versão menor/igual após aplicação é ignorada.
  check(
    applier.applyOrder(orderMessage, 'usr_alice') === 'ignored',
    'versão não crescente é ignorada',
  )

  check(applier.trackedResources() > 0, 'recursos rastreados pelo aplicador')
  applier.reset()
  check(applier.trackedResources() === 0, 'reset limpa o rastreador')
}

async function httpChecks(): Promise<void> {
  const server = setupServer(...handlers)
  server.listen({ onUnhandledFrame: 'bypass' })
  const client = axios.create({
    baseURL: 'http://localhost/api',
    validateStatus: () => true,
  })

  try {
    const cart = await client.get('/cart')
    check(cart.status === 200, 'GET /api/carrito -> 200')
    const etag = cart.data.etag
    check(typeof etag === 'string' && etag.length > 0, 'carrinho tem etag')

    const key = `ord-check-${Date.now()}`
    const created = await client.post(
      '/orders',
      { provider: null, idempotencyKey: key },
      { headers: { 'If-Match': etag } },
    )
    check(created.status === 201, 'POST /api/orders com etag válido -> 201')
    const orderId = created.data.id

    // Mesma chave recupera o mesmo pedido (idempotência).
    const recovered = await client.post(
      '/orders',
      { provider: null, idempotencyKey: key },
      { headers: { 'If-Match': etag } },
    )
    check(recovered.status === 201, 'repetição com mesma chave -> 201')
    check(recovered.data.id === orderId, 'mesma chave recupera o mesmo pedido')

    // Conteúdo diferente com a mesma chave gera conflito.
    const conflict = await client.post(
      '/orders',
      { provider: 'metamask', idempotencyKey: key },
      { headers: { 'If-Match': etag } },
    )
    check(conflict.status === 409, 'mesma chave, outro conteúdo -> 409')
    check(conflict.data.error.code === 'IDEMPOTENCY_CONFLICT', 'código IDEMPOTENCY_CONFLICT')

    // Depois de criar, o carrinho esvazia e o etag muda: o If-Match antigo é recusado.
    const stale = await client.post(
      '/orders',
      { provider: null, idempotencyKey: `ord-check-stale-${Date.now()}` },
      { headers: { 'If-Match': etag } },
    )
    check(stale.status === 409, 'If-Match desatualizado -> 409 QUOTE_CHANGED')
    check(stale.data.error.code === 'QUOTE_CHANGED', 'código QUOTE_CHANGED')

    // Consulta do pedido criado.
    const fetched = await client.get(`/orders/${orderId}`)
    check(fetched.status === 200, 'GET /api/orders/:id -> 201/200')
    check(fetched.data.id === orderId, 'pedido consultado é o criado')
  } finally {
    server.close()
  }
}

async function main(): Promise<void> {
  console.log('Aplicador de tempo real:')
  await applierChecks()

  console.log('Contrato HTTP dos mocks:')
  await httpChecks()

  if (failures > 0) {
    console.error(`\n${failures} verificação(ões) falharam`)
    process.exit(1)
  }
  console.log('\nTodas as verificações de tempo real passaram')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
