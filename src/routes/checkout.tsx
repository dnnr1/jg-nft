import { useMemo, useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { ErrorState } from '@/components/common/error-state'
import { buttonVariants } from '@/components/ui/button'
import { apiErrorCode, apiErrorMessage } from '@/lib/api'
import { useRequireSession } from '@/modules/auth/use-require-session'
import { cartQuery } from '@/modules/cart/queries'
import { QuoteChangesNotice } from '@/modules/cart/components/quote-changes-notice'
import { QUOTE_CHANGED_CODE } from '@/modules/cart/quote'
import { useQuoteChanges } from '@/modules/cart/use-quote-changes'
import {
  DEFAULT_WALLET_PROVIDER,
  collectorFieldId,
  type WalletProviderId,
} from '@/modules/checkout/constants'
import { CheckoutHeader } from '@/modules/checkout/components/checkout-header'
import { CheckoutSkeleton } from '@/modules/checkout/components/checkout-skeleton'
import { CollectorForm } from '@/modules/checkout/components/collector-form'
import { ConnectedWallets } from '@/modules/checkout/components/connected-wallets'
import { OrderSummary } from '@/modules/checkout/components/order-summary'
import { WalletProviders } from '@/modules/checkout/components/wallet-providers'
import { collectorPrefill, collectorPrefillKey } from '@/modules/checkout/prefill'
import { useCollectorForm } from '@/modules/checkout/use-collector-form'
import { newIdempotencyKey } from '@/modules/orders/api'
import { useCreateOrder } from '@/modules/orders/mutations'
import { profileQuery } from '@/modules/profile/queries'
import { useUpdateWallet } from '@/modules/wallets/mutations'
import { walletsQuery } from '@/modules/wallets/queries'
import { cn } from 'cn'

export const Route = createFileRoute('/checkout')({
  head: () => ({
    meta: [{ title: 'Pagamento — Kurio' }],
  }),
  component: CheckoutPage,
})

function CheckoutPage() {
  const cartResult = useQuery(cartQuery())
  const walletsResult = useQuery(walletsQuery())

  const updateWallet = useUpdateWallet()
  const createOrder = useCreateOrder()
  const navigate = useNavigate()
  // O checkout exige sessão: sem ela o visitante volta ao carrinho com o
  // diálogo de login aberto e retoma o checkout assim que entrar.
  const { isAllowed } = useRequireSession('/cart')

  // Os dados do colecionador já cadastrados alimentam o formulário da tela.
  const profileResult = useQuery({ ...profileQuery(), enabled: isAllowed })

  const [provider, setProvider] = useState<WalletProviderId | null>(
    DEFAULT_WALLET_PROVIDER,
  )
  const [validated, setValidated] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  /**
   * Mudanças de cotação recebidas em tempo real. Elas nunca passam em silêncio:
   * o resumo mostra os novos valores e a confirmação volta a ser exigida.
   */
  const quoteChanges = useQuoteChanges(cartResult.data)
  /** Chave estável da tentativa: reenviar após falha recupera o mesmo pedido. */
  const idempotencyKey = useRef<string | null>(null)

  const wallets = walletsResult.data?.items ?? []
  const connectedWallet = wallets.find((wallet) => wallet.connected) ?? null
  /** Carteira cujos dados preenchem o formulário: a do pagamento, ou a principal. */
  const checkoutWallet =
    connectedWallet ??
    wallets.find((wallet) => wallet.primary) ??
    wallets[0] ??
    null
  const profile = profileResult.data

  const prefill = useMemo(
    () =>
      profile || checkoutWallet
        ? {
            key: collectorPrefillKey(profile, checkoutWallet),
            values: collectorPrefill(profile, checkoutWallet),
          }
        : null,
    [profile, checkoutWallet],
  )

  const form = useCollectorForm(prefill)

  const walletError = updateWallet.isError
    ? apiErrorMessage(
        updateWallet.error,
        'Não foi possível atualizar a carteira.',
      )
    : null

  const submitError = createOrder.isError
    ? apiErrorMessage(createOrder.error, 'Não foi possível concluir o pedido.')
    : null

  function connectWallet(id: string) {
    setValidated(false)
    updateWallet.mutate({ id, patch: { connected: true } })
  }

  function setPrimaryWallet(id: string) {
    updateWallet.mutate({ id, patch: { primary: true } })
  }

  function toggleConnection(id: string, connected: boolean) {
    setValidated(false)
    updateWallet.mutate({ id, patch: { connected } })
  }

  function swapWallet() {
    const next = wallets.find((wallet) => !wallet.connected)
    if (next) connectWallet(next.id)
  }

  function confirmWithForm() {
    const result = form.validate()
    if (!result.ok) {
      setValidated(false)
      if (result.firstField) {
        document.getElementById(collectorFieldId(result.firstField))?.focus()
      }
      return
    }
    submitOrder()
  }

  function confirmWithWallet() {
    setBlockedMessage(null)
    if (!connectedWallet) {
      setValidated(false)
      setBlockedMessage('Conecte uma carteira para pagar.')
      return
    }
    if (!provider) {
      setValidated(false)
      setBlockedMessage('Selecione a carteira e a rede.')
      return
    }
    submitOrder()
  }

  /** Cria o pedido a partir da cotação atual e abre o recibo confirmado. */
  function submitOrder() {
    setBlockedMessage(null)
    setValidated(true)

    const key = idempotencyKey.current ?? newIdempotencyKey()
    idempotencyKey.current = key

    // A confirmação vale para a cotação que está na tela agora: o `If-Match`
    // carrega o ETag dela e a API recusa (`QUOTE_CHANGED`) se o carrinho já
    // tiver mudado antes do pedido chegar.
    createOrder.mutate(
      { provider, idempotencyKey: key, quoteEtag: cartResult.data?.etag ?? '' },
      {
        onSuccess: (order) => {
          quoteChanges.acknowledge()
          void navigate({ to: '/orders/$id', params: { id: order.id } })
        },
        onError: (error) => {
          // Cotação desatualizada: recarrega o carrinho para que o novo total
          // apareça e o usuário confirme de novo.
          if (apiErrorCode(error) === QUOTE_CHANGED_CODE) {
            void cartResult.refetch()
          }
        },
      },
    )
  }

  if (
    !isAllowed ||
    cartResult.isPending ||
    walletsResult.isPending ||
    profileResult.isPending
  ) {
    return (
      <div className="flex flex-col gap-6">
        <CheckoutHeader />
        <CheckoutSkeleton />
      </div>
    )
  }

  if (cartResult.isError || !cartResult.data) {
    return (
      <div className="flex flex-col gap-6">
        <CheckoutHeader />
        <ErrorState
          title="Não foi possível carregar o pagamento"
          description="Verifique sua conexão e tente novamente."
          onRetry={() => void cartResult.refetch()}
        />
      </div>
    )
  }

  if (walletsResult.isError) {
    return (
      <div className="flex flex-col gap-6">
        <CheckoutHeader />
        <ErrorState
          title="Não foi possível carregar suas carteiras"
          description="Verifique sua conexão e tente novamente."
          onRetry={() => void walletsResult.refetch()}
        />
      </div>
    )
  }

  const cart = cartResult.data

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <CheckoutHeader />
        <section className="rounded-lg border border-border p-8 text-center">
          <h2 className="text-h2 font-bold text-foreground">
            Nada para pagar por aqui
          </h2>
          <p className="text-body my-4 text-text-secondary">
            Adicione edições ao carrinho para revisar o pedido e escolher a
            carteira.
          </p>
          <Link
            to="/"
            hash="catalogo"
            className={cn(buttonVariants(), 'inline-flex')}
          >
            Explorar mercado
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-0">
      <CheckoutHeader />

      <QuoteChangesNotice
        changes={quoteChanges.changes}
        onAcknowledge={quoteChanges.acknowledge}
        className="mt-4"
      />

      {/* Desktop e tablet */}
      <div
        className={cn(
          'mt-7 hidden gap-5 md:grid md:grid-cols-1 md:gap-10',
          'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_354px] lg:gap-5',
        )}
      >
        <CollectorForm
          values={form.values}
          errors={form.errors}
          onChange={form.setField}
          className="lg:col-span-2"
        />
        <OrderSummary
          cart={cart}
          provider={provider}
          onProviderChange={(id) => {
            setValidated(false)
            setProvider(id)
          }}
          onConfirm={confirmWithForm}
          validated={validated}
          pending={createOrder.isPending}
          error={submitError}
        />
      </div>

      {/* Mobile */}
      <div className="mt-2 flex flex-col gap-8 md:hidden">
        <ConnectedWallets
          wallets={wallets}
          selectedId={connectedWallet?.id ?? null}
          onSelect={connectWallet}
          onSetPrimary={setPrimaryWallet}
          onToggleConnection={toggleConnection}
          onSwap={swapWallet}
          pendingId={updateWallet.variables?.id ?? null}
          error={walletError}
        />

        <section aria-labelledby="mobile-wallet-network-heading">
          <h2
            id="mobile-wallet-network-heading"
            className="text-body-bold text-foreground"
          >
            Carteira e rede
          </h2>
          <WalletProviders
            variant="surface"
            name="checkout-provider-mobile"
            idPrefix="checkout-provider-mobile"
            value={provider}
            onChange={(id) => {
              setValidated(false)
              setProvider(id)
            }}
            className="mt-4"
          />
        </section>

        <div className="flex items-baseline justify-end gap-3">
          <span className="text-body-lg-bold text-foreground">Total:</span>
          <span className="text-body-lg-bold text-text-accent">
            {cart.summary.total} ETH
          </span>
        </div>

        {blockedMessage ? (
          <p role="alert" className="text-tiny -mt-4 text-coral">
            {blockedMessage}
          </p>
        ) : submitError ? (
          <p role="alert" className="text-tiny -mt-4 text-coral">
            {submitError}
          </p>
        ) : createOrder.isPending ? (
          <p role="status" className="text-tiny -mt-4 text-text-secondary">
            Enviando pedido…
          </p>
        ) : validated ? (
          <p role="status" className="text-tiny -mt-4 text-success">
            Dados revisados. Tudo pronto para enviar o pedido.
          </p>
        ) : null}

        <button
          type="button"
          onClick={confirmWithWallet}
          disabled={createOrder.isPending}
          className={cn(
            buttonVariants({ variant: 'pill' }),
            'h-13 w-full rounded-full',
          )}
        >
          {createOrder.isPending ? 'Enviando pedido…' : 'Confirmar compra'}
        </button>
      </div>
    </div>
  )
}
