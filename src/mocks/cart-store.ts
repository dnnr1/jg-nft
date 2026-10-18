import { computeCartSummary, lineTotalOf } from '@/modules/cart/pricing'
import type { Cart, CartCoupon } from '@/modules/cart/types'

import { nftFixtures } from './fixtures/nfts'

const STORAGE_KEY = 'kurio.cart.v1'

/** Carrinho inicial do cenário de demonstração. */
const SEED_ENTRIES: ReadonlyArray<{ id: string; quantity: number }> = [
  { id: 'emerald-ape-042', quantity: 2 },
  { id: 'violet-nomad-314', quantity: 6 },
  { id: 'ivory-baron-088', quantity: 9 },
]

interface CouponDefinition {
  percentOff: number
  expiresAt: string | null
}

export const COUPON_CATALOG: Record<string, CouponDefinition> = {
  KURIO10: { percentOff: 10, expiresAt: null },
  CURADOR20: { percentOff: 20, expiresAt: null },
  EXPIRADO: { percentOff: 15, expiresAt: '2025-01-01T00:00:00.000Z' },
}

interface CartEntry {
  id: string
  quantity: number
}

interface CartState {
  entries: CartEntry[]
  couponCode: string | null
  couponAppliedAt: string | null
  updatedAt: string
  version: number
}

export class CartError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'CartError'
    this.status = status
    this.code = code
  }
}

function seedState(): CartState {
  return {
    entries: SEED_ENTRIES.map((entry) => ({ ...entry })),
    couponCode: null,
    couponAppliedAt: null,
    updatedAt: new Date().toISOString(),
    version: 1,
  }
}

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function loadState(): CartState {
  const store = storage()
  if (!store) return seedState()
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw) as Partial<CartState>
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries
          .filter(
            (entry): entry is CartEntry =>
              typeof entry?.id === 'string' &&
              Number.isInteger(entry?.quantity) &&
              (entry.quantity as number) > 0,
          )
          .map((entry) => ({ id: entry.id, quantity: entry.quantity }))
      : []
    return {
      entries,
      couponCode:
        typeof parsed.couponCode === 'string' ? parsed.couponCode : null,
      couponAppliedAt:
        typeof parsed.couponAppliedAt === 'string'
          ? parsed.couponAppliedAt
          : null,
      updatedAt:
        typeof parsed.updatedAt === 'string'
          ? parsed.updatedAt
          : new Date().toISOString(),
      version: Number.isInteger(parsed.version) ? (parsed.version as number) : 1,
    }
  } catch {
    return seedState()
  }
}

let state: CartState = loadState()

function persist(): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Persistência é best-effort: o carrinho continua válido em memória.
  }
}

function commit(next: Partial<CartState>): Cart {
  state = {
    ...state,
    ...next,
    updatedAt: new Date().toISOString(),
    version: state.version + 1,
  }
  persist()
  return readCart()
}

function resolveCoupon(code: string | null): CartCoupon | null {
  if (!code) return null
  const definition = COUPON_CATALOG[code]
  if (!definition) return null
  if (definition.expiresAt && new Date(definition.expiresAt).getTime() <= Date.now()) {
    return null
  }
  return {
    code,
    percentOff: definition.percentOff,
    appliedAt: state.couponAppliedAt ?? new Date().toISOString(),
  }
}

/** Monta a resposta atual do carrinho a partir do estado em memória. */
export function readCart(): Cart {
  const items = state.entries.flatMap((entry) => {
    const nft = nftFixtures.find((item) => item.id === entry.id)
    if (!nft) return []
    return [
      {
        id: entry.id,
        quantity: entry.quantity,
        unitPrice: nft.price,
        lineTotal: lineTotalOf(nft.price, entry.quantity),
        available: nft.available,
        editable: nft.editable,
        nft,
      },
    ]
  })

  const coupon = resolveCoupon(state.couponCode)
  const summary = computeCartSummary(items, coupon?.percentOff ?? 0)

  return {
    items,
    coupon,
    summary,
    version: state.version,
    updatedAt: state.updatedAt,
  }
}

export function updateCartItemQuantity(id: string, quantity: number): Cart {
  const entry = state.entries.find((item) => item.id === id)
  const nft = nftFixtures.find((item) => item.id === id)

  if (!entry || !nft) {
    throw new CartError(404, 'NOT_FOUND', 'Item não encontrado no carrinho')
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new CartError(
      422,
      'VALIDATION_ERROR',
      'A quantidade deve ser um inteiro maior ou igual a 1',
    )
  }
  if (quantity > nft.available) {
    throw new CartError(
      409,
      'AVAILABILITY_CONFLICT',
      `Restam apenas ${nft.available} edições de ${nft.name}`,
    )
  }

  return commit({
    entries: state.entries.map((item) =>
      item.id === id ? { ...item, quantity } : item,
    ),
  })
}

export function removeCartItem(id: string): Cart {
  if (!state.entries.some((item) => item.id === id)) {
    throw new CartError(404, 'NOT_FOUND', 'Item não encontrado no carrinho')
  }
  return commit({ entries: state.entries.filter((item) => item.id !== id) })
}

/**
 * Remove do carrinho os itens comprados (usado após a confirmação do pedido).
 * O cupom também é consumido, já que valia para o carrinho anterior.
 */
export function removeCartEntries(ids: readonly string[]): Cart {
  const purchased = new Set(ids)
  const remaining = state.entries.filter((entry) => !purchased.has(entry.id))
  if (remaining.length === state.entries.length) return readCart()
  return commit({
    entries: remaining,
    couponCode: null,
    couponAppliedAt: null,
  })
}

/**
 * Adiciona edições de um NFT ao carrinho. Quando o NFT já está no carrinho as
 * quantidades são somadas, nunca ultrapassando a disponibilidade do catálogo.
 */
export function addCartItem(id: string, quantity: number): Cart {
  const nft = nftFixtures.find((item) => item.id === id)
  if (!nft) {
    throw new CartError(404, 'NOT_FOUND', 'NFT não encontrado no catálogo')
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new CartError(
      422,
      'VALIDATION_ERROR',
      'A quantidade deve ser um inteiro maior ou igual a 1',
    )
  }
  if (!nft.editable || nft.available === 0) {
    throw new CartError(
      409,
      'AVAILABILITY_CONFLICT',
      `${nft.name} não está disponível para compra no momento`,
    )
  }

  const entry = state.entries.find((item) => item.id === id)
  const nextQuantity = (entry?.quantity ?? 0) + quantity
  if (nextQuantity > nft.available) {
    throw new CartError(
      409,
      'AVAILABILITY_CONFLICT',
      `Restam apenas ${nft.available} edições de ${nft.name}`,
    )
  }

  const entries = entry
    ? state.entries.map((item) =>
        item.id === id ? { ...item, quantity: nextQuantity } : item,
      )
    : [...state.entries, { id, quantity: nextQuantity }]

  return commit({ entries })
}

export function applyCoupon(code: string): Cart {
  const normalized = code.trim().toUpperCase()
  if (!normalized) {
    throw new CartError(422, 'VALIDATION_ERROR', 'Informe um código promocional')
  }

  const definition = COUPON_CATALOG[normalized]
  if (!definition) {
    throw new CartError(404, 'COUPON_NOT_FOUND', 'Cupom inválido ou inexistente')
  }
  if (
    definition.expiresAt &&
    new Date(definition.expiresAt).getTime() <= Date.now()
  ) {
    throw new CartError(410, 'COUPON_EXPIRED', 'Este cupom está expirado')
  }

  return commit({ couponCode: normalized, couponAppliedAt: new Date().toISOString() })
}

export function removeCoupon(): Cart {
  return commit({ couponCode: null, couponAppliedAt: null })
}

/** Restaura o cenário conhecido (usado por testes e pelo reset de demonstração). */
export function resetCart(): Cart {
  state = seedState()
  persist()
  return readCart()
}
