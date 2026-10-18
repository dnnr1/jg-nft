import { z } from 'zod'

import { MAX_NOTES_LENGTH } from './constants'

export interface CollectorFormValues {
  displayName: string
  username: string
  network: string
  profileName: string
  walletAddress: string
  secondaryWallet: string
  walletType: string
  referralCode: string
  email: string
  ensName: string
  ensDomain: string
  useOtherWallet: boolean
  notes: string
}

export type CollectorFormField = Exclude<
  keyof CollectorFormValues,
  'useOtherWallet'
>

export type CollectorFormErrors = Partial<
  Record<CollectorFormField, string>
>

export const COLLECTOR_FORM_FIELDS: readonly CollectorFormField[] = [
  'displayName',
  'username',
  'network',
  'profileName',
  'walletAddress',
  'secondaryWallet',
  'walletType',
  'referralCode',
  'email',
  'ensName',
  'ensDomain',
  'notes',
]

export const EMPTY_COLLECTOR_FORM: CollectorFormValues = {
  displayName: '',
  username: '',
  network: '',
  profileName: '',
  walletAddress: '',
  secondaryWallet: '',
  walletType: '',
  referralCode: '',
  email: '',
  ensName: '',
  ensDomain: '.eth',
  useOtherWallet: true,
  notes: '',
}

const collectorFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Informe o nome de exibição (mínimo de 2 caracteres).'),
  username: z
    .string()
    .trim()
    .min(3, 'Informe o nome de usuário (mínimo de 3 caracteres).')
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'Use apenas letras, números, ponto, hífen ou sublinhado.',
    ),
  network: z.string().trim().min(1, 'Selecione uma rede.'),
  profileName: z
    .string()
    .trim()
    .min(2, 'Informe o nome do perfil (mínimo de 2 caracteres).'),
  walletAddress: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{6,}$/, 'Informe um endereço 0x válido.'),
  secondaryWallet: z.string().trim().optional(),
  walletType: z.string().trim().min(1, 'Selecione o tipo de carteira.'),
  referralCode: z.string().trim().min(1, 'Informe o código de indicação.'),
  email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Informe um e-mail válido.'),
  ensName: z.string().trim().min(1, 'Informe o nome ENS.'),
  ensDomain: z.string().trim().min(1, 'Selecione o domínio ENS.'),
  useOtherWallet: z.boolean(),
  notes: z
    .string()
    .trim()
    .max(MAX_NOTES_LENGTH, `Use no máximo ${MAX_NOTES_LENGTH} caracteres.`)
    .optional(),
})

/** Valida o formulário e devolve uma mensagem por campo (a primeira de cada). */
export function validateCollectorForm(
  values: CollectorFormValues,
): CollectorFormErrors {
  const result = collectorFormSchema.safeParse(values)
  if (result.success) return {}

  const errors: CollectorFormErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0]
    if (
      typeof key !== 'string' ||
      !COLLECTOR_FORM_FIELDS.includes(key as CollectorFormField) ||
      errors[key as CollectorFormField]
    ) {
      continue
    }
    errors[key as CollectorFormField] = issue.message
  }
  return errors
}
