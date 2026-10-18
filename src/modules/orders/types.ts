import { z } from 'zod'

import { CATALOG_NETWORKS } from '@/modules/catalog/search-params'

export const ORDER_STATUSES = ['pending', 'confirmed', 'refused'] as const

export const orderStatusSchema = z.enum(ORDER_STATUSES)

/** Snapshot de um item comprado: preserva o recibo mesmo se o catálogo mudar. */
export const orderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  tokenId: z.string().nullable(),
  quantity: z.number().int().min(1),
  unitPrice: z.string(),
  lineTotal: z.string(),
})

export const orderSummarySchema = z.object({
  editions: z.number().int().min(0),
  subtotal: z.string(),
  discount: z.string(),
  networkFee: z.string(),
  total: z.string(),
})

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  /** Hash da transação (simulado) usado no recibo e no explorador. */
  transactionId: z.string(),
  createdAt: z.string(),
  network: z.enum(CATALOG_NETWORKS),
  networkLabel: z.string(),
  walletLabel: z.string(),
  explorerUrl: z.string(),
  items: z.array(orderItemSchema),
  summary: orderSummarySchema,
  /** Motivo da recusa, preenchido apenas em pedidos recusados. */
  failureReason: z.string().nullable(),
})

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type OrderSummary = z.infer<typeof orderSummarySchema>
export type Order = z.infer<typeof orderSchema>
