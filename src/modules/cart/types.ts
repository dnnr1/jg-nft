import { z } from 'zod'

import { nftSchema } from '@/modules/catalog/types'

export const cartItemSchema = z.object({
  id: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.string(),
  lineTotal: z.string(),
  available: z.number().int().min(0),
  editable: z.boolean(),
  nft: nftSchema,
})

export const cartCouponSchema = z.object({
  code: z.string(),
  percentOff: z.number().min(0).max(100),
  appliedAt: z.string(),
})

export const cartSummarySchema = z.object({
  editions: z.number().int().min(0),
  subtotal: z.string(),
  discount: z.string(),
  networkFee: z.string(),
  total: z.string(),
})

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  coupon: cartCouponSchema.nullable(),
  summary: cartSummarySchema,
  version: z.number().int(),
  updatedAt: z.string(),
})

export type CartItem = z.infer<typeof cartItemSchema>
export type CartCoupon = z.infer<typeof cartCouponSchema>
export type CartSummary = z.infer<typeof cartSummarySchema>
export type Cart = z.infer<typeof cartSchema>

/** Linha precificável mínima para o cálculo do resumo. */
export interface PricedLine {
  unitPrice: string
  quantity: number
}
