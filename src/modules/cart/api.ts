import { apiClient } from '@/lib/api'

import { cartSchema, type Cart } from './types'

export async function fetchCart(): Promise<Cart> {
  const response = await apiClient.get<Cart>('/cart')
  return cartSchema.parse(response.data)
}

export async function addCartItem(
  nftId: string,
  quantity: number,
): Promise<Cart> {
  const response = await apiClient.post<Cart>('/cart/items', {
    nftId,
    quantity,
  })
  return cartSchema.parse(response.data)
}

export async function updateCartItemQuantity(
  id: string,
  quantity: number,
): Promise<Cart> {
  const response = await apiClient.patch<Cart>(
    `/cart/items/${encodeURIComponent(id)}`,
    { quantity },
  )
  return cartSchema.parse(response.data)
}

export async function removeCartItem(id: string): Promise<Cart> {
  const response = await apiClient.delete<Cart>(
    `/cart/items/${encodeURIComponent(id)}`,
  )
  return cartSchema.parse(response.data)
}

export async function applyCartCoupon(code: string): Promise<Cart> {
  const response = await apiClient.post<Cart>('/cart/coupon', { code })
  return cartSchema.parse(response.data)
}

export async function removeCartCoupon(): Promise<Cart> {
  const response = await apiClient.delete<Cart>('/cart/coupon')
  return cartSchema.parse(response.data)
}
