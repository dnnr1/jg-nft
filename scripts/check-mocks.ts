import axios from 'axios'
import { setupServer } from 'msw/node'

import { handlers } from '../src/mocks/handlers'

interface MockNft {
  id: string
  name: string
  collection: string
  creator: { name: string }
  network: string
  categories: string[]
  price: string
}

const server = setupServer(...handlers)
server.listen({ onUnhandledFrame: 'bypass' })

const client = axios.create({
  baseURL: 'http://localhost/api',
  validateStatus: () => true,
})

let failures = 0

function check(condition: unknown, message: string): void {
  if (condition) {
    console.log(`  ok: ${message}`)
  } else {
    failures += 1
    console.error(`  FALHOU: ${message}`)
  }
}

async function main(): Promise<void> {
  console.log('Contrato GET /api/nfts:')

  const list = await client.get('/nfts')
  check(list.status === 200, 'status 200 na listagem padrão')
  check(list.data.total === 36, `total = 36 (recebido ${list.data.total})`)
  check(list.data.items.length === 12, 'pageSize default = 12 itens')
  check(
    list.data.facets.categories.length === 9 &&
      list.data.facets.networks.length === 3,
    'facetas globais: 9 categorias e 3 redes',
  )
  const byRelevance = await client.get('/nfts?sort=relevance')
  check(byRelevance.status === 422, 'sort=relevance removido do contrato -> 422')

  const newReleases = await client.get('/nfts?tab=novos')
  check(
    newReleases.status === 200 &&
      newReleases.data.items.length > 0 &&
      newReleases.data.items.length < 36,
      'tab=novos retorna um subconjunto de itens recentes',
  )

  const trending = await client.get('/nfts?tab=alta')
  check(
    trending.status === 200 &&
      trending.data.items.every(
        (item: MockNft) => item.favoritesCount >= 180,
      ),
      'tab=alta retorna apenas itens em alta (favoritos >= 180)',
  )

  const badTab = await client.get('/nfts?tab=qualquer')
  check(badTab.status === 422, 'tab inválido -> 422')

  const byDate = (list.data.items as MockNft[]).map(
    (item) => item.createdAt,
  )
  check(
    byDate.every(
      (date, index) => index === 0 || byDate[index - 1] >= date,
    ),
    'sem sort, listagem vem ordenada por data (recente)',
  )

  const search = await client.get('/nfts?q=golden')
  check(
    search.status === 200 &&
      search.data.total > 0 &&
      search.data.items.every(
        (item: MockNft) =>
          item.name.toLowerCase().includes('golden') ||
          item.collection.toLowerCase().includes('golden') ||
          item.creator.name.toLowerCase().includes('golden'),
      ),
    'busca "q" casa nome/coleção/criador',
  )

  const combined = await client.get(
    `/nfts?categories=${encodeURIComponent('Arte digital')}&categories=${encodeURIComponent('Fotografia')}&networks=ethereum`,
  )
  check(
    combined.status === 200 &&
      combined.data.items.every(
        (item: MockNft) =>
          (item.categories.includes('Arte digital') ||
            item.categories.includes('Fotografia')) &&
          item.network === 'ethereum',
      ),
    'filtros combináveis: (categoria OR categoria) AND rede',
  )

  const noMatch = await client.get(
    `/nfts?categories=${encodeURIComponent('Fotografia')}&networks=ethereum`,
  )
  check(
    noMatch.status === 200 &&
      noMatch.data.items.length === 0 &&
      noMatch.data.total === 0,
    'combinação sem resultados: items vazio com total 0',
  )

  const priceAsc = await client.get('/nfts?sort=price_asc&pageSize=48')
  const ascending = (priceAsc.data.items as MockNft[]).map((item) =>
    Number(item.price),
  )
  check(
    ascending.every((price, index) => index === 0 || ascending[index - 1] <= price),
    'sort=price_asc ordena por preço crescente',
  )

  const page3 = await client.get('/nfts?page=3')
  check(
    page3.status === 200 &&
      page3.data.page === 3 &&
      page3.data.items[0]?.id !== list.data.items[0]?.id,
    'paginação: página 3 com fatia distinta',
  )

  const beyond = await client.get('/nfts?page=99')
  check(
    beyond.status === 200 &&
      beyond.data.items.length === 0 &&
      beyond.data.total === 36,
    'página além do total: items vazio com total real',
  )

  const range = await client.get('/nfts?minPrice=0.02&maxPrice=12.30')
  check(
    range.status === 200 && range.data.total === 36,
    'faixa de preço completa mantém os 36 itens',
  )

  const minMax = await client.get('/nfts?minPrice=2&maxPrice=1')
  check(
    minMax.status === 422 && minMax.data.error?.code === 'VALIDATION_ERROR',
    'minPrice > maxPrice -> 422 com envelope de erro',
  )
  const badNetwork = await client.get('/nfts?networks=cardano')
  check(badNetwork.status === 422, 'rede inválida -> 422')
  const badPage = await client.get('/nfts?page=0')
  check(badPage.status === 422, 'page=0 -> 422')
  const badSort = await client.get('/nfts?sort=inexistente')
  check(badSort.status === 422, 'sort inválido -> 422')

  const detail = await client.get('/nfts/teal-motion-062')
  check(
    detail.status === 200 &&
      detail.data.name === 'Teal Motion #062' &&
      detail.data.edition?.current === 13 &&
      detail.data.edition?.total === 50 &&
      detail.data.available === 3 &&
      detail.data.rarity === 'COMUM' &&
      detail.data.reviews?.average === 3.5 &&
      detail.data.reviews?.count === 2 &&
      detail.data.images?.length === 4,
    'detalhe: teal-motion-062 com edição 13/50, estoque 3, raridade e reviews',
  )

  const missing = await client.get('/nfts/este-nao-existe')
  check(
    missing.status === 404 && missing.data.error?.code === 'NOT_FOUND',
    'detalhe inexistente -> 404 com envelope NOT_FOUND',
  )

  const byCollection = await client.get(
    `/nfts?collection=${encodeURIComponent('Kurio Editions')}&excludeId=teal-motion-062&sort=recent&tab=todos&pageSize=10`,
  )
  check(
    byCollection.status === 200 &&
      byCollection.data.items.every(
        (item: MockNft) =>
          item.collection === 'Kurio Editions' && item.id !== 'teal-motion-062',
      ),
    'recomendações: filtra por coleção e exclui o NFT atual',
  )

  console.log('Contrato POST /api/auth:')

  const loginOk = await client.post('/auth/login', {
    email: 'test123@gmail.com',
    password: '12345678',
  })
  check(
    loginOk.status === 200 &&
      loginOk.data.user?.email === 'test123@gmail.com' &&
      typeof loginOk.data.user?.id === 'string',
    'login com credenciais válidas -> 200 com usuário',
  )

  const loginWrong = await client.post('/auth/login', {
    email: 'test123@gmail.com',
    password: 'senha-errada',
  })
  check(
    loginWrong.status === 401 &&
      loginWrong.data.error?.code === 'INVALID_CREDENTIALS',
    'login com senha incorreta -> 401 INVALID_CREDENTIALS',
  )

  const loginMissing = await client.post('/auth/login', { email: '' })
  check(
    loginMissing.status === 422 &&
      loginMissing.data.error?.code === 'VALIDATION_ERROR',
    'login sem campos -> 422 VALIDATION_ERROR',
  )

  const registerDuplicate = await client.post('/auth/register', {
    name: 'Outro',
    email: 'test123@gmail.com',
    password: '12345678',
  })
  check(
    registerDuplicate.status === 409 &&
      registerDuplicate.data.error?.code === 'EMAIL_IN_USE',
    'cadastro com e-mail já usado -> 409 EMAIL_IN_USE',
  )

  const registerOk = await client.post('/auth/register', {
    name: 'Colecionadora',
    email: 'nova@kurio.test',
    password: '12345678',
  })
  check(
    registerOk.status === 201 && registerOk.data.user?.email === 'nova@kurio.test',
    'cadastro novo -> 201 com usuário criado',
  )

  const loginAfterRegister = await client.post('/auth/login', {
    email: 'nova@kurio.test',
    password: '12345678',
  })
  check(
    loginAfterRegister.status === 200,
    'login com conta recém-criada -> 200',
  )

  await server.close()

  if (failures > 0) {
    console.error(`\n${failures} check(s) falharam`)
    process.exit(1)
  }
  console.log('\nTodos os checks do contrato passaram')
}

void main()
