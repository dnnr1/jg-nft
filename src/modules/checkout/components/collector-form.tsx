import { Field, fieldDescribedBy } from '@/components/common/field'
import { RadioCircle } from '@/components/common/radio-option'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from 'cn'
import {
  CHECKOUT_CONTROL,
  COLLECTOR_FIELD_IDS,
  ENS_DOMAIN_OPTIONS,
  MAX_NOTES_LENGTH,
  NETWORK_OPTIONS,
  WALLET_TYPE_OPTIONS,
} from '../constants'
import type { CollectorFormErrors, CollectorFormValues } from '../schema'

interface CollectorFormProps {
  values: CollectorFormValues
  errors: CollectorFormErrors
  onChange: (field: keyof CollectorFormValues, value: string | boolean) => void
  className?: string
}

export function CollectorForm({
  values,
  errors,
  onChange,
  className,
}: CollectorFormProps) {
  const describedBy = (id: string, error?: string) =>
    fieldDescribedBy(id, { error })

  return (
    <section
      aria-labelledby="collector-heading"
      className={className}
    >
      <h2 id="collector-heading" className="text-body-lg-bold text-foreground">
        Perfil do colecionador
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        <Field
          id={COLLECTOR_FIELD_IDS.displayName}
          label="Nome de exibição"
          required
          error={errors.displayName}
        >
          <Input
            id={COLLECTOR_FIELD_IDS.displayName}
            name="displayName"
            autoComplete="name"
            value={values.displayName}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={describedBy(
              COLLECTOR_FIELD_IDS.displayName,
              errors.displayName,
            )}
            onChange={(event) => onChange('displayName', event.target.value)}
            className={CHECKOUT_CONTROL}
          />
        </Field>

        <Field
          id={COLLECTOR_FIELD_IDS.username}
          label="Nome de usuário"
          required
          error={errors.username}
        >
          <Input
            id={COLLECTOR_FIELD_IDS.username}
            name="username"
            autoComplete="username"
            value={values.username}
            aria-invalid={Boolean(errors.username)}
            aria-describedby={describedBy(
              COLLECTOR_FIELD_IDS.username,
              errors.username,
            )}
            onChange={(event) => onChange('username', event.target.value)}
            className={CHECKOUT_CONTROL}
          />
        </Field>

        <Field
          id={COLLECTOR_FIELD_IDS.network}
          label="Rede"
          required
          error={errors.network}
        >
          <Select
            id={COLLECTOR_FIELD_IDS.network}
            name="network"
            value={values.network}
            aria-invalid={Boolean(errors.network)}
            aria-describedby={describedBy(
              COLLECTOR_FIELD_IDS.network,
              errors.network,
            )}
            onChange={(event) => onChange('network', event.target.value)}
          >
            <option value="" disabled>
              Seleccione uma rede
            </option>
            {NETWORK_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id={COLLECTOR_FIELD_IDS.profileName}
          label="Nome do perfil"
          required
          error={errors.profileName}
        >
          <Input
            id={COLLECTOR_FIELD_IDS.profileName}
            name="profileName"
            autoComplete="off"
            value={values.profileName}
            aria-invalid={Boolean(errors.profileName)}
            aria-describedby={describedBy(
              COLLECTOR_FIELD_IDS.profileName,
              errors.profileName,
            )}
            onChange={(event) => onChange('profileName', event.target.value)}
            className={CHECKOUT_CONTROL}
          />
        </Field>

        <Field
          id={COLLECTOR_FIELD_IDS.walletAddress}
          label="Endereço da carteira"
          required
          error={errors.walletAddress}
        >
          <Input
            id={COLLECTOR_FIELD_IDS.walletAddress}
            name="walletAddress"
            autoComplete="off"
            spellCheck={false}
            placeholder="Endereço 0x da carteira"
            value={values.walletAddress}
            aria-invalid={Boolean(errors.walletAddress)}
            aria-describedby={describedBy(
              COLLECTOR_FIELD_IDS.walletAddress,
              errors.walletAddress,
            )}
            onChange={(event) => onChange('walletAddress', event.target.value)}
            className={CHECKOUT_CONTROL}
          />
        </Field>

        <Field
          id={COLLECTOR_FIELD_IDS.secondaryWallet}
          label="ENS ou carteira secundária (opcional)"
          error={errors.secondaryWallet}
        >
          <Input
            id={COLLECTOR_FIELD_IDS.secondaryWallet}
            name="secondaryWallet"
            autoComplete="off"
            spellCheck={false}
            placeholder="ENS ou carteira secundária (opcional)"
            value={values.secondaryWallet}
            onChange={(event) => onChange('secondaryWallet', event.target.value)}
            className={CHECKOUT_CONTROL}
          />
        </Field>

        <Field
          id={COLLECTOR_FIELD_IDS.walletType}
          label="Tipo de carteira"
          required
          error={errors.walletType}
        >
          <Select
            id={COLLECTOR_FIELD_IDS.walletType}
            name="walletType"
            value={values.walletType}
            aria-invalid={Boolean(errors.walletType)}
            aria-describedby={describedBy(
              COLLECTOR_FIELD_IDS.walletType,
              errors.walletType,
            )}
            onChange={(event) => onChange('walletType', event.target.value)}
          >
            <option value="" disabled>
              Seleccione uma carteira
            </option>
            {WALLET_TYPE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id={COLLECTOR_FIELD_IDS.referralCode}
          label="Código de indicação"
          required
          error={errors.referralCode}
        >
          <Input
            id={COLLECTOR_FIELD_IDS.referralCode}
            name="referralCode"
            autoComplete="off"
            spellCheck={false}
            value={values.referralCode}
            aria-invalid={Boolean(errors.referralCode)}
            aria-describedby={describedBy(
              COLLECTOR_FIELD_IDS.referralCode,
              errors.referralCode,
            )}
            onChange={(event) => onChange('referralCode', event.target.value)}
            className={CHECKOUT_CONTROL}
          />
        </Field>

        <Field
          id={COLLECTOR_FIELD_IDS.email}
          label="E-mail"
          required
          error={errors.email}
        >
          <Input
            id={COLLECTOR_FIELD_IDS.email}
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy(
              COLLECTOR_FIELD_IDS.email,
              errors.email,
            )}
            onChange={(event) => onChange('email', event.target.value)}
            className={CHECKOUT_CONTROL}
          />
        </Field>

        <Field
          id={COLLECTOR_FIELD_IDS.ensName}
          label="Nome ENS"
          required
          error={errors.ensName}
        >
          <div className="flex gap-2">
            <Input
              id={COLLECTOR_FIELD_IDS.ensName}
              name="ensName"
              autoComplete="off"
              spellCheck={false}
              value={values.ensName}
              aria-invalid={Boolean(errors.ensName)}
              aria-describedby={describedBy(
                COLLECTOR_FIELD_IDS.ensName,
                errors.ensName,
              )}
              onChange={(event) => onChange('ensName', event.target.value)}
              className={cn('min-w-0 flex-1', CHECKOUT_CONTROL)}
            />
            <Select
              id={COLLECTOR_FIELD_IDS.ensDomain}
              name="ensDomain"
              aria-label="Domínio ENS"
              containerClassName="w-24 shrink-0"
              value={values.ensDomain}
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

        <div className="sm:col-span-2">
          <label
            htmlFor={COLLECTOR_FIELD_IDS.useOtherWallet}
            className="flex w-fit cursor-pointer items-center gap-3 rounded-md text-caption font-bold text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ink"
          >
            <input
              id={COLLECTOR_FIELD_IDS.useOtherWallet}
              name="useOtherWallet"
              type="checkbox"
              checked={values.useOtherWallet}
              onChange={(event) =>
                onChange('useOtherWallet', event.target.checked)
              }
              className="sr-only"
            />
            <RadioCircle checked={values.useOtherWallet} />
            Usar outra carteira?
          </label>
        </div>

        <Field
          id={COLLECTOR_FIELD_IDS.notes}
          label="Observação do colecionador (opcional)"
          error={errors.notes}
        >
          <Textarea
            id={COLLECTOR_FIELD_IDS.notes}
            name="notes"
            rows={6}
            maxLength={MAX_NOTES_LENGTH}
            value={values.notes}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={describedBy(
              COLLECTOR_FIELD_IDS.notes,
              errors.notes,
            )}
            onChange={(event) => onChange('notes', event.target.value)}
            className={cn(
              'min-h-[152px] max-w-[350px] resize-none',
              CHECKOUT_CONTROL,
            )}
          />
        </Field>
      </div>
    </section>
  )
}
