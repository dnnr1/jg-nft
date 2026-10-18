import axios from 'axios'
import { setupServer } from 'msw/node'

import { resetCart } from '../src/mocks/cart-store'
import { resetAccounts } from '../src/mocks/account-store'
import { handlers } from '../src/mocks/handlers'
import { DEMO_ORDER_ID, resetOrders } from '../src/mocks/order-store'
import { resetWallets } from '../src/mocks/wallet-store'
import { collectorPrefill, collectorPrefillKey } from '../src/modules/checkout/prefill'
import { profileResponseSchema } from '../src/modules/profile/types'
import { walletsResponseSchema } from '../src/modules/wallets/types'

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

  console.log('\nContrato /api/cart:')

  resetCart()
  const cart = await client.get('/cart')
  check(cart.status === 200, 'status 200 na consulta do carrinho')
  check(cart.data.items.length === 3, 'cenário inicial com 3 itens')
  check(cart.data.summary.editions === 17, 'total de edições = 17')
  check(
    cart.data.summary.subtotal === '26.83',
    `subtotal = 26.83 (recebido ${cart.data.summary.subtotal})`,
  )
  check(
    cart.data.summary.networkFee === '0.016',
    `taxa de rede = 0.016 (recebido ${cart.data.summary.networkFee})`,
  )
  check(
    cart.data.summary.total === '26.846',
    `total = 26.846 (recebido ${cart.data.summary.total})`,
  )
  check(
    cart.data.items.every(
      (item: { lineTotal: string; unitPrice: string; quantity: number }) =>
        Number(item.lineTotal).toFixed(2) ===
        (Number(item.unitPrice) * item.quantity).toFixed(2),
    ),
    'total de cada linha = preço unitário × quantidade',
  )

  const updated = await client.patch('/cart/items/violet-nomad-314', {
    quantity: 3,
  })
  check(
    updated.status === 200 &&
      updated.data.items.find(
        (item: { id: string }) => item.id === 'violet-nomad-314',
      )?.quantity === 3,
    'PATCH de quantidade atualiza o item',
  )
  check(
    updated.data.summary?.subtotal === '22.66',
    `subtotal após alteração = 22.66 (recebido ${updated.data.summary?.subtotal})`,
  )

  const overflow = await client.patch('/cart/items/emerald-ape-042', {
    quantity: 999,
  })
  check(
    overflow.status === 409 &&
      overflow.data.error?.code === 'AVAILABILITY_CONFLICT',
    'quantidade acima da disponibilidade -> 409',
  )

  const zero = await client.patch('/cart/items/emerald-ape-042', { quantity: 0 })
  check(zero.status === 422, 'quantidade inválida -> 422')

  const missingItem = await client.patch('/cart/items/nao-existe', {
    quantity: 2,
  })
  check(
    missingItem.status === 404 && missingItem.data.error?.code === 'NOT_FOUND',
    'item inexistente -> 404',
  )

  resetCart()
  const badCoupon = await client.post('/cart/coupon', { code: 'NAOEXISTE' })
  check(
    badCoupon.status === 404 && badCoupon.data.error?.code === 'COUPON_NOT_FOUND',
    'cupom inválido -> 404',
  )

  const expiredCoupon = await client.post('/cart/coupon', { code: 'EXPIRADO' })
  check(
    expiredCoupon.status === 410 &&
      expiredCoupon.data.error?.code === 'COUPON_EXPIRED',
    'cupom expirado -> 410',
  )

  const applied = await client.post('/cart/coupon', { code: 'kurio10' })
  check(
    applied.status === 200 &&
      applied.data.coupon?.code === 'KURIO10' &&
      applied.data.summary?.discount === '2.683' &&
      applied.data.summary?.total === '24.163',
    'cupom válido aplica 10% e recalcula o total',
  )

  const couponRemoved = await client.delete('/cart/coupon')
  check(
    couponRemoved.status === 200 &&
      couponRemoved.data.coupon === null &&
      couponRemoved.data.summary?.discount === '0.00',
    'remoção do cupom zera o desconto',
  )

  const removed = await client.delete('/cart/items/ivory-baron-088')
  check(
    removed.status === 200 && removed.data.items.length === 2,
    'DELETE remove o item do carrinho',
  )

  resetCart()
  const added = await client.post('/cart/items', {
    nftId: 'cosmic-bloom-118',
    quantity: 2,
  })
  check(
    added.status === 200 &&
      added.data.items.length === 4 &&
      added.data.items.find(
        (item: { id: string }) => item.id === 'cosmic-bloom-118',
      )?.quantity === 2,
    'POST adiciona um NFT novo ao carrinho',
  )
  check(
    added.data.summary?.editions === 19 && added.data.summary?.subtotal === '29.41',
    `resumo após inclusão: 19 edições e 29.41 (recebido ${added.data.summary?.editions} e ${added.data.summary?.subtotal})`,
  )

  const merged = await client.post('/cart/items', {
    nftId: 'cosmic-bloom-118',
    quantity: 1,
  })
  check(
    merged.status === 200 &&
      merged.data.items.length === 4 &&
      merged.data.items.find(
        (item: { id: string }) => item.id === 'cosmic-bloom-118',
      )?.quantity === 3,
    'POST soma a quantidade quando o NFT já está no carrinho',
  )

  const addOverflow = await client.post('/cart/items', {
    nftId: 'emerald-ape-042',
    quantity: 24,
  })
  check(
    addOverflow.status === 409 &&
      addOverflow.data.error?.code === 'AVAILABILITY_CONFLICT',
    'POST que ultrapassa a disponibilidade -> 409',
  )

  const addUnavailable = await client.post('/cart/items', {
    nftId: 'teal-motion-062',
    quantity: 1,
  })
  check(
    addUnavailable.status === 409 &&
      addUnavailable.data.error?.code === 'AVAILABILITY_CONFLICT',
    'POST de NFT não editável -> 409',
  )

  const addMissing = await client.post('/cart/items', {
    nftId: 'nao-existe',
    quantity: 1,
  })
  check(
    addMissing.status === 404 && addMissing.data.error?.code === 'NOT_FOUND',
    'POST de NFT inexistente -> 404',
  )

  const addInvalid = await client.post('/cart/items', {
    nftId: 'cosmic-bloom-118',
    quantity: 0,
  })
  check(addInvalid.status === 422, 'POST com quantidade inválida -> 422')

  const addNoNft = await client.post('/cart/items', { quantity: 1 })
  check(addNoNft.status === 422, 'POST sem nftId -> 422')

  resetCart()
  const restored = await client.get('/cart')
  check(
    restored.data.items.length === 3 &&
      restored.data.summary?.total === '26.846',
    'reset restaura o cenário conhecido',
  )

  console.log('\nContrato /api/wallets:')

  resetWallets()
  const wallets = await client.get('/wallets')
  check(
    wallets.status === 200 && wallets.data.items.length === 2,
    'status 200 com duas carteiras cadastradas',
  )
  check(
    wallets.data.items.some(
      (wallet: { id: string; ens?: string }) =>
        wallet.id === 'wallet-reserva' && wallet.ens === 'nova.kurio.eth',
    ),
    'carteira Reserva expõe o ENS nova.kurio.eth',
  )
  check(
    wallets.data.items.filter((wallet: { connected: boolean }) => wallet.connected)
      .length === 1,
    'apenas uma carteira conectada no cenário inicial',
  )

  const connected = await client.patch('/wallets/wallet-principal', {
    connected: true,
  })
  check(
    connected.status === 200 &&
      connected.data.items.find(
        (wallet: { id: string }) => wallet.id === 'wallet-principal',
      )?.connected === true &&
      connected.data.items.find(
        (wallet: { id: string }) => wallet.id === 'wallet-reserva',
      )?.connected === false,
    'PATCH connected move a conexão para a carteira escolhida',
  )

  const primary = await client.patch('/wallets/wallet-reserva', {
    primary: true,
  })
  check(
    primary.data.items.filter((wallet: { primary: boolean }) => wallet.primary)
      .length === 1 &&
      primary.data.items.find(
        (wallet: { id: string }) => wallet.id === 'wallet-reserva',
      )?.primary === true,
    'PATCH primary mantém apenas uma carteira principal',
  )

  const badWallet = await client.patch('/wallets/nao-existe', {
    connected: true,
  })
  check(
    badWallet.status === 404 && badWallet.data.error?.code === 'NOT_FOUND',
    'carteira inexistente -> 404',
  )

  const badWalletBody = await client.patch('/wallets/wallet-reserva', {})
  check(badWalletBody.status === 422, 'PATCH sem campos -> 422')

  const WALLET_FORM_BODY = {
    displayName: 'Daniel Roberto',
    label: 'Secundária',
    network: 'ethereum',
    profileName: 'daniel.rbrt',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    secondaryWallet: '',
    type: 'secundaria',
    referralCode: 'KURIO-SEC',
    email: 'test123@gmail.com',
    ensName: 'danielsec',
    ensDomain: '.eth',
  }

  const createdWallet = await client.post('/wallets', WALLET_FORM_BODY)
  check(
    createdWallet.status === 201 && createdWallet.data.items.length === 3,
    'POST cadastra uma nova carteira',
  )
  check(
    createdWallet.data.items.find(
      (wallet: { label: string }) => wallet.label === 'Secundária',
    )?.ens === 'danielsec.eth',
    'cadastro compõe o ENS a partir do nome e do domínio',
  )

  const createdPrimary = await client.post('/wallets', {
    ...WALLET_FORM_BODY,
    label: 'Nova principal',
    type: 'principal',
  })
  check(
    createdPrimary.status === 201 &&
      createdPrimary.data.items.filter(
        (wallet: { primary: boolean }) => wallet.primary,
      ).length === 1 &&
      createdPrimary.data.items.find(
        (wallet: { label: string }) => wallet.label === 'Nova principal',
      )?.primary === true,
    'cadastro de principal rebaixa a principal anterior',
  )

  const invalidWallet = await client.post('/wallets', {
    ...WALLET_FORM_BODY,
    email: 'sem-arroba',
  })
  check(invalidWallet.status === 422, 'cadastro com e-mail inválido -> 422')

  const incompleteWallet = await client.post('/wallets', { label: 'X' })
  check(incompleteWallet.status === 422, 'cadastro incompleto -> 422')

  const editedWallet = await client.patch('/wallets/wallet-principal', {
    ...WALLET_FORM_BODY,
    label: 'Principal editada',
    network: 'solana',
    type: 'principal',
  })
  check(
    editedWallet.status === 200 &&
      editedWallet.data.items.find(
        (wallet: { id: string }) => wallet.id === 'wallet-principal',
      )?.label === 'Principal editada' &&
      editedWallet.data.items.find(
        (wallet: { id: string }) => wallet.id === 'wallet-principal',
      )?.network === 'solana',
    'PATCH edita os campos do cadastro de carteira',
  )

  resetWallets()
  const walletsReset = await client.get('/wallets')
  check(
    walletsReset.data.items.find(
      (wallet: { id: string }) => wallet.id === 'wallet-reserva',
    )?.connected === true,
    'reset das carteiras restaura o cenário conhecido',
  )

  console.log('\nContrato /api/profile:')

  resetAccounts()

  const PROFILE_BODY = {
    displayName: 'Daniel R.',
    username: 'daniel.rbrt',
    email: 'test123@gmail.com',
    ensName: 'danielrbrt',
    ensDomain: '.eth',
    walletNickname: 'Carteira nova',
    avatarUrl: 'data:image/png;base64,AAAA',
  }
  const authHeaders = { Authorization: 'Bearer usr_test123' }

  const anonymousProfile = await client.get('/profile')
  check(
    anonymousProfile.status === 401 &&
      anonymousProfile.data.error?.code === 'UNAUTHORIZED',
    'perfil sem sessão -> 401 UNAUTHORIZED',
  )

  const expiredToken = await client.get('/profile', {
    headers: { Authorization: 'Bearer usr_inexistente' },
  })
  check(expiredToken.status === 401, 'token de sessão desconhecido -> 401')

  const profile = await client.get('/profile', { headers: authHeaders })
  check(
    profile.status === 200 &&
      profile.data.profile?.username === 'daniel.rbrt' &&
      profile.data.profile?.email === 'test123@gmail.com' &&
      profile.data.profile?.avatarUrl === null,
    'perfil autenticado devolve os dados da conta',
  )

  const savedProfile = await client.patch('/profile', PROFILE_BODY, {
    headers: authHeaders,
  })
  check(
    savedProfile.status === 200 &&
      savedProfile.data.profile?.walletNickname === 'Carteira nova' &&
      savedProfile.data.profile?.avatarUrl === 'data:image/png;base64,AAAA' &&
      savedProfile.data.user?.name === 'Daniel R.',
    'salvar devolve perfil e sessão atualizados',
  )

  const persistedProfile = await client.get('/profile', { headers: authHeaders })
  check(
    persistedProfile.data.profile?.displayName === 'Daniel R.',
    'alterações do perfil persistem entre as consultas',
  )

  const usernameTaken = await client.patch(
    '/profile',
    { ...PROFILE_BODY, username: 'marina.alvz' },
    { headers: authHeaders },
  )
  check(
    usernameTaken.status === 409 &&
      usernameTaken.data.error?.code === 'USERNAME_IN_USE' &&
      usernameTaken.data.error?.field === 'username',
    'nome de usuário de outra conta -> 409 no campo',
  )

  const invalidProfile = await client.patch(
    '/profile',
    { ...PROFILE_BODY, email: 'sem-arroba' },
    { headers: authHeaders },
  )
  check(invalidProfile.status === 422, 'e-mail inválido no perfil -> 422')

  const wrongPassword = await client.post(
    '/profile/password',
    { currentPassword: 'errada123', newPassword: 'novasenha123' },
    { headers: authHeaders },
  )
  check(
    wrongPassword.status === 422 &&
      wrongPassword.data.error?.code === 'INVALID_PASSWORD' &&
      wrongPassword.data.error?.field === 'currentPassword',
    'senha atual incorreta -> 422 no campo correspondente',
  )

  const shortPassword = await client.post(
    '/profile/password',
    { currentPassword: '12345678', newPassword: 'curta' },
    { headers: authHeaders },
  )
  check(shortPassword.status === 422, 'nova senha curta -> 422')

  const changedPassword = await client.post(
    '/profile/password',
    { currentPassword: '12345678', newPassword: 'novasenha123' },
    { headers: authHeaders },
  )
  check(changedPassword.status === 200, 'troca de senha válida -> 200')

  const oldPassword = await client.post('/auth/login', {
    email: 'test123@gmail.com',
    password: '12345678',
  })
  check(oldPassword.status === 401, 'a senha antiga deixa de autenticar')

  const newPassword = await client.post('/auth/login', {
    email: 'test123@gmail.com',
    password: 'novasenha123',
  })
  check(newPassword.status === 200, 'a nova senha autentica')

  resetAccounts()
  const accountsReset = await client.get('/profile', { headers: authHeaders })
  check(
    accountsReset.data.profile?.displayName === 'Daniel Roberto' &&
      accountsReset.data.profile?.walletNickname === 'Principal',
    'reset das contas restaura o cenário conhecido',
  )

  console.log('\nPré-preenchimento do checkout:')

  resetAccounts()
  resetWallets()

  const prefillProfile = profileResponseSchema.parse(
    (await client.get('/profile', { headers: authHeaders })).data,
  ).profile
  const prefillWallets = walletsResponseSchema.parse(
    (await client.get('/wallets')).data,
  ).items
  const payingWallet =
    prefillWallets.find((wallet) => wallet.connected) ??
    prefillWallets.find((wallet) => wallet.primary) ??
    null
  const prefilled = collectorPrefill(prefillProfile, payingWallet)

  check(
    prefilled.displayName === 'Daniel Roberto' &&
      prefilled.username === 'daniel.rbrt' &&
      prefilled.email === 'test123@gmail.com' &&
      prefilled.ensName === 'nova.kurio' &&
      prefilled.ensDomain === '.eth',
    'dados do usuário preenchem nome de exibição, usuário, e-mail e ENS',
  )
  check(
    prefilled.walletAddress === payingWallet?.address &&
      prefilled.network === payingWallet?.network &&
      prefilled.walletType === payingWallet?.type &&
      prefilled.referralCode === payingWallet?.referralCode &&
      prefilled.profileName === payingWallet?.profileName &&
      prefilled.useOtherWallet === false,
    'dados da carteira cadastrada preenchem endereço, rede, tipo e indicação',
  )
  check(
    collectorPrefillKey(prefillProfile, payingWallet) !==
      collectorPrefillKey(
        prefillProfile,
        prefillWallets.find((wallet) => wallet.primary) ?? null,
      ),
    'trocar de carteira registra uma nova origem de pré-preenchimento',
  )
  check(
    collectorPrefill(prefillProfile, null).walletAddress === '' &&
      collectorPrefill(prefillProfile, null).username === 'daniel.rbrt' &&
      collectorPrefill(undefined, null).email === '',
    'sem carteira cadastrada só os dados do usuário entram no formulário',
  )

  console.log('\nContrato /api/orders:')

  resetOrders()
  resetCart()

  const demoReceipt = await client.get(`/orders/${DEMO_ORDER_ID}`)
  check(
    demoReceipt.status === 200 &&
      demoReceipt.data.status === 'confirmed' &&
      demoReceipt.data.summary.total === '26.846' &&
      demoReceipt.data.items.length === 3 &&
      demoReceipt.data.walletLabel === 'MetaMask',
    'recibo de demonstração: confirmado, 3 itens e total 26.846',
  )

  const orderCreated = await client.post(
    '/orders',
    { provider: 'metamask' },
    { headers: { 'Idempotency-Key': 'check-order-1' } },
  )
  check(
    orderCreated.status === 201 && orderCreated.data.status === 'confirmed',
    'criação de pedido -> 201 confirmado',
  )
  check(
    orderCreated.data.summary?.total === '26.846' &&
      orderCreated.data.items?.length === 3,
    'pedido copia o snapshot do carrinho (3 itens, total 26.846)',
  )
  check(
    orderCreated.data.walletLabel === 'MetaMask' &&
      /^0x[0-9A-F]{40}$/.test(orderCreated.data.transactionId ?? ''),
    'recibo registra a carteira e um hash de transação',
  )

  const cartAfterPurchase = await client.get('/cart')
  check(
    cartAfterPurchase.data.items.length === 0,
    'itens comprados saem do carrinho após a confirmação',
  )

  const orderRetry = await client.post(
    '/orders',
    { provider: 'metamask' },
    { headers: { 'Idempotency-Key': 'check-order-1' } },
  )
  check(
    orderRetry.status === 201 && orderRetry.data.id === orderCreated.data.id,
    'mesma chave de idempotência recupera o mesmo pedido',
  )

  const orderConflict = await client.post(
    '/orders',
    { provider: 'coinbase' },
    { headers: { 'Idempotency-Key': 'check-order-1' } },
  )
  check(
    orderConflict.status === 409 &&
      orderConflict.data.error?.code === 'IDEMPOTENCY_CONFLICT',
    'chave reutilizada com outro conteúdo -> 409',
  )

  const emptyOrder = await client.post(
    '/orders',
    { provider: 'metamask' },
    { headers: { 'Idempotency-Key': 'check-order-2' } },
  )
  check(
    emptyOrder.status === 409 && emptyOrder.data.error?.code === 'EMPTY_CART',
    'confirmar com o carrinho vazio -> 409',
  )

  const badProvider = await client.post('/orders', { provider: 'inexistente' })
  check(badProvider.status === 422, 'provedor de carteira inválido -> 422')

  const storedOrder = await client.get(`/orders/${orderCreated.data.id}`)
  check(
    storedOrder.status === 200 && storedOrder.data.id === orderCreated.data.id,
    'GET /orders/:id devolve o recibo salvo',
  )

  const missingOrder = await client.get('/orders/nao-existe')
  check(
    missingOrder.status === 404 && missingOrder.data.error?.code === 'NOT_FOUND',
    'pedido inexistente -> 404',
  )

  resetOrders()
  const ordersReset = await client.get(`/orders/${DEMO_ORDER_ID}`)
  check(
    ordersReset.status === 200 && ordersReset.data.id === DEMO_ORDER_ID,
    'reset restaura o cenário conhecido dos pedidos',
  )

  await server.close()

  if (failures > 0) {
    console.error(`\n${failures} check(s) falharam`)
    process.exit(1)
  }
  console.log('\nTodos os checks do contrato passaram')
}

void main()
