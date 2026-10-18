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
  WALLET_PROVIDER_IDS,
  type WalletProviderId,
} from '@/modules/checkout/constants'

import {
  AccountError,
  authenticateAccount,
  changePassword as changePasswordState,
  emailInUse,
  hasAccount,
  readProfile,
  registerAccount,
  updateProfile as updateProfileState,
} from './account-store'
import {
  CartError,
  addCartItem,
  applyCoupon,
  readCart,
  removeCartItem,
  removeCoupon,
  resetCart,
  updateCartItemQuantity,
} from './cart-store'
import {
  readIndexedNfts,
  readNft,
  readNfts,
  resetNfts,
} from './nft-store'
import {
  OrderError,
  createOrder,
  readOrder,
  resetOrders,
} from './order-store'
import {
  resetScenarioState,
  shouldFailOrderCreation,
} from './scenarios'
import { socketHandlers } from './socket'
import {
  WalletError,
  createWallet as createWalletState,
  readWallets,
  resetWallets,
  updateWallet as updateWalletState,
  type WalletPatch,
} from './wallet-store'

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

function walletErrorResponse(error: WalletError) {
  return HttpResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        requestId: 'mock-wallets',
      },
    },
    { status: error.status },
  )
}

function asWalletError(error: unknown): WalletError {
  if (error instanceof WalletError) return error
  throw error
}

function orderErrorResponse(error: OrderError) {
  return HttpResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        requestId: 'mock-orders',
      },
    },
    { status: error.status },
  )
}

function asOrderError(error: unknown): OrderError {
  if (error instanceof OrderError) return error
  throw error
}

function parseProvider(value: unknown): WalletProviderId | null {
  if (value === undefined || value === null || value === '') return null
  if (
    typeof value === 'string' &&
    (WALLET_PROVIDER_IDS as readonly string[]).includes(value)
  ) {
    return value as WalletProviderId
  }
  throw new OrderError(422, 'VALIDATION_ERROR', 'Provedor de carteira inválido')
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'boolean') return value
  throw new WalletError(
    422,
    'VALIDATION_ERROR',
    'Os campos "primary" e "connected" devem ser booleanos',
  )
}

function parseQuantity(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  return null
}

const PRICE_PATTERN = /^\d{1,2}(\.\d{1,2})?$/

function authError(
  status: number,
  code: string,
  message: string,
  field?: string,
) {
  return HttpResponse.json(
    {
      error: {
        code,
        message,
        ...(field ? { field } : {}),
        requestId: 'mock-auth',
      },
    },
    { status },
  )
}

function accountErrorResponse(error: AccountError) {
  return authError(error.status, error.code, error.message, error.field ?? undefined)
}

/**
 * Autoriza a requisição pelo token da sessão simulada (`Bearer <userId>`).
 * Sem token válido a resposta é 401, exercitando sessão expirada.
 */
function requireAccountId(request: Request): string {
  const header = request.headers.get('authorization') ?? ''
  const token = header.replace(/^Bearer\s+/i, '').trim()
  if (!token || !hasAccount(token)) {
    throw new AccountError(
      401,
      'UNAUTHORIZED',
      'Sua sessão expirou. Entre novamente para continuar.',
    )
  }
  return token
}

/**
 * Sessão da requisição quando houver. O checkout exige login, mas o pedido
 * também é aceito de um visitante (o carrinho é dele): nesse caso não há dono
 * para rotear eventos privados.
 */
function optionalAccountId(request: Request): string | null {
  const header = request.headers.get('authorization') ?? ''
  const token = header.replace(/^Bearer\s+/i, '').trim()
  return token && hasAccount(token) ? token : null
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

const newestCreatedAt = (): string => {
  const nfts = readNfts()
  return nfts.reduce(
    (newest, nft) => (nft.createdAt > newest ? nft.createdAt : newest),
    nfts[0]?.createdAt ?? '',
  )
}

type IndexedNft = Nft & { index: number }

function buildFacets() {
  const nfts = readNfts()
  return {
    categories: CATEGORIES.map((id) => ({
      id,
      count: nfts.filter((nft) => nft.categories.includes(id)).length,
    })),
    networks: CATALOG_NETWORKS.map((id) => ({
      id,
      count: nfts.filter((nft) => nft.network === id).length,
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

    let items: IndexedNft[] = readIndexedNfts()

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

    const nft = readNft(String(params.id))
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

    try {
      const account = authenticateAccount(email, password)
      return HttpResponse.json({
        user: { id: account.id, name: account.name, email: account.email },
      })
    } catch (error) {
      if (error instanceof AccountError) {
        return accountErrorResponse(error)
      }
      throw error
    }
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

    if (emailInUse(email)) {
      return authError(
        409,
        'EMAIL_IN_USE',
        'Este e-mail já está cadastrado',
        'email',
      )
    }

    try {
      const account = registerAccount({ name, email, password })
      return HttpResponse.json(
        {
          user: { id: account.id, name: account.name, email: account.email },
        },
        { status: 201 },
      )
    } catch (error) {
      if (error instanceof AccountError) {
        return accountErrorResponse(error)
      }
      throw error
    }
  }),

  http.get('*/api/profile', async ({ request }) => {
    await sleep(LATENCY_MS)

    try {
      return HttpResponse.json({
        profile: readProfile(requireAccountId(request)),
      })
    } catch (error) {
      if (error instanceof AccountError) {
        return accountErrorResponse(error)
      }
      throw error
    }
  }),

  http.patch('*/api/profile', async ({ request }) => {
    await sleep(LATENCY_MS)

    const body = await readJsonBody(request)
    try {
      return HttpResponse.json(
        updateProfileState(requireAccountId(request), body),
      )
    } catch (error) {
      if (error instanceof AccountError) {
        return accountErrorResponse(error)
      }
      throw error
    }
  }),

  http.post('*/api/profile/password', async ({ request }) => {
    await sleep(LATENCY_MS)

    const body = await readJsonBody(request)
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword =
      typeof body.newPassword === 'string' ? body.newPassword : ''

    if (!currentPassword || !newPassword) {
      return validationError('Informe a senha atual e a nova senha')
    }

    try {
      changePasswordState(
        requireAccountId(request),
        currentPassword,
        newPassword,
      )
      return HttpResponse.json({ ok: true })
    } catch (error) {
      if (error instanceof AccountError) {
        return accountErrorResponse(error)
      }
      throw error
    }
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

  http.get('*/api/wallets', async () => {
    await sleep(LATENCY_MS)
    return HttpResponse.json(readWallets())
  }),

  http.post('*/api/wallets', async ({ request }) => {
    await sleep(LATENCY_MS)

    const body = await readJsonBody(request)
    try {
      return HttpResponse.json(createWalletState(body), { status: 201 })
    } catch (error) {
      return walletErrorResponse(asWalletError(error))
    }
  }),

  http.patch('*/api/wallets/:id', async ({ params, request }) => {
    await sleep(LATENCY_MS)

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null
    if (body === null) {
      return validationError('O corpo deve conter os campos da carteira')
    }

    try {
      if (Object.keys(body).length === 0) {
        throw new WalletError(
          422,
          'VALIDATION_ERROR',
          'Informe ao menos um campo da carteira',
        )
      }
      const patch: WalletPatch = {
        ...(body as WalletPatch),
        primary: parseBoolean(body.primary),
        connected: parseBoolean(body.connected),
      }
      return HttpResponse.json(
        updateWalletState(String(params.id), patch),
      )
    } catch (error) {
      return walletErrorResponse(asWalletError(error))
    }
  }),

  http.post('*/api/orders', async ({ request }) => {
    await sleep(LATENCY_MS)

    const body = await readJsonBody(request)
    const idempotencyKey =
      request.headers.get('Idempotency-Key') ??
      (typeof body.idempotencyKey === 'string' ? body.idempotencyKey : null)
    const quoteEtag =
      request.headers.get('If-Match') ??
      (typeof body.quoteEtag === 'string' ? body.quoteEtag : null)

    try {
      const order = createOrder({
        provider: parseProvider(body.provider),
        idempotencyKey,
        ownerId: optionalAccountId(request),
        quoteEtag,
      })
      // Cenário `order-timeout`: o pedido existe no "servidor", mas a resposta
      // não chega ao cliente. A retomada com a mesma chave recupera este pedido
      // em vez de criar uma segunda compra.
      if (shouldFailOrderCreation(idempotencyKey)) {
        return HttpResponse.error()
      }
      return HttpResponse.json(order, { status: 201 })
    } catch (error) {
      return orderErrorResponse(asOrderError(error))
    }
  }),

  http.get('*/api/orders/:id', async ({ params }) => {
    await sleep(LATENCY_MS)

    const order = readOrder(String(params.id))
    if (!order) {
      return HttpResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Pedido não encontrado',
            requestId: 'mock-orders',
          },
        },
        { status: 404 },
      )
    }
    return HttpResponse.json(order)
  }),

  /**
   * Redefine o estado dos mocks para um teste/demonstração começar do zero.
   *
   * Só está disponível em desenvolvimento (não expõe isso em produção). É o
   * que dá isolamento entre testes E2E que compartilham o mesmo servidor de
   * desenvolvimento: carrinho, catálogo, pedidos, carteiras e cenários voltam
   * ao estado de semente antes de cada caso.
   */
  http.post('*/__mock-reset', async () => {
    if (import.meta.env?.DEV !== true) {
      return new HttpResponse(null, { status: 404 })
    }
    resetScenarioState()
    resetNfts()
    resetCart()
    resetOrders()
    resetWallets()
    return HttpResponse.json({ ok: true })
  }),

  // Tempo real: Socket.IO no transporte WebSocket (ver ./socket.ts).
  ...socketHandlers,
]
