import {
  CATALOG_NETWORKS,
  NETWORK_LABELS,
} from '@/modules/catalog/search-params'

/** Redes oferecidas no formulário do colecionador. */
export const NETWORK_OPTIONS: ReadonlyArray<{ id: string; label: string }> =
  CATALOG_NETWORKS.map((id) => ({ id, label: NETWORK_LABELS[id] ?? id }))

/** Tipos de carteira, alinhados aos rótulos usados nos cartões do checkout. */
export const WALLET_TYPE_OPTIONS = [
  { id: 'principal', label: 'Principal' },
  { id: 'secundaria', label: 'Secundária' },
  { id: 'reserva', label: 'Reserva' },
] as const

export const ENS_DOMAIN_OPTIONS = ['.eth', '.xyz', '.nft'] as const

export const MAX_NOTES_LENGTH = 500

export const WALLET_PROVIDER_IDS = [
  'browser',
  'metamask',
  'walletconnect',
  'coinbase',
] as const

export type WalletProviderId = (typeof WALLET_PROVIDER_IDS)[number]

/** Provedores da coluna "Carteira e rede" no desktop. */
export const DESKTOP_WALLET_PROVIDERS: readonly WalletProviderId[] = [
  'browser',
  'metamask',
  'coinbase',
]

/** Provedores da folha "Carteira e rede" no mobile. */
export const MOBILE_WALLET_PROVIDERS: readonly WalletProviderId[] = [
  'walletconnect',
  'metamask',
  'coinbase',
]

export const WALLET_PROVIDER_LABELS: Record<WalletProviderId, string> = {
  browser: 'Carteiras detectadas no navegador',
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

/** Carteiras injetadas listadas na opção "Carteiras do navegador". */
export const BROWSER_WALLET_CHIPS: ReadonlyArray<string> = [
  'METAMASK',
  'WALLETCONNECT',
  'COINBASE',
]

export const DEFAULT_WALLET_PROVIDER: WalletProviderId = 'coinbase'

/** Id/name dos campos do formulário, reaproveitados no foco e na validação. */
export function collectorFieldId(field: string): string {
  return `checkout-${field}`
}

export const COLLECTOR_FIELD_IDS = {
  displayName: collectorFieldId('displayName'),
  username: collectorFieldId('username'),
  network: collectorFieldId('network'),
  profileName: collectorFieldId('profileName'),
  walletAddress: collectorFieldId('walletAddress'),
  secondaryWallet: collectorFieldId('secondaryWallet'),
  walletType: collectorFieldId('walletType'),
  referralCode: collectorFieldId('referralCode'),
  email: collectorFieldId('email'),
  ensName: collectorFieldId('ensName'),
  ensDomain: collectorFieldId('ensDomain'),
  useOtherWallet: collectorFieldId('useOtherWallet'),
  notes: collectorFieldId('notes'),
} as const

/** Estilo compartilhado dos controles do checkout (fundo escuro da referência). */
export const CHECKOUT_CONTROL =
  'bg-ink/60 text-foreground placeholder:text-text-secondary/50'
