import { z } from 'zod'

import type { Profile } from './types'

export interface ProfileFormValues {
  displayName: string
  username: string
  email: string
  ensName: string
  ensDomain: string
  walletNickname: string
}

export type ProfileFormField = keyof ProfileFormValues

export type ProfileFormErrors = Partial<Record<ProfileFormField, string>>

export const PROFILE_FORM_FIELDS: readonly ProfileFormField[] = [
  'displayName',
  'username',
  'email',
  'ensName',
  'ensDomain',
  'walletNickname',
]

const profileFormSchema = z.object({
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
  email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Informe um e-mail válido.'),
  ensName: z.string().trim().min(1, 'Informe o nome ENS.'),
  ensDomain: z.string().trim().min(1, 'Selecione o domínio ENS.'),
  walletNickname: z
    .string()
    .trim()
    .min(2, 'Informe o apelido da carteira (mínimo de 2 caracteres).'),
})

/** Valida os dados do perfil e devolve uma mensagem por campo. */
export function validateProfileForm(
  values: ProfileFormValues,
): ProfileFormErrors {
  const result = profileFormSchema.safeParse(values)
  if (result.success) return {}
  return collectFieldErrors(result.error.issues, PROFILE_FORM_FIELDS)
}

export function profileToForm(profile: Profile): ProfileFormValues {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName,
    ensDomain: profile.ensDomain,
    walletNickname: profile.walletNickname,
  }
}

export interface PasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type PasswordFormField = keyof PasswordFormValues

export type PasswordFormErrors = Partial<Record<PasswordFormField, string>>

export const EMPTY_PASSWORD_FORM: PasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: z
      .string()
      .min(1, 'Informe a nova senha.')
      .min(8, 'A nova senha deve ter no mínimo 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })

export function validatePasswordForm(
  values: PasswordFormValues,
): PasswordFormErrors {
  const result = passwordFormSchema.safeParse(values)
  if (result.success) return {}
  return collectFieldErrors(result.error.issues, [
    'currentPassword',
    'newPassword',
    'confirmPassword',
  ])
}

/** A troca de senha só é enviada quando algum campo do bloco foi preenchido. */
export function hasPasswordInput(values: PasswordFormValues): boolean {
  return Object.values(values).some((value) => value.trim().length > 0)
}

function collectFieldErrors<Field extends string>(
  issues: ReadonlyArray<{
    path: ReadonlyArray<PropertyKey>
    message: string
  }>,
  fields: readonly Field[],
): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (
      typeof key !== 'string' ||
      !fields.includes(key as Field) ||
      errors[key as Field]
    ) {
      continue
    }
    errors[key as Field] = issue.message
  }
  return errors
}
