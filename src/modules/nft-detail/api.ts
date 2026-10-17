import { apiClient } from '@/lib/api'

import {
  catalogListResponseSchema,
  nftSchema,
  type CatalogListResponse,
  type CatalogRequestParams,
  type Nft,
} from '@/modules/catalog/types'

export async function fetchNftDetail(id: string): Promise<Nft> {
  const response = await apiClient.get<Nft>(`/nfts/${encodeURIComponent(id)}`)
  return nftSchema.parse(response.data)
}

export async function fetchCollectionItems(
  params: CatalogRequestParams,
): Promise<CatalogListResponse> {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.collection) query.set('collection', params.collection)
  if (params.excludeId) query.set('excludeId', params.excludeId)
  query.set('sort', params.sort)
  query.set('tab', params.tab)
  query.set('page', String(params.page))
  query.set('pageSize', String(params.pageSize))

  const response = await apiClient.get<CatalogListResponse>(
    `/nfts?${query.toString()}`,
  )
  return catalogListResponseSchema.parse(response.data)
}
