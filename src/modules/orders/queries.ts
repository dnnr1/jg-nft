import { queryOptions } from '@tanstack/react-query'

import { fetchOrder } from './api'
import { orderKeys } from './keys'

export function orderQuery(id: string) {
  return queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchOrder(id),
    staleTime: 30_000,
  })
}
