import { queryOptions } from '@tanstack/react-query'

import { fetchCart } from './api'
import { cartKeys } from './keys'

export function cartQuery() {
  return queryOptions({
    queryKey: cartKeys.detail(),
    queryFn: fetchCart,
    staleTime: 15_000,
  })
}
