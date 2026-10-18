import { z } from 'zod'

import type { Wallet, WalletInput } from './types'

export interface WalletFormValues {
  displayName: string
  label: string
  network: string
  profileName: string
  address: string
  secondaryWallet: string
  type: string
  referralCode: string
  email: string
  ensName: string
  ensDomain: string
}

export type WalletFormField = keyof WalletFormValues

export type WalletFormErrors = Partial<Record<WalletFormField, string>>

export const WALLET_FORM_FIELDS: readonly WalletFormField[] = [
  'displayName',
  'label',
  'network',
  'profileName',
  'address',
  'secondaryWallet',
  'type',
  'referralCode',
  'email',
  'ensName',
  'ensDomain',
]

export const EMPTY_WALLET_FORM: WalletFormValues = {
  displayName: '',
  label: '',
  network: '',
  profileName: '',
  address: '',
  secondaryWallet: '',
  type: '',
  referralCode: '',
  email: '',
  ensName: '',
  ensDomain: '.eth',
}

const walletFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Informe o nome de exibição (mínimo de 2 caracteres).'),
  label: z
    .string()
    .trim()
    .min(2, 'Informe o apelido da carteira (mínimo de 2 caracteres).'),
  network: z.string().trim().min(1, 'Selecione uma rede.'),
  profileName: z
    .string()
    .trim()
    .min(2, 'Informe o nome do perfil (mínimo de 2 caracteres).'),
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{6,}$/, 'Informe um endereço 0x válido.'),
  secondaryWallet: z.string().trim().optional(),
  type: z.string().trim().min(1, 'Selecione o tipo de carteira.'),
  referralCode: z.string().trim().min(1, 'Informe o código de indicação.'),
  email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Informe um e-mail válido.'),
  ensName: z.string().trim().min(1, 'Informe o nome ENS.'),
  ensDomain: z.string().trim().min(1, 'Selecione o domínio ENS.'),
})

/** Valida o cadastro de carteira e devolve uma mensagem por campo. */
export function validateWalletForm(
  values: WalletFormValues,
): WalletFormErrors {
  const result = walletFormSchema.safeParse(values)
  if (result.success) return {}

  const errors: WalletFormErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0]
    if (
      typeof key !== 'string' ||
      !WALLET_FORM_FIELDS.includes(key as WalletFormField) ||
      errors[key as WalletFormField]
    ) {
      continue
    }
    errors[key as WalletFormField] = issue.message
  }
  return errors
}

export function hasFormErrors(errors: WalletFormErrors): boolean {
  return Object.keys(errors).length > 0
}

export function walletToForm(wallet: Wallet): WalletFormValues {
  return {
    displayName: wallet.displayName ?? '',
    label: wallet.label,
    network: wallet.network,
    profileName: wallet.profileName ?? '',
    address: wallet.address,
    secondaryWallet: wallet.secondaryWallet ?? '',
    type: wallet.type ?? (wallet.primary ? 'principal' : ''),
    referralCode: wallet.referralCode ?? '',
    email: wallet.email ?? '',
    ensName: wallet.ensName ?? '',
    ensDomain: wallet.ensDomain ?? '.eth',
  }
}

export function formToWalletInput(values: WalletFormValues): WalletInput {
  return {
    displayName: values.displayName.trim(),
    label: values.label.trim(),
    network: values.network as WalletInput['network'],
    profileName: values.profileName.trim(),
    address: values.address.trim(),
    secondaryWallet: values.secondaryWallet.trim(),
    type: values.type as WalletInput['type'],
    referralCode: values.referralCode.trim(),
    email: values.email.trim(),
    ensName: values.ensName.trim(),
    ensDomain: values.ensDomain.trim(),
  }
}
