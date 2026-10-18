import {
  WALLET_TYPES,
  type Wallet,
  type WalletInput,
  type WalletType,
  type WalletsResponse,
} from '@/modules/wallets/types'
import { CATALOG_NETWORKS } from '@/modules/catalog/search-params'

const STORAGE_KEY = 'kurio.wallets.v1'

const SEED_AT = '2026-08-01T12:00:00.000Z'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{6,}$/

/** Carteiras cadastradas do cenário de demonstração. */
const SEED_WALLETS: readonly Wallet[] = [
  {
    id: 'wallet-reserva',
    label: 'Reserva',
    address: '0x7A3cF1d9B42e5A8c6D0f19E4b2C7a8D3e5F6b1A2',
    ens: 'nova.kurio.eth',
    network: 'polygon',
    primary: false,
    connected: true,
    createdAt: SEED_AT,
    updatedAt: SEED_AT,
    type: 'reserva',
    displayName: 'Daniel Roberto',
    profileName: 'daniel.rbrt',
    secondaryWallet: '',
    referralCode: 'KURIO-RSV',
    email: 'test123@gmail.com',
    ensName: 'nova.kurio',
    ensDomain: '.eth',
  },
  {
    id: 'wallet-principal',
    label: 'Principal',
    address: '0xA91F4c8e2B7d5A9c1E4f6B8d2C0a3E7f9B5cE82C',
    network: 'ethereum',
    primary: true,
    connected: false,
    createdAt: SEED_AT,
    updatedAt: SEED_AT,
    type: 'principal',
    displayName: 'Daniel Roberto',
    profileName: 'daniel.rbrt',
    secondaryWallet: '',
    referralCode: 'KURIO-PRI',
    email: 'test123@gmail.com',
    ensName: 'danielrbrt',
    ensDomain: '.eth',
  },
]

interface WalletState {
  wallets: Wallet[]
}

export class WalletError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'WalletError'
    this.status = status
    this.code = code
  }
}

export interface WalletPatch extends Partial<WalletInput> {
  primary?: boolean
  connected?: boolean
}

function seedState(): WalletState {
  return { wallets: SEED_WALLETS.map((wallet) => ({ ...wallet })) }
}

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function loadState(): WalletState {
  const store = storage()
  if (!store) return seedState()
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw) as Partial<WalletState>
    if (!Array.isArray(parsed.wallets)) return seedState()
    return { wallets: parsed.wallets as Wallet[] }
  } catch {
    return seedState()
  }
}

let state: WalletState = loadState()

function persist(): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Persistência é best-effort: as carteiras continuam válidas em memória.
  }
}

function invalid(message: string): never {
  throw new WalletError(422, 'VALIDATION_ERROR', message)
}

function requiredText(value: unknown, label: string, min = 1): string {
  if (typeof value !== 'string' || value.trim().length < min) {
    invalid(
      min > 1
        ? `Informe ${label} (mínimo de ${min} caracteres).`
        : `Informe ${label}.`,
    )
  }
  return value.trim()
}

/** Valida o cadastro de carteira e devolve os campos já normalizados. */
function parseWalletInput(input: Partial<Record<keyof WalletInput, unknown>>): WalletInput {
  const label = requiredText(input.label, 'o apelido da carteira', 2)
  const displayName = requiredText(input.displayName, 'o nome de exibição', 2)
  const profileName = requiredText(input.profileName, 'o nome do perfil', 2)
  const address = requiredText(input.address, 'o endereço da carteira')

  if (!ADDRESS_PATTERN.test(address)) {
    invalid('Informe um endereço 0x válido.')
  }

  const network = requiredText(input.network, 'a rede')
  if (!CATALOG_NETWORKS.includes(network as (typeof CATALOG_NETWORKS)[number])) {
    invalid('Selecione uma rede válida.')
  }

  const type = requiredText(input.type, 'o tipo de carteira')
  if (!WALLET_TYPES.includes(type as WalletType)) {
    invalid('Selecione um tipo de carteira válido.')
  }

  const referralCode = requiredText(input.referralCode, 'o código de indicação')
  const email = requiredText(input.email, 'o e-mail')
  if (!EMAIL_PATTERN.test(email)) {
    invalid('Informe um e-mail válido.')
  }

  const ensName = requiredText(input.ensName, 'o nome ENS')
  const ensDomain = requiredText(input.ensDomain, 'o domínio ENS')

  return {
    label,
    displayName,
    profileName,
    address,
    network: network as WalletInput['network'],
    type: type as WalletType,
    referralCode,
    email,
    ensName,
    ensDomain,
    secondaryWallet:
      typeof input.secondaryWallet === 'string'
        ? input.secondaryWallet.trim()
        : '',
  }
}

function composeEns(ensName: string | undefined, ensDomain: string | undefined) {
  if (!ensName) return undefined
  return `${ensName}${ensDomain ?? ''}`
}

export function readWallets(): WalletsResponse {
  return { items: state.wallets.map((wallet) => ({ ...wallet })) }
}

/** Cadastra uma carteira. A principal rebaixa a anterior, mantendo uma única. */
export function createWallet(
  input: Partial<Record<keyof WalletInput, unknown>>,
): WalletsResponse {
  const parsed = parseWalletInput(input)
  const now = new Date().toISOString()
  const isPrimary = parsed.type === 'principal'

  const wallet: Wallet = {
    ...parsed,
    id: `wallet_${now.slice(11, 23).replace(/\D/g, '')}`,
    ens: composeEns(parsed.ensName, parsed.ensDomain),
    primary: isPrimary,
    connected: false,
    createdAt: now,
    updatedAt: now,
  }

  state = {
    wallets: [
      ...state.wallets.map((item) =>
        isPrimary ? { ...item, primary: false } : item,
      ),
      wallet,
    ],
  }
  persist()
  return readWallets()
}

/**
 * Atualiza a carteira. Conectar marca as demais como desconectadas e definir
 * como principal rebaixa a principal anterior, mantendo um único valor de cada.
 */
export function updateWallet(
  id: string,
  patch: WalletPatch,
): WalletsResponse {
  const current = state.wallets.find((wallet) => wallet.id === id)
  if (!current) {
    throw new WalletError(404, 'NOT_FOUND', 'Carteira não encontrada')
  }

  const hasFormFields = (
    [
      'label',
      'address',
      'network',
      'type',
      'displayName',
      'profileName',
      'secondaryWallet',
      'referralCode',
      'email',
      'ensName',
      'ensDomain',
    ] satisfies ReadonlyArray<keyof WalletInput>
  ).some((field) => patch[field] !== undefined)

  const now = new Date().toISOString()
  const parsed: WalletInput | null = hasFormFields
    ? parseWalletInput({
        label: patch.label ?? current.label,
        displayName: patch.displayName ?? current.displayName,
        profileName: patch.profileName ?? current.profileName,
        secondaryWallet: patch.secondaryWallet ?? current.secondaryWallet,
        address: patch.address ?? current.address,
        network: patch.network ?? current.network,
        type: patch.type ?? current.type,
        referralCode: patch.referralCode ?? current.referralCode,
        email: patch.email ?? current.email,
        ensName: patch.ensName ?? current.ensName,
        ensDomain: patch.ensDomain ?? current.ensDomain,
      })
    : null

  const becomesPrimary = patch.primary === true || parsed?.type === 'principal'

  state = {
    wallets: state.wallets.map((wallet) => {
      const isTarget = wallet.id === id
      const next: Wallet = isTarget ? { ...wallet, ...(parsed ?? {}) } : { ...wallet }

      if (isTarget) {
        if (parsed) next.ens = composeEns(parsed.ensName, parsed.ensDomain)
        if (patch.primary !== undefined) next.primary = patch.primary
        if (patch.connected !== undefined) next.connected = patch.connected
        if (parsed?.type === 'principal') next.primary = true
        next.updatedAt = now
      }

      if (patch.connected === true && !isTarget) next.connected = false
      if (becomesPrimary && !isTarget) next.primary = false

      return next
    }),
  }

  persist()
  return readWallets()
}

/** Restaura o cenário conhecido (usado por testes e pelo reset de demonstração). */
export function resetWallets(): WalletsResponse {
  state = seedState()
  persist()
  return readWallets()
}
