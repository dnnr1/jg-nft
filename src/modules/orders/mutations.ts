import { useMutation, useQueryClient } from '@tanstack/react-query'

import { cartKeys } from '@/modules/cart/keys'

import { createOrder, type CreateOrderPayload } from './api'
import { orderKeys } from './keys'
import type { Order } from './types'

/**
 * Cria o pedido a partir do carrinho. Após a confirmação o carrinho muda no
 * servidor simulado (só os itens comprados saem), então ele é invalidado.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: (order: Order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order)
      void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}
