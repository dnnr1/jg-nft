import { apiClient } from '@/lib/api'
import type { WalletProviderId } from '@/modules/checkout/constants'

import { orderSchema, type Order } from './types'

export interface CreateOrderPayload {
  provider: WalletProviderId | null
  /**
   * Chave de idempotência da tentativa. Reenviar com a mesma chave recupera o
   * mesmo pedido; usar a chave com outro conteúdo gera conflito.
   */
  idempotencyKey: string
}

/** Gera a chave de idempotência de uma tentativa de compra. */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const response = await apiClient.post<Order>('/orders', payload, {
    headers: { 'Idempotency-Key': payload.idempotencyKey },
  })
  return orderSchema.parse(response.data)
}

export async function fetchOrder(id: string): Promise<Order> {
  const response = await apiClient.get<Order>(
    `/orders/${encodeURIComponent(id)}`,
  )
  return orderSchema.parse(response.data)
}
