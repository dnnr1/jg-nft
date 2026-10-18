export { ENS_DOMAIN_OPTIONS } from '@/modules/checkout/constants'

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export function profileFieldId(field: string): string {
  return `profile-${field}`
}

export const PROFILE_FIELD_IDS = {
  displayName: profileFieldId('displayName'),
  username: profileFieldId('username'),
  email: profileFieldId('email'),
  ensName: profileFieldId('ensName'),
  ensDomain: profileFieldId('ensDomain'),
  walletNickname: profileFieldId('walletNickname'),
  avatar: profileFieldId('avatar'),
  currentPassword: profileFieldId('currentPassword'),
  newPassword: profileFieldId('newPassword'),
  confirmPassword: profileFieldId('confirmPassword'),
} as const

/** Controles da tela de perfil seguem o fundo escuro definido no checkout. */
export const PROFILE_CONTROL =
  'bg-ink/60 text-foreground placeholder:text-text-secondary/50'
