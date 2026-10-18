import { Field, fieldDescribedBy } from '@/components/common/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  ENS_DOMAIN_OPTIONS,
  WALLET_CONTROL,
  WALLET_FIELD_IDS,
} from '../constants'
import {
  NETWORK_OPTIONS,
  WALLET_TYPE_OPTIONS,
} from '@/modules/checkout/constants'
import { cn } from 'cn'
import type {
  WalletFormErrors,
  WalletFormField,
  WalletFormValues,
} from '../schema'

interface WalletFormProps {
  /** Prefixo dos ids: permite dois formulários na mesma tela. */
  idPrefix?: string
  values: WalletFormValues
  errors: WalletFormErrors
  pending?: boolean
  submitLabel: string
  formError?: string | null
  onChange: (field: WalletFormField, value: string) => void
  onSubmit: () => void
  onCancel?: () => void
}

/** Campos do cadastro de carteira, iguais aos do formulário do colecionador. */
export function WalletForm({
  idPrefix = '',
  values,
  errors,
  pending,
  submitLabel,
  formError,
  onChange,
  onSubmit,
  onCancel,
}: WalletFormProps) {
  const fieldId = (field: keyof typeof WALLET_FIELD_IDS) =>
    `${idPrefix}${WALLET_FIELD_IDS[field]}`
  const describedBy = (field: keyof typeof WALLET_FIELD_IDS, error?: string) =>
    fieldDescribedBy(fieldId(field), { error })

  return (
    <form
      noValidate
      aria-busy={pending}
      className="mt-5 flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        <Field
          id={fieldId('displayName')}
          label="Nome de exibição"
          required
          error={errors.displayName}
        >
          <Input
            id={fieldId('displayName')}
            name="displayName"
            autoComplete="name"
            value={values.displayName}
            disabled={pending}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={describedBy('displayName', errors.displayName)}
            onChange={(event) => onChange('displayName', event.target.value)}
            className={WALLET_CONTROL}
          />
        </Field>

        <Field
          id={fieldId('label')}
          label="Apelido da carteira"
          required
          error={errors.label}
        >
          <Input
            id={fieldId('label')}
            name="label"
            autoComplete="off"
            value={values.label}
            disabled={pending}
            aria-invalid={Boolean(errors.label)}
            aria-describedby={describedBy('label', errors.label)}
            onChange={(event) => onChange('label', event.target.value)}
            className={WALLET_CONTROL}
          />
        </Field>

        <Field
          id={fieldId('network')}
          label="Rede"
          required
          error={errors.network}
        >
          <Select
            id={fieldId('network')}
            name="network"
            value={values.network}
            disabled={pending}
            aria-invalid={Boolean(errors.network)}
            aria-describedby={describedBy('network', errors.network)}
            onChange={(event) => onChange('network', event.target.value)}
          >
            <option value="" disabled>
              Selecione uma rede
            </option>
            {NETWORK_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id={fieldId('profileName')}
          label="Nome do perfil"
          required
          error={errors.profileName}
        >
          <Input
            id={fieldId('profileName')}
            name="profileName"
            autoComplete="off"
            value={values.profileName}
            disabled={pending}
            aria-invalid={Boolean(errors.profileName)}
            aria-describedby={describedBy('profileName', errors.profileName)}
            onChange={(event) => onChange('profileName', event.target.value)}
            className={WALLET_CONTROL}
          />
        </Field>

        <Field
          id={fieldId('address')}
          label="Endereço da carteira"
          required
          error={errors.address}
        >
          <Input
            id={fieldId('address')}
            name="address"
            autoComplete="off"
            spellCheck={false}
            placeholder="Endereço 0x da carteira"
            value={values.address}
            disabled={pending}
            aria-invalid={Boolean(errors.address)}
            aria-describedby={describedBy('address', errors.address)}
            onChange={(event) => onChange('address', event.target.value)}
            className={WALLET_CONTROL}
          />
        </Field>

        <Field
          id={fieldId('secondaryWallet')}
          label="ENS ou carteira secundária (opcional)"
          error={errors.secondaryWallet}
        >
          <Input
            id={fieldId('secondaryWallet')}
            name="secondaryWallet"
            autoComplete="off"
            spellCheck={false}
            placeholder="ENS ou carteira secundária (opcional)"
            value={values.secondaryWallet}
            disabled={pending}
            onChange={(event) => onChange('secondaryWallet', event.target.value)}
            className={WALLET_CONTROL}
          />
        </Field>

        <Field
          id={fieldId('type')}
          label="Tipo de carteira"
          required
          error={errors.type}
        >
          <Select
            id={fieldId('type')}
            name="type"
            value={values.type}
            disabled={pending}
            aria-invalid={Boolean(errors.type)}
            aria-describedby={describedBy('type', errors.type)}
            onChange={(event) => onChange('type', event.target.value)}
          >
            <option value="" disabled>
              Selecione uma carteira
            </option>
            {WALLET_TYPE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id={fieldId('referralCode')}
          label="Código de indicação"
          required
          error={errors.referralCode}
        >
          <Input
            id={fieldId('referralCode')}
            name="referralCode"
            autoComplete="off"
            spellCheck={false}
            value={values.referralCode}
            disabled={pending}
            aria-invalid={Boolean(errors.referralCode)}
            aria-describedby={describedBy('referralCode', errors.referralCode)}
            onChange={(event) => onChange('referralCode', event.target.value)}
            className={WALLET_CONTROL}
          />
        </Field>

        <Field
          id={fieldId('email')}
          label="E-mail"
          required
          error={errors.email}
        >
          <Input
            id={fieldId('email')}
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            disabled={pending}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy('email', errors.email)}
            onChange={(event) => onChange('email', event.target.value)}
            className={WALLET_CONTROL}
          />
        </Field>

        <Field
          id={fieldId('ensName')}
          label="Nome ENS"
          required
          error={errors.ensName}
        >
          <div className="flex gap-2">
            <Input
              id={fieldId('ensName')}
              name="ensName"
              autoComplete="off"
              spellCheck={false}
              value={values.ensName}
              disabled={pending}
              aria-invalid={Boolean(errors.ensName)}
              aria-describedby={describedBy('ensName', errors.ensName)}
              onChange={(event) => onChange('ensName', event.target.value)}
              className={cn('min-w-0 flex-1', WALLET_CONTROL)}
            />
            <Select
              id={fieldId('ensDomain')}
              name="ensDomain"
              aria-label="Domínio ENS"
              containerClassName="w-24 shrink-0"
              value={values.ensDomain}
              disabled={pending}
              onChange={(event) => onChange('ensDomain', event.target.value)}
            >
              {ENS_DOMAIN_OPTIONS.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </Select>
          </div>
        </Field>
      </div>

      {formError ? (
        <p role="alert" className="text-tiny text-coral">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-full md:h-10 md:w-fit md:rounded-default md:px-8"
        >
          {pending ? 'Salvando…' : submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={onCancel}
          >
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
