import { useState } from 'react'

import { RadioCircle } from '@/components/common/radio-option'
import { useToast } from '@/components/common/toast'
import { apiErrorMessage } from '@/lib/api'

import { WALLET_FIELD_IDS } from '../constants'
import { useCreateWallet, useUpdateWallet } from '../mutations'
import {
  EMPTY_WALLET_FORM,
  formToWalletInput,
  hasFormErrors,
  validateWalletForm,
  walletToForm,
  type WalletFormErrors,
  type WalletFormField,
  type WalletFormValues,
} from '../schema'
import {
  WALLET_NETWORK_LABELS,
  walletDisplayAddress,
  type Wallet,
} from '../types'
import { WalletForm } from './wallet-form'

/** Campos herdados da carteira principal quando o colecionador marca "igual". */
function fromPrimary(primary: Wallet): WalletFormValues {
  return {
    ...EMPTY_WALLET_FORM,
    displayName: primary.displayName ?? '',
    network: primary.network,
    profileName: primary.profileName ?? '',
    address: primary.address,
    referralCode: primary.referralCode ?? '',
    email: primary.email ?? '',
    ensName: primary.ensName ?? '',
    ensDomain: primary.ensDomain ?? EMPTY_WALLET_FORM.ensDomain,
    type: 'secundaria',
  }
}

/**
 * Carteiras secundárias do colecionador. O "Adicionar" abre o cadastro na
 * própria seção; a opção "Igual à carteira principal" reaproveita os dados da
 * carteira principal (e dispensa um novo cadastro).
 */
export function SecondaryWalletSection({
  wallets,
  primary,
}: {
  wallets: Wallet[]
  primary: Wallet | null
}) {
  const secondaryWallets = wallets.filter(
    (wallet) => !wallet.primary && wallet.type === 'secundaria',
  )

  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<WalletFormValues>(EMPTY_WALLET_FORM)
  const [errors, setErrors] = useState<WalletFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const { showToast } = useToast()

  const pending = createWallet.isPending || updateWallet.isPending

  function setField(field: WalletFormField, value: string) {
    const next = { ...values, [field]: value }
    setValues(next)
    setFormError(null)
    if (submitted) setErrors(validateWalletForm(next))
  }

  function reset() {
    setOpen(false)
    setEditingId(null)
    setValues(EMPTY_WALLET_FORM)
    setErrors({})
    setFormError(null)
    setSubmitted(false)
  }

  function startAdd() {
    setEditingId(null)
    setValues(
      sameAsPrimary && primary
        ? fromPrimary(primary)
        : { ...EMPTY_WALLET_FORM, type: 'secundaria' },
    )
    setErrors({})
    setFormError(null)
    setSubmitted(false)
    setOpen(true)
  }

  function startEdit(wallet: Wallet) {
    setEditingId(wallet.id)
    setValues(walletToForm(wallet))
    setErrors({})
    setFormError(null)
    setSubmitted(false)
    setOpen(true)
  }

  async function handleSubmit() {
    setSubmitted(true)
    setFormError(null)

    const nextErrors = validateWalletForm(values)
    setErrors(nextErrors)
    if (hasFormErrors(nextErrors)) return

    const input = formToWalletInput(values)

    try {
      if (editingId) {
        await updateWallet.mutateAsync({ id: editingId, patch: input })
      } else {
        await createWallet.mutateAsync(input)
      }
      reset()
      showToast('Carteira salva com sucesso')
    } catch (error) {
      setFormError(apiErrorMessage(error))
    }
  }

  return (
    <section
      aria-labelledby="secondary-wallet-heading"
      className="mt-12 border-t border-border pt-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="secondary-wallet-heading" className="text-h2 text-foreground">
          Carteira secundária
        </h2>
        <button
          type="button"
          onClick={startAdd}
          disabled={sameAsPrimary || open}
          className="text-body-bold text-text-accent transition-colors hover:text-primary-light disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>

      <label
        htmlFor={WALLET_FIELD_IDS.sameAsPrimary}
        className="text-caption mt-4 flex w-fit cursor-pointer items-center gap-3 rounded-md font-bold text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ink"
      >
        <input
          id={WALLET_FIELD_IDS.sameAsPrimary}
          name="sameAsPrimary"
          type="checkbox"
          checked={sameAsPrimary}
          onChange={(event) => {
            setSameAsPrimary(event.target.checked)
            if (event.target.checked) reset()
          }}
          className="sr-only"
        />
        <RadioCircle checked={sameAsPrimary} />
        Igual à carteira principal
      </label>

      {sameAsPrimary ? (
        <p className="text-body mt-4 text-text-secondary">
          A carteira secundária usa os dados da carteira principal.
        </p>
      ) : open ? (
        <WalletForm
          idPrefix="secondary-"
          values={values}
          errors={errors}
          pending={pending}
          formError={formError}
          submitLabel="Salvar carteira"
          onChange={setField}
          onSubmit={() => void handleSubmit()}
          onCancel={reset}
        />
      ) : secondaryWallets.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-3">
          {secondaryWallets.map((wallet) => (
            <li
              key={wallet.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-card p-4"
            >
              <div className="min-w-0">
                <p className="text-body-bold text-foreground">{wallet.label}</p>
                <p className="text-caption mt-1 text-text-secondary">
                  {`${walletDisplayAddress(wallet)} · ${WALLET_NETWORK_LABELS[wallet.network]}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(wallet)}
                className="text-caption-bold text-text-accent transition-colors hover:text-primary-light"
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body mt-4 text-text-secondary">
          Você ainda não adicionou uma carteira secundária.
        </p>
      )}
    </section>
  )
}
