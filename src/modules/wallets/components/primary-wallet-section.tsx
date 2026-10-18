import { useState } from 'react'

import { useToast } from '@/components/common/toast'
import { apiErrorMessage } from '@/lib/api'

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
import type { Wallet } from '../types'
import { WalletForm } from './wallet-form'

/**
 * Cadastro e edição da carteira principal. O "Adicionar" abre o mesmo
 * formulário em modo de criação; salvar define a nova carteira como principal.
 */
export function PrimaryWalletSection({ wallets }: { wallets: Wallet[] }) {
  const primary = wallets.find((wallet) => wallet.primary) ?? null
  const [creating, setCreating] = useState(false)
  const [values, setValues] = useState<WalletFormValues>(() =>
    primary
      ? walletToForm(primary)
      : { ...EMPTY_WALLET_FORM, type: 'principal' },
  )
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

  function startCreate() {
    setCreating(true)
    setValues({ ...EMPTY_WALLET_FORM, type: 'principal' })
    setErrors({})
    setFormError(null)
    setSubmitted(false)
  }

  function cancelCreate() {
    setCreating(false)
    setValues(primary ? walletToForm(primary) : EMPTY_WALLET_FORM)
    setErrors({})
    setFormError(null)
    setSubmitted(false)
  }

  async function handleSubmit() {
    setSubmitted(true)
    setFormError(null)

    const nextErrors = validateWalletForm(values)
    setErrors(nextErrors)
    if (hasFormErrors(nextErrors)) return

    const input = formToWalletInput(values)

    try {
      if (creating || !primary) {
        const data = await createWallet.mutateAsync(input)
        const created = data.items.find((wallet) => wallet.primary)
        if (created) setValues(walletToForm(created))
        setCreating(false)
      } else {
        await updateWallet.mutateAsync({ id: primary.id, patch: input })
      }
      showToast('Carteira salva com sucesso')
    } catch (error) {
      setFormError(apiErrorMessage(error))
    }
  }

  return (
    <section aria-labelledby="primary-wallet-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="primary-wallet-heading" className="text-h1 text-foreground">
          Carteira principal
        </h1>
        <button
          type="button"
          onClick={startCreate}
          disabled={creating}
          className="text-body-bold text-text-accent transition-colors hover:text-primary-light disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>

      <p className="text-body mt-2 text-text-secondary">
        Estas carteiras ficam disponíveis no pagamento e para receber NFTs
        comprados.
      </p>

      <WalletForm
        values={values}
        errors={errors}
        pending={pending}
        formError={formError}
        submitLabel="Salvar carteira"
        onChange={setField}
        onSubmit={() => void handleSubmit()}
        onCancel={creating && primary ? cancelCreate : undefined}
      />
    </section>
  )
}
