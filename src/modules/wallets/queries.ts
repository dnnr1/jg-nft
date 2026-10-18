import { queryOptions } from '@tanstack/react-query'

import { fetchWallets } from './api'
import { walletsKeys } from './keys'

export function walletsQuery() {
  return queryOptions({
    queryKey: walletsKeys.list(),
    queryFn: fetchWallets,
    staleTime: 30_000,
  })
}
