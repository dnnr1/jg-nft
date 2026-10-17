import { z } from 'zod'

import type { CatalogRequestParams } from './types'

export const CATALOG_SORTS = ['recent', 'price_asc', 'price_desc'] as const

export type CatalogSort = (typeof CATALOG_SORTS)[number]

export const CATALOG_TABS = ['todos', 'novos', 'alta'] as const

export type CatalogTab = (typeof CATALOG_TABS)[number]

export const CATALOG_NETWORKS = ['ethereum', 'polygon', 'solana'] as const

export type CatalogNetwork = (typeof CATALOG_NETWORKS)[number]

export const CATEGORIES = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
] as const

const ethPriceSchema = z
  .string()
  .trim()
  .regex(/^\d{1,2}(\.\d{1,2})?$/, 'Faixa de preço inválida')
  .optional()

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  categories: z.array(z.string().trim().max(60)).optional(),
  networks: z.array(z.enum(CATALOG_NETWORKS)).optional(),
  minPrice: ethPriceSchema,
  maxPrice: ethPriceSchema,
  sort: z.enum(CATALOG_SORTS).optional(),
  tab: z.enum(CATALOG_TABS).optional(),
  page: z.coerce.number().int().min(1).max(999).optional(),
})

export type CatalogUrlSearch = {
  q?: string
  categories?: string[]
  networks?: CatalogNetwork[]
  minPrice?: string
  maxPrice?: string
  sort?: CatalogSort
  tab?: CatalogTab
  page?: number
}

export type ResolvedCatalogSearch = Required<
  Pick<CatalogUrlSearch, 'sort' | 'page' | 'tab'>
> &
  CatalogUrlSearch & { networks: CatalogNetwork[]; categories: string[] }

export const DEFAULT_SORT: CatalogSort = 'recent'
export const DEFAULT_PAGE = 1
export const PAGE_SIZE = 9

export const DEFAULT_TAB: CatalogTab = 'todos'

export function resolveCatalogSearch(
  search: CatalogUrlSearch,
): ResolvedCatalogSearch {
  return {
    q: search.q?.trim() || undefined,
    categories: search.categories?.length ? [...search.categories] : [],
    networks: search.networks?.length ? [...search.networks] : [],
    minPrice: search.minPrice || undefined,
    maxPrice: search.maxPrice || undefined,
    sort: search.sort ?? DEFAULT_SORT,
    tab: search.tab ?? DEFAULT_TAB,
    page: search.page ?? DEFAULT_PAGE,
  }
}

export function toUrlSearch(
  search: ResolvedCatalogSearch,
): Partial<CatalogUrlSearch> {
  return {
    q: search.q || undefined,
    categories: search.categories.length ? search.categories : undefined,
    networks: search.networks.length ? search.networks : undefined,
    minPrice: search.minPrice || undefined,
    maxPrice: search.maxPrice || undefined,
    sort: search.sort === DEFAULT_SORT ? undefined : search.sort,
    tab: search.tab === DEFAULT_TAB ? undefined : search.tab,
    page: search.page === DEFAULT_PAGE ? undefined : search.page,
  }
}

export function toRequestParams(
  search: ResolvedCatalogSearch,
): CatalogRequestParams {
  return {
    q: search.q,
    categories: search.categories.length ? search.categories : undefined,
    networks: search.networks.length ? search.networks : undefined,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    sort: search.sort,
    tab: search.tab,
    page: search.page,
    pageSize: PAGE_SIZE,
  }
}

export function hasActiveFilters(search: ResolvedCatalogSearch): boolean {
  return Boolean(
    search.q ||
      search.categories.length > 0 ||
      search.networks.length > 0 ||
      search.minPrice ||
      search.maxPrice ||
      search.tab !== DEFAULT_TAB,
  )
}

export const NETWORK_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export type CatalogPatchFn = (
  next: Partial<ResolvedCatalogSearch>,
  options?: { replace?: boolean },
) => void

export const SORT_OPTIONS: ReadonlyArray<{
  value: CatalogSort
  label: string
}> = [
  { value: 'recent', label: 'Listados recentemente' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
]
