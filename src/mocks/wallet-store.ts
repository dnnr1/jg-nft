import type { Wallet, WalletsResponse } from '@/modules/wallets/types'

const STORAGE_KEY = 'kurio.wallets.v1'

const SEED_AT = '2026-08-01T12:00:00.000Z'

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

export function readWallets(): WalletsResponse {
  return { items: state.wallets.map((wallet) => ({ ...wallet })) }
}

/**
 * Atualiza a carteira. Conectar marca as demais como desconectadas e definir
 * como principal rebaixa a principal anterior, mantendo um único valor de cada.
 */
export function updateWallet(
  id: string,
  patch: { primary?: boolean; connected?: boolean },
): WalletsResponse {
  if (!state.wallets.some((wallet) => wallet.id === id)) {
    throw new WalletError(404, 'NOT_FOUND', 'Carteira não encontrada')
  }

  const now = new Date().toISOString()
  state = {
    wallets: state.wallets.map((wallet) => {
      const isTarget = wallet.id === id
      const next: Wallet = { ...wallet }

      if (isTarget) {
        if (patch.primary !== undefined) next.primary = patch.primary
        if (patch.connected !== undefined) next.connected = patch.connected
        next.updatedAt = now
      }

      if (patch.connected === true && !isTarget) next.connected = false
      if (patch.primary === true && !isTarget) next.primary = false

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
