import { computeCartSummary, lineTotalOf } from '@/modules/cart/pricing'
import {
  NETWORK_LABELS,
  type CatalogNetwork,
} from '@/modules/catalog/search-params'
import type { WalletProviderId } from '@/modules/checkout/constants'
import type { Order, OrderItem } from '@/modules/orders/types'

import { readCart, removeCartEntries } from './cart-store'
import { nftFixtures } from './fixtures/nfts'

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
    const nft = nftFixtures.find((item) => item.id === id)
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
  }
}

function seedState(): OrderState {
  return { orders: [demoOrder()], idempotency: [] }
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

export interface CreateOrderInput {
  provider: WalletProviderId | null
  idempotencyKey: string | null
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
  const order: Order = {
    id: `ord_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    status: 'confirmed',
    transactionId,
    createdAt: new Date().toISOString(),
    network: DEFAULT_NETWORK,
    networkLabel: NETWORK_LABELS[DEFAULT_NETWORK] ?? 'Ethereum',
    walletLabel: providerLabel(input.provider),
    explorerUrl: `https://etherscan.io/tx/${transactionId}`,
    items,
    summary: computeCartSummary(items, 0),
    failureReason: null,
  }

  state = {
    orders: [order, ...state.orders],
    idempotency: input.idempotencyKey
      ? [
          ...state.idempotency,
          { key: input.idempotencyKey, fingerprint, orderId: order.id },
        ]
      : state.idempotency,
  }
  persist()

  removeCartEntries(cart.items.map((item) => item.id))

  return order
}

/** Restaura o cenário conhecido (usado por testes e pelo reset de demonstração). */
export function resetOrders(): void {
  state = seedState()
  persist()
}
