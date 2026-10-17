import { queryOptions } from '@tanstack/react-query'

import { fetchCatalogPage } from './api'
import { catalogKeys } from './keys'
import type { CatalogRequestParams } from './types'

export function catalogListQuery(params: CatalogRequestParams) {
  return queryOptions({
    queryKey: catalogKeys.list(params),
    queryFn: () => fetchCatalogPage(params),
    placeholderData: (previous) => previous,
  })
}
