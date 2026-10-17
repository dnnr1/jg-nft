import { apiClient } from '@/lib/api'

import {
  catalogListResponseSchema,
  type CatalogListResponse,
  type CatalogRequestParams,
} from './types'

export async function fetchCatalogPage(
  params: CatalogRequestParams,
): Promise<CatalogListResponse> {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  for (const category of params.categories ?? []) {
    query.append('categories', category)
  }
  for (const network of params.networks ?? []) {
    query.append('networks', network)
  }
  if (params.minPrice) query.set('minPrice', params.minPrice)
  if (params.maxPrice) query.set('maxPrice', params.maxPrice)
  query.set('sort', params.sort)
  query.set('page', String(params.page))
  query.set('pageSize', String(params.pageSize))

  const response = await apiClient.get<CatalogListResponse>(
    `/nfts?${query.toString()}`,
  )

  return catalogListResponseSchema.parse(response.data)
}
