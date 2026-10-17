import { queryOptions } from '@tanstack/react-query'

import { fetchCollectionItems, fetchNftDetail } from './api'

export const detailKeys = {
  all: ['nft-detail'] as const,
  item: (id: string) => [...detailKeys.all, 'item', id] as const,
  collection: (id: string, collection: string) =>
    [...detailKeys.all, 'collection', id, collection] as const,
}

export function nftDetailQuery(id: string) {
  return queryOptions({
    queryKey: detailKeys.item(id),
    queryFn: () => fetchNftDetail(id),
  })
}

export function collectionRecommendationsQuery(
  id: string,
  collection: string | undefined,
) {
  return queryOptions({
    queryKey: detailKeys.collection(id, collection ?? ''),
    queryFn: () =>
      fetchCollectionItems({
        collection,
        excludeId: id,
        sort: 'recent',
        tab: 'todos',
        page: 1,
        pageSize: 10,
      }),
    enabled: Boolean(collection),
  })
}
