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

import {
  CartError,
  addCartItem,
  applyCoupon,
  readCart,
  removeCartItem,
  removeCoupon,
  updateCartItemQuantity,
} from './cart-store'
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

function cartErrorResponse(error: CartError) {
  return HttpResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        requestId: 'mock-cart',
      },
    },
    { status: error.status },
  )
}

function asCartError(error: unknown): CartError {
  if (error instanceof CartError) return error
  throw error
}

function parseQuantity(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  return null
}

const PRICE_PATTERN = /^\d{1,2}(\.\d{1,2})?$/

interface MockAccount {
  id: string
  name: string
  email: string
  password: string
}

const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: 'usr_test123',
    name: 'Daniel Roberto',
    email: 'test123@gmail.com',
    password: '12345678',
  },
]

function authError(status: number, code: string, message: string) {
  return HttpResponse.json(
    {
      error: {
        code,
        message,
        requestId: 'mock-auth',
      },
    },
    { status },
  )
}

function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  return request
    .json()
    .then((body) =>
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {},
    )
    .catch(() => ({}))
}

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

    const collection = params.get('collection')
    if (collection) {
      items = items.filter((nft) => nft.collection === collection)
    }

    const excludeId = params.get('excludeId')
    if (excludeId) {
      items = items.filter((nft) => nft.id !== excludeId)
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

  http.get('*/api/nfts/:id', async ({ params }) => {
    await sleep(LATENCY_MS)

    const nft = nftFixtures.find((item) => item.id === params.id)
    if (!nft) {
      return HttpResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'NFT não encontrado',
            requestId: 'mock-nfts',
          },
        },
        { status: 404 },
      )
    }
    return HttpResponse.json(nft)
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    await sleep(LATENCY_MS)

    const body = await readJsonBody(request)
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return validationError('Informe e-mail e senha')
    }

    const account = MOCK_ACCOUNTS.find((item) => item.email === email)
    if (!account || account.password !== password) {
      return authError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos')
    }

    return HttpResponse.json({
      user: { id: account.id, name: account.name, email: account.email },
    })
  }),

  http.post('*/api/auth/register', async ({ request }) => {
    await sleep(LATENCY_MS)

    const body = await readJsonBody(request)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!name || !email || !password) {
      return validationError('Preencha nome, e-mail e senha')
    }

    if (MOCK_ACCOUNTS.some((item) => item.email === email)) {
      return authError(409, 'EMAIL_IN_USE', 'Este e-mail já está cadastrado')
    }

    const account: MockAccount = {
      id: `usr_${Date.now().toString(36)}`,
      name,
      email,
      password,
    }
    MOCK_ACCOUNTS.push(account)

    return HttpResponse.json(
      {
        user: { id: account.id, name: account.name, email: account.email },
      },
      { status: 201 },
    )
  }),

  http.get('*/api/cart', async () => {
    await sleep(LATENCY_MS)
    return HttpResponse.json(readCart())
  }),

  http.post('*/api/cart/items', async ({ request }) => {
    await sleep(LATENCY_MS)

    const body = (await request.json().catch(() => null)) as
      | { nftId?: unknown; quantity?: unknown }
      | null
    if (typeof body?.nftId !== 'string') {
      return validationError('O corpo deve conter "nftId" como string')
    }
    const quantity = parseQuantity(body?.quantity)
    if (quantity === null || quantity < 1) {
      return validationError(
        'O corpo deve conter "quantity" como inteiro maior ou igual a 1',
      )
    }

    try {
      return HttpResponse.json(addCartItem(body.nftId, quantity))
    } catch (error) {
      return cartErrorResponse(asCartError(error))
    }
  }),

  http.patch('*/api/cart/items/:id', async ({ params, request }) => {
    await sleep(LATENCY_MS)

    const body = (await request.json().catch(() => null)) as
      | { quantity?: unknown }
      | null
    const quantity = parseQuantity(body?.quantity)
    if (quantity === null || quantity < 1) {
      return validationError(
        'O corpo deve conter "quantity" como inteiro maior ou igual a 1',
      )
    }

    try {
      return HttpResponse.json(
        updateCartItemQuantity(String(params.id), quantity),
      )
    } catch (error) {
      return cartErrorResponse(asCartError(error))
    }
  }),

  http.delete('*/api/cart/items/:id', async ({ params }) => {
    await sleep(LATENCY_MS)

    try {
      return HttpResponse.json(removeCartItem(String(params.id)))
    } catch (error) {
      return cartErrorResponse(asCartError(error))
    }
  }),

  http.post('*/api/cart/coupon', async ({ request }) => {
    await sleep(LATENCY_MS)

    const body = (await request.json().catch(() => null)) as
      | { code?: unknown }
      | null
    if (typeof body?.code !== 'string') {
      return validationError('O corpo deve conter "code" como string')
    }

    try {
      return HttpResponse.json(applyCoupon(body.code))
    } catch (error) {
      return cartErrorResponse(asCartError(error))
    }
  }),

  http.delete('*/api/cart/coupon', async () => {
    await sleep(LATENCY_MS)
    return HttpResponse.json(removeCoupon())
  }),
]
