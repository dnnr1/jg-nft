import { z } from 'zod'

import {
  CATALOG_NETWORKS,
  type CatalogNetwork,
  type CatalogSort,
  type CatalogTab,
} from './search-params'

export const nftSchema = z.object({
  id: z.string(),
  name: z.string(),
  collection: z.string(),
  creator: z.object({ id: z.string(), name: z.string() }),
  edition: z.object({ current: z.number().int(), total: z.number().int() }),
  price: z.string(),
  previousPrice: z.string().optional(),
  network: z.enum(CATALOG_NETWORKS),
  categories: z.array(z.string()),
  image: z.string(),
  images: z.array(z.string()),
  description: z.string(),
  editable: z.boolean(),
  available: z.number().int(),
  favoritesCount: z.number().int(),
  version: z.number().int(),
  updatedAt: z.string(),
  createdAt: z.string(),
})

export type Nft = z.infer<typeof nftSchema>

export const facetSchema = z.object({
  id: z.string(),
  count: z.number().int(),
})

export type Facet = z.infer<typeof facetSchema>

export const catalogListResponseSchema = z.object({
  items: z.array(nftSchema),
  facets: z.object({
    categories: z.array(facetSchema),
    networks: z.array(facetSchema),
  }),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
})

export type CatalogListResponse = z.infer<typeof catalogListResponseSchema>

export interface CatalogRequestParams {
  q?: string
  categories?: string[]
  networks?: CatalogNetwork[]
  minPrice?: string
  maxPrice?: string
  sort: CatalogSort
  tab: CatalogTab
  page: number
  pageSize: number
}
