import { useState, type FormEvent } from 'react'

import { Field, fieldDescribedBy } from '@/components/common/field'
import { useToast } from '@/components/common/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { apiErrorField, apiErrorMessage } from '@/lib/api'
import { cn } from 'cn'

import { ENS_DOMAIN_OPTIONS, PROFILE_CONTROL, PROFILE_FIELD_IDS } from '../constants'
import { useChangePassword, useUpdateProfile } from '../mutations'
import {
  EMPTY_PASSWORD_FORM,
  PROFILE_FORM_FIELDS,
  hasPasswordInput,
  profileToForm,
  validatePasswordForm,
  validateProfileForm,
  type PasswordFormErrors,
  type PasswordFormField,
  type PasswordFormValues,
  type ProfileFormErrors,
  type ProfileFormField,
  type ProfileFormValues,
} from '../schema'
import type { Profile } from '../types'
import { AvatarField } from './avatar-field'
import { PasswordField } from './password-field'

const PASSWORD_FIELDS: readonly PasswordFormField[] = [
  'currentPassword',
  'newPassword',
  'confirmPassword',
]

/**
 * Dados do perfil, avatar e senha em um único formulário: o "Salvar" envia o
 * perfil e, quando algum campo de senha foi preenchido, também a troca.
 */
export function ProfileForm({ profile }: { profile: Profile }) {
  const [values, setValues] = useState<ProfileFormValues>(() =>
    profileToForm(profile),
  )
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl)
  const [password, setPassword] = useState<PasswordFormValues>(
    EMPTY_PASSWORD_FORM,
  )
  const [errors, setErrors] = useState<ProfileFormErrors>({})
  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const { showToast } = useToast()

  const pending = updateProfile.isPending || changePassword.isPending
  const wantsPasswordChange = hasPasswordInput(password)

  function setField(field: ProfileFormField, value: string) {
    const next = { ...values, [field]: value }
    setValues(next)
    setFormError(null)
    if (submitted) setErrors(validateProfileForm(next))
  }

  function setPasswordField(field: PasswordFormField, value: string) {
    const next = { ...password, [field]: value }
    setPassword(next)
    setFormError(null)
    if (submitted && wantsPasswordChange) {
      setPasswordErrors(validatePasswordForm(next))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    setFormError(null)

    const nextErrors = validateProfileForm(values)
    const nextPasswordErrors = wantsPasswordChange
      ? validatePasswordForm(password)
      : {}
    setErrors(nextErrors)
    setPasswordErrors(nextPasswordErrors)
    if (
      Object.keys(nextErrors).length > 0 ||
      Object.keys(nextPasswordErrors).length > 0
    ) {
      return
    }

    try {
      await updateProfile.mutateAsync({ ...values, avatarUrl })
    } catch (error) {
      const field = apiErrorField(error)
      if (field && PROFILE_FORM_FIELDS.includes(field as ProfileFormField)) {
        setErrors({ [field]: apiErrorMessage(error) })
      } else {
        setFormError(apiErrorMessage(error))
      }
      return
    }

    if (wantsPasswordChange) {
      try {
        await changePassword.mutateAsync({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        })
        setPassword(EMPTY_PASSWORD_FORM)
      } catch (error) {
        const field = apiErrorField(error)
        if (field && PASSWORD_FIELDS.includes(field as PasswordFormField)) {
          setPasswordErrors({ [field]: apiErrorMessage(error) })
        } else {
          setFormError(apiErrorMessage(error))
        }
        return
      }
    }

    showToast('Perfil atualizado com sucesso')
  }

  const describedBy = (id: string, error?: string) =>
    fieldDescribedBy(id, { error })

  return (
    <form
      noValidate
      aria-busy={pending}
      onSubmit={handleSubmit}
      className="flex flex-col gap-8"
    >
      <section aria-labelledby="profile-data-heading">
        <h2
          id="profile-data-heading"
          className="text-body-lg-bold text-foreground"
        >
          Dados do perfil
        </h2>
        <p className="text-caption mt-1 text-text-secondary">
          Estas informações aparecem publicamente no seu perfil.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
          <Field
            id={PROFILE_FIELD_IDS.displayName}
            label="Nome de exibição"
            required
            error={errors.displayName}
          >
            <Input
              id={PROFILE_FIELD_IDS.displayName}
              name="displayName"
              autoComplete="name"
              value={values.displayName}
              disabled={pending}
              aria-invalid={Boolean(errors.displayName)}
              aria-describedby={describedBy(
                PROFILE_FIELD_IDS.displayName,
                errors.displayName,
              )}
              onChange={(event) => setField('displayName', event.target.value)}
              className={PROFILE_CONTROL}
            />
          </Field>

          <Field
            id={PROFILE_FIELD_IDS.username}
            label="Nome de usuário"
            required
            error={errors.username}
          >
            <Input
              id={PROFILE_FIELD_IDS.username}
              name="username"
              autoComplete="username"
              value={values.username}
              disabled={pending}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={describedBy(
                PROFILE_FIELD_IDS.username,
                errors.username,
              )}
              onChange={(event) => setField('username', event.target.value)}
              className={PROFILE_CONTROL}
            />
          </Field>

          <Field
            id={PROFILE_FIELD_IDS.email}
            label="E-mail"
            required
            error={errors.email}
          >
            <Input
              id={PROFILE_FIELD_IDS.email}
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              disabled={pending}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy(
                PROFILE_FIELD_IDS.email,
                errors.email,
              )}
              onChange={(event) => setField('email', event.target.value)}
              className={PROFILE_CONTROL}
            />
          </Field>

          <Field
            id={PROFILE_FIELD_IDS.ensName}
            label="Nome ENS"
            required
            error={errors.ensName}
          >
            <div className="flex gap-2">
              <Input
                id={PROFILE_FIELD_IDS.ensName}
                name="ensName"
                autoComplete="off"
                spellCheck={false}
                value={values.ensName}
                disabled={pending}
                aria-invalid={Boolean(errors.ensName)}
                aria-describedby={describedBy(
                  PROFILE_FIELD_IDS.ensName,
                  errors.ensName,
                )}
                onChange={(event) => setField('ensName', event.target.value)}
                className={cn('min-w-0 flex-1', PROFILE_CONTROL)}
              />
              <Select
                id={PROFILE_FIELD_IDS.ensDomain}
                name="ensDomain"
                aria-label="Domínio ENS"
                containerClassName="w-24 shrink-0"
                value={values.ensDomain}
                disabled={pending}
                onChange={(event) => setField('ensDomain', event.target.value)}
              >
                {ENS_DOMAIN_OPTIONS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </Select>
            </div>
          </Field>

          <Field
            id={PROFILE_FIELD_IDS.walletNickname}
            label="Apelido da carteira"
            required
            error={errors.walletNickname}
          >
            <Input
              id={PROFILE_FIELD_IDS.walletNickname}
              name="walletNickname"
              autoComplete="off"
              value={values.walletNickname}
              disabled={pending}
              aria-invalid={Boolean(errors.walletNickname)}
              aria-describedby={describedBy(
                PROFILE_FIELD_IDS.walletNickname,
                errors.walletNickname,
              )}
              onChange={(event) =>
                setField('walletNickname', event.target.value)
              }
              className={PROFILE_CONTROL}
            />
          </Field>
        </div>

        <div className="mt-6">
          <AvatarField
            name={values.displayName}
            avatarUrl={avatarUrl}
            disabled={pending}
            onChange={setAvatarUrl}
          />
        </div>
      </section>

      <section
        aria-labelledby="profile-password-heading"
        className="border-t border-border pt-8"
      >
        <h2
          id="profile-password-heading"
          className="text-body-lg-bold text-foreground"
        >
          Alterar senha
        </h2>
        <p className="text-caption mt-1 text-text-secondary">
          Preencha apenas se quiser trocar a senha de acesso.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
          <PasswordField
            id={PROFILE_FIELD_IDS.currentPassword}
            name="currentPassword"
            label="Senha atual"
            autoComplete="current-password"
            value={password.currentPassword}
            error={passwordErrors.currentPassword}
            disabled={pending}
            onChange={(value) => setPasswordField('currentPassword', value)}
          />
          <div className="hidden sm:block" />
          <PasswordField
            id={PROFILE_FIELD_IDS.newPassword}
            name="newPassword"
            label="Nova senha"
            autoComplete="new-password"
            value={password.newPassword}
            error={passwordErrors.newPassword}
            disabled={pending}
            onChange={(value) => setPasswordField('newPassword', value)}
          />
          <PasswordField
            id={PROFILE_FIELD_IDS.confirmPassword}
            name="confirmPassword"
            label="Confirmar nova senha"
            autoComplete="new-password"
            value={password.confirmPassword}
            error={passwordErrors.confirmPassword}
            disabled={pending}
            onChange={(value) => setPasswordField('confirmPassword', value)}
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        {formError ? (
          <p role="alert" className="text-tiny text-coral">
            {formError}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-full md:h-10 md:w-fit md:rounded-default md:px-8"
        >
          {pending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
