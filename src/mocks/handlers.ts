import { http, HttpResponse } from 'msw/http'

import {
  CATALOG_NETWORKS,
  CATALOG_SORTS,
  CATALOG_TABS,
  CATEGORIES,
  type CatalogNetwork,
  type CatalogSort,
  type CatalogTab,
} from '@/modules/catalog/search-params'
import type { Nft } from '@/modules/catalog/types'

import { nftFixtures } from './fixtures/nfts'

const LATENCY_MS = 350

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toCents(price: string): number {
  const [whole, fraction = ''] = price.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2))
}

function validationError(message: string) {
  return HttpResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message,
        requestId: 'mock-nfts',
      },
    },
    { status: 422 },
  )
}

const PRICE_PATTERN = /^\d{1,2}(\.\d{1,2})?$/

const TRENDING_MIN_FAVORITES = 180
const NEW_RELEASE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

const newestCreatedAt = (): string =>
  nftFixtures.reduce(
    (newest, nft) => (nft.createdAt > newest ? nft.createdAt : newest),
    nftFixtures[0]?.createdAt ?? '',
  )

type IndexedNft = Nft & { index: number }

const INDEXED_FIXTURES: IndexedNft[] = nftFixtures.map((nft, index) => ({
  ...nft,
  index,
}))

function buildFacets() {
  return {
    categories: CATEGORIES.map((id) => ({
      id,
      count: nftFixtures.filter((nft) => nft.categories.includes(id)).length,
    })),
    networks: CATALOG_NETWORKS.map((id) => ({
      id,
      count: nftFixtures.filter((nft) => nft.network === id).length,
    })),
  }
}

function sortItems(
  items: IndexedNft[],
  sort: CatalogSort,
): IndexedNft[] {
  const sorted = [...items]
  sorted.sort((a, b) => {
    switch (sort) {
      case 'recent':
        return b.createdAt.localeCompare(a.createdAt) || a.index - b.index
      case 'price_asc':
        return toCents(a.price) - toCents(b.price) || a.index - b.index
      case 'price_desc':
        return toCents(b.price) - toCents(a.price) || a.index - b.index
    }
  })
  return sorted
}

export const handlers = [
  http.get('*/api/nfts', async ({ request }) => {
    await sleep(LATENCY_MS)

    const params = new URL(request.url).searchParams

    const sortParam = params.get('sort') ?? 'recent'
    if (!CATALOG_SORTS.includes(sortParam as CatalogSort)) {
      return validationError(`Ordenação inválida: ${sortParam}`)
    }

    const tabParam = params.get('tab') ?? 'todos'
    if (!CATALOG_TABS.includes(tabParam as CatalogTab)) {
      return validationError(`Aba inválida: ${tabParam}`)
    }

    const pageParam = params.get('page') ?? '1'
    if (!/^\d+$/.test(pageParam) || Number(pageParam) < 1) {
      return validationError('Parâmetro "page" deve ser um inteiro maior ou igual a 1')
    }

    const pageSizeParam = params.get('pageSize') ?? '12'
    if (
      !/^\d+$/.test(pageSizeParam) ||
      Number(pageSizeParam) < 1 ||
      Number(pageSizeParam) > 48
    ) {
      return validationError('Parâmetro "pageSize" deve estar entre 1 e 48')
    }

    const minPrice = params.get('minPrice')
    const maxPrice = params.get('maxPrice')
    if (minPrice && !PRICE_PATTERN.test(minPrice)) {
      return validationError('Parâmetro "minPrice" inválido')
    }
    if (maxPrice && !PRICE_PATTERN.test(maxPrice)) {
      return validationError('Parâmetro "maxPrice" inválido')
    }
    if (minPrice && maxPrice && toCents(minPrice) > toCents(maxPrice)) {
      return validationError('"minPrice" não pode ser maior que "maxPrice"')
    }

    const networksParam = params.getAll('networks')
    if (
      networksParam.some(
        (network) => !CATALOG_NETWORKS.includes(network as CatalogNetwork),
      )
    ) {
      return validationError('Rede inválida em "networks"')
    }

    const page = Number(pageParam)
    const pageSize = Number(pageSizeParam)
    const sort = sortParam as CatalogSort
    const tab = tabParam as CatalogTab
    const q = params.get('q')?.trim().toLowerCase()
    const categories = params.getAll('categories')
    const networks = networksParam as CatalogNetwork[]

    let items: IndexedNft[] = INDEXED_FIXTURES

    if (tab === 'novos') {
      const windowStart = new Date(newestCreatedAt()).getTime() - NEW_RELEASE_WINDOW_MS
      items = items.filter(
        (nft) => new Date(nft.createdAt).getTime() >= windowStart,
      )
    }

    if (tab === 'alta') {
      items = items.filter((nft) => nft.favoritesCount >= TRENDING_MIN_FAVORITES)
    }

    if (q) {
      items = items.filter((nft) =>
        [nft.name, nft.collection, nft.creator.name].some((field) =>
          field.toLowerCase().includes(q),
        ),
      )
    }

    if (categories.length > 0) {
      items = items.filter((nft) =>
        categories.some((category) => nft.categories.includes(category)),
      )
    }

    if (networks.length > 0) {
      items = items.filter((nft) => networks.includes(nft.network))
    }

    if (minPrice) {
      items = items.filter((nft) => toCents(nft.price) >= toCents(minPrice))
    }

    if (maxPrice) {
      items = items.filter((nft) => toCents(nft.price) <= toCents(maxPrice))
    }

    const sorted = sortItems(items, sort)
    const total = sorted.length
    const start = (page - 1) * pageSize
    const pageItems = sorted.slice(start, start + pageSize)

    return HttpResponse.json({
      items: pageItems.map(({ index: _index, ...nft }) => nft),
      facets: buildFacets(),
      page,
      pageSize,
      total,
    })
  }),
]
