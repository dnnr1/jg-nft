import type { Profile } from '@/modules/profile/types'
import type { Wallet } from '@/modules/wallets/types'
import { EMPTY_COLLECTOR_FORM, type CollectorFormValues } from './schema'

/**
 * Origem do pré-preenchimento: o formulário é montado a partir do perfil do
 * colecionador (`/profile`) e da carteira cadastrada (`/wallets`), então trocar
 * de carteira reaplica os dados correspondentes.
 */
export interface CollectorPrefill {
  /** Identifica a origem (conta + carteira) dos dados aplicados. */
  key: string
  values: CollectorFormValues
}

/**
 * Preenche o formulário do colecionador com o que já está cadastrado, evitando
 * pedir de novo os dados do perfil e da carteira escolhida para pagar. Campos
 * sem origem conhecida (observação, por exemplo) continuam vazios.
 */
export function collectorPrefill(
  profile: Profile | undefined,
  wallet: Wallet | null,
): CollectorFormValues {
  return {
    ...EMPTY_COLLECTOR_FORM,
    displayName: wallet?.displayName ?? profile?.displayName ?? '',
    username: profile?.username ?? '',
    network: wallet?.network ?? '',
    profileName: wallet?.profileName ?? '',
    walletAddress: wallet?.address ?? '',
    secondaryWallet: wallet?.secondaryWallet ?? '',
    walletType: wallet?.type ?? '',
    referralCode: wallet?.referralCode ?? '',
    email: wallet?.email ?? profile?.email ?? '',
    ensName: wallet?.ensName ?? profile?.ensName ?? '',
    ensDomain: wallet?.ensDomain ?? EMPTY_COLLECTOR_FORM.ensDomain,
    // Havendo carteira cadastrada a compra segue nela; a opção fica marcada
    // apenas para o colecionador informar outra carteira.
    useOtherWallet: wallet ? false : EMPTY_COLLECTOR_FORM.useOtherWallet,
  }
}

export function collectorPrefillKey(
  profile: Profile | undefined,
  wallet: Wallet | null,
): string {
  return `${profile?.id ?? 'sem-perfil'}:${wallet?.id ?? 'sem-carteira'}`
}
