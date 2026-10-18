import { queryOptions } from '@tanstack/react-query'

import { fetchProfile } from './api'
import { profileKeys } from './keys'

export function profileQuery() {
  return queryOptions({
    queryKey: profileKeys.detail(),
    queryFn: fetchProfile,
    staleTime: 30_000,
  })
}
