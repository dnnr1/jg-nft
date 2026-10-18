import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'

import type { Nft } from '@/modules/catalog/types'

import {
  addCartItem,
  applyCartCoupon,
  removeCartCoupon,
  removeCartItem,
  updateCartItemQuantity,
} from './api'
import { cartKeys } from './keys'
import { computeCartSummary, lineTotalOf } from './pricing'
import type { Cart } from './types'

function writeCart(queryClient: QueryClient, cart: Cart): void {
  queryClient.setQueryData(cartKeys.detail(), cart)
}

/** Prévia otimista da inclusão de um NFT no carrinho. */
function previewAddition(cart: Cart, nft: Nft, quantity: number): Cart {
  const existing = cart.items.find((item) => item.id === nft.id)
  const next = Math.min(
    (existing?.quantity ?? 0) + quantity,
    Math.max(1, nft.available),
  )

  const items = existing
    ? cart.items.map((item) =>
        item.id === nft.id
          ? { ...item, quantity: next, lineTotal: lineTotalOf(item.unitPrice, next) }
          : item,
      )
    : [
        ...cart.items,
        {
          id: nft.id,
          quantity: next,
          unitPrice: nft.price,
          lineTotal: lineTotalOf(nft.price, next),
          available: nft.available,
          editable: nft.editable,
          nft,
        },
      ]

  return {
    ...cart,
    items,
    summary: computeCartSummary(items, cart.coupon?.percentOff ?? 0),
  }
}

/** Prévia otimista de uma alteração de quantidade, recalculando o resumo. */
function previewQuantity(cart: Cart, id: string, quantity: number): Cart {
  const items = cart.items.map((item) => {
    if (item.id !== id) return item
    const next = Math.min(Math.max(1, quantity), Math.max(1, item.available))
    return { ...item, quantity: next, lineTotal: lineTotalOf(item.unitPrice, next) }
  })
  return {
    ...cart,
    items,
    summary: computeCartSummary(items, cart.coupon?.percentOff ?? 0),
  }
}

/** Prévia otimista da remoção de um item. */
function previewRemoval(cart: Cart, id: string): Cart {
  const items = cart.items.filter((item) => item.id !== id)
  return {
    ...cart,
    items,
    summary: computeCartSummary(items, cart.coupon?.percentOff ?? 0),
  }
}

interface MutationContext {
  previous?: Cart
}

export function useAddCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ nft, quantity }: { nft: Nft; quantity: number }) =>
      addCartItem(nft.id, quantity),
    onMutate: async ({ nft, quantity }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() })
      const previous = queryClient.getQueryData<Cart>(cartKeys.detail())
      if (previous) {
        writeCart(queryClient, previewAddition(previous, nft, quantity))
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) writeCart(queryClient, context.previous)
    },
    onSuccess: (cart) => writeCart(queryClient, cart),
  })
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      updateCartItemQuantity(id, quantity),
    onMutate: async ({ id, quantity }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() })
      const previous = queryClient.getQueryData<Cart>(cartKeys.detail())
      if (previous) {
        writeCart(queryClient, previewQuantity(previous, id, quantity))
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) writeCart(queryClient, context.previous)
    },
    onSuccess: (cart) => writeCart(queryClient, cart),
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onMutate: async (id): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() })
      const previous = queryClient.getQueryData<Cart>(cartKeys.detail())
      if (previous) {
        writeCart(queryClient, previewRemoval(previous, id))
      }
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) writeCart(queryClient, context.previous)
    },
    onSuccess: (cart) => writeCart(queryClient, cart),
  })
}

export function useApplyCartCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => applyCartCoupon(code),
    onSuccess: (cart) => writeCart(queryClient, cart),
  })
}

export function useRemoveCartCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => removeCartCoupon(),
    onSuccess: (cart) => writeCart(queryClient, cart),
  })
}
