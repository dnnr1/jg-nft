import { useState } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiErrorMessage } from '@/lib/api'
import {
  useApplyCartCoupon,
  useRemoveCartCoupon,
} from '@/modules/cart/mutations'
import type { Cart } from '@/modules/cart/types'
import { cn } from 'cn'
import { CHECKOUT_CONTROL, type WalletProviderId } from '../constants'
import { WalletProviders } from './wallet-providers'

function OrderCoupon({ coupon }: { coupon: Cart['coupon'] }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const apply = useApplyCartCoupon()
  const remove = useRemoveCartCoupon()

  if (coupon) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <p className="text-tiny text-text-secondary">
          Cupom{' '}
          <span className="font-bold text-text-accent">{coupon.code}</span>
          {` aplicado (${coupon.percentOff}%)`}
        </p>
        <button
          type="button"
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
          className="text-tiny font-bold text-text-accent transition-colors hover:text-primary-light disabled:opacity-40"
        >
          Remover
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <p className="mt-3 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-tiny text-foreground transition-colors hover:text-text-accent hover:underline"
        >
          Tem um código promocional? Aplique aqui
        </button>
      </p>
    )
  }

  return (
    <form
      className="mt-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const value = code.trim()
        if (value) apply.mutate(value)
      }}
    >
      <label htmlFor="checkout-coupon" className="sr-only">
        Código promocional
      </label>
      <div className="flex gap-2">
        <Input
          id="checkout-coupon"
          name="coupon"
          autoComplete="off"
          spellCheck={false}
          value={code}
          placeholder="Digite o código promocional"
          aria-invalid={apply.isError}
          aria-describedby={apply.isError ? 'checkout-coupon-error' : undefined}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          className={cn('min-w-0 flex-1', CHECKOUT_CONTROL)}
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className={cn(
            buttonVariants(),
            'text-body-bold h-9 shrink-0 px-4',
          )}
        >
          {apply.isPending ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      {apply.isError ? (
        <p id="checkout-coupon-error" role="alert" className="mt-2 text-tiny text-coral">
          {apiErrorMessage(apply.error, 'Não foi possível aplicar o cupom.')}
        </p>
      ) : null}
    </form>
  )
}

function OrderItems({ cart }: { cart: Cart }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="text-body mt-3 flex items-baseline justify-between border-b border-border pb-2 font-bold text-foreground"
      >
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>
      <ul
        aria-label="NFTs do pedido"
        className="mt-3 flex flex-col gap-2"
      >
        {cart.items.map((item) => (
          <li
            key={item.id}
            className="flex items-stretch overflow-hidden rounded-md bg-surface-card"
          >
            <img
              src={item.nft.image}
              alt=""
              width={144}
              height={144}
              loading="lazy"
              className="w-14 shrink-0 self-stretch bg-surface-raised object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2.5 py-2">
              <p className="text-body-bold truncate text-foreground">
                {item.nft.name}
              </p>
              <span className="text-micro truncate text-text-secondary">
                ID do token: {item.nft.tokenId ?? '—'}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 pr-2.5">
              <span className="text-micro text-text-secondary">
                {`(× ${item.quantity})`}
              </span>
              <strong className="text-body-lg-bold text-text-accent">
                <span className="sr-only">Subtotal da linha: </span>
                {item.lineTotal} ETH
              </strong>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

function OrderTotals({ cart }: { cart: Cart }) {
  const { summary } = cart

  return (
    <dl className="mt-3 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-caption text-foreground">Subtotal</dt>
        <dd className="text-body-lg text-foreground">{summary.subtotal} ETH</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-caption text-foreground">Desconto do lançamento</dt>
        <dd className="text-body-lg text-foreground">
          (−) {summary.discount}
        </dd>
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-caption text-foreground">Taxa de rede</dt>
          <dd className="text-body-lg text-foreground">
            {summary.networkFee} ETH
          </dd>
        </div>
        <p className="text-micro mt-2 text-center text-text-accent">
          Taxa estimada
        </p>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <dt className="text-body-lg-bold text-foreground">Total</dt>
        <dd
          data-testid="checkout-total"
          className="text-body-lg-bold text-text-accent"
        >
          {summary.total} ETH
        </dd>
      </div>
    </dl>
  )
}

interface OrderSummaryProps {
  cart: Cart
  provider: WalletProviderId | null
  onProviderChange: (id: WalletProviderId) => void
  onConfirm: () => void
  confirmDisabled?: boolean
  validated?: boolean
  pending?: boolean
  error?: string | null
  className?: string
}

export function OrderSummary({
  cart,
  provider,
  onProviderChange,
  onConfirm,
  confirmDisabled,
  validated,
  pending,
  error,
  className,
}: OrderSummaryProps) {
  return (
    <aside
      aria-label="Resumo do pedido"
      className={cn('lg:sticky lg:top-6 lg:self-start', className)}
    >
      <h2 className="text-body-lg-bold text-foreground">Seus NFTs</h2>

      <OrderItems cart={cart} />

      <OrderCoupon coupon={cart.coupon} />

      <OrderTotals cart={cart} />

      <div className="mt-3">
        <h3 className="text-body-lg-bold text-center text-foreground">
          Carteira e rede
        </h3>

        <WalletProviders
          variant="outline"
          name="checkout-provider"
          idPrefix="checkout-provider"
          value={provider}
          onChange={onProviderChange}
          className="mt-3"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-tiny text-coral">
          {error}
        </p>
      ) : pending ? (
        <p role="status" className="mt-4 text-tiny text-text-secondary">
          Enviando pedido…
        </p>
      ) : validated ? (
        <p role="status" className="mt-4 text-tiny text-success">
          Dados revisados. Tudo pronto para enviar o pedido.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onConfirm}
        disabled={confirmDisabled || pending}
        className={cn(buttonVariants(), 'mt-6 h-9 w-full rounded-default')}
      >
        {pending ? 'Enviando pedido…' : 'Confirmar compra'}
      </button>
    </aside>
  )
}
