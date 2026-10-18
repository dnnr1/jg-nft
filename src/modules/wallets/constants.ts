export { ENS_DOMAIN_OPTIONS } from '@/modules/checkout/constants'

export function walletFieldId(field: string): string {
  return `wallet-${field}`
}

export const WALLET_FIELD_IDS = {
  displayName: walletFieldId('displayName'),
  label: walletFieldId('label'),
  network: walletFieldId('network'),
  profileName: walletFieldId('profileName'),
  address: walletFieldId('address'),
  secondaryWallet: walletFieldId('secondaryWallet'),
  type: walletFieldId('type'),
  referralCode: walletFieldId('referralCode'),
  email: walletFieldId('email'),
  ensName: walletFieldId('ensName'),
  ensDomain: walletFieldId('ensDomain'),
  sameAsPrimary: walletFieldId('sameAsPrimary'),
} as const

/** Controles do cadastro de carteira seguem o fundo escuro do checkout. */
export const WALLET_CONTROL =
  'bg-ink/60 text-foreground placeholder:text-text-secondary/50'
