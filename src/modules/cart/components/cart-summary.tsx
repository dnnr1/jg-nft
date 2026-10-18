import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from 'cn'
import { useAuth } from '@/modules/auth/auth-context'
import { rememberAfterLogin } from '@/modules/auth/after-login'
import type { Cart } from '../types'

/**
 * O checkout exige sessão, então o CTA muda de rótulo conforme o visitante.
 * `text-base` (16px/24px) equivale ao token body-lg-bold; usar o tamanho cru
 * preserva o `text-ink` escuro da variante, que o merge descartaria.
 */
const CHECKOUT_CTA_CLASS = cn(
  buttonVariants({ size: 'full' }),
  'text-base mt-5 h-11 rounded-full md:mt-4 md:h-9 md:rounded-default md:text-sm',
)

interface CartSummaryPanelProps {
  cart: Cart
  onApplyCoupon: (code: string) => void
  onRemoveCoupon: () => void
  couponPending?: boolean
  couponError?: string | null
  /** Bloqueia o checkout quando algum item ficou indisponível. */
  blocked?: boolean
}

function CouponForm({
  coupon,
  onApply,
  onRemove,
  pending,
  error,
}: {
  coupon: Cart['coupon']
  onApply: (code: string) => void
  onRemove: () => void
  pending?: boolean
  error?: string | null
}) {
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (coupon) setDraft('')
  }, [coupon])

  if (coupon) {
    return (
      <div className="md:mt-5">
        <span className="text-caption hidden font-bold text-foreground md:inline">
          Código promocional
        </span>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/60 px-3 py-2">
          <p className="text-body text-foreground">
            <span className="font-bold text-text-accent">{coupon.code}</span>
            {` · ${coupon.percentOff}% de desconto aplicado`}
          </p>
          <button
            type="button"
            onClick={onRemove}
            disabled={pending}
            aria-label={`Remover cupom ${coupon.code}`}
            className="text-caption-bold text-text-accent transition-colors hover:text-primary-light disabled:opacity-40"
          >
            Remover
          </button>
        </div>
        <p role="status" className="sr-only">
          {`Cupom ${coupon.code} aplicado: ${coupon.percentOff}% de desconto.`}
        </p>
      </div>
    )
  }

  const inputId = 'cart-coupon'
  const errorId = 'cart-coupon-error'

  return (
    <form
      className="flex flex-col gap-2 md:mt-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const code = draft.trim()
        if (code) onApply(code)
      }}
    >
      <label
        htmlFor={inputId}
        className="text-caption hidden font-bold text-foreground md:block"
      >
        Código promocional
      </label>
      <div className="flex h-11 items-center gap-1 rounded-full border border-border-soft bg-ink/40 p-1 pl-4 md:h-9 md:gap-0 md:overflow-hidden md:rounded-md md:border-primary/90 md:bg-transparent md:p-0">
        <Input
          id={inputId}
          name="coupon"
          value={draft}
          autoComplete="off"
          spellCheck={false}
          placeholder="Digite o código promocional..."
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setDraft(event.target.value.toUpperCase())}
          className="text-tiny h-full flex-1 rounded-none border-0 bg-transparent px-0 shadow-none placeholder:text-micro focus-visible:border-0 focus-visible:ring-0 md:px-2.5"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-body-bold h-9 shrink-0 rounded-full border border-primary/60 bg-primary px-5 text-ink transition-colors hover:bg-primary/90 disabled:opacity-60 md:h-full md:rounded-none"
        >
          {pending ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-tiny text-coral">
          {error}
        </p>
      ) : null}
    </form>
  )
}

export function CartSummaryPanel({
  cart,
  onApplyCoupon,
  onRemoveCoupon,
  couponPending,
  couponError,
  blocked,
}: CartSummaryPanelProps) {
  const { summary } = cart
  const panelRef = useRef<HTMLElement>(null)
  const { user, openAuthDialog } = useAuth()

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const root = document.documentElement

    const update = () => {
      // Altura + folga, para o conteúdo rolar acima do painel fixo.
      root.style.setProperty(
        '--cart-summary-height',
        `${panel.getBoundingClientRect().height + 12}px`,
      )
    }

    const observer = new ResizeObserver(update)
    observer.observe(panel)
    update()

    return () => {
      observer.disconnect()
      root.style.removeProperty('--cart-summary-height')
    }
  }, [])

  return (
    <aside
      ref={panelRef}
      aria-label="Resumo da carteira"
      className="max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:w-full max-md:rounded-b-none max-md:pb-[calc(1rem+env(safe-area-inset-bottom,0px))] max-md:shadow-card rounded-lg bg-surface-card p-4 md:rounded-none md:bg-transparent md:p-0 lg:sticky lg:top-6 lg:self-start"
    >
      <h2 className="text-body-lg-bold hidden border-b border-border pb-2 text-foreground md:block">
        Resumo da carteira
      </h2>

      <CouponForm
        coupon={cart.coupon}
        onApply={onApplyCoupon}
        onRemove={onRemoveCoupon}
        pending={couponPending}
        error={couponError}
      />

      <dl className="mt-5 flex flex-col gap-2.5 md:gap-1.5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-caption text-foreground">Subtotal</dt>
          <dd className="text-body-lg text-foreground">
            {summary.subtotal} ETH
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-caption text-foreground">
            Desconto do lançamento
          </dt>
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
          <p className="text-micro mt-0.5 text-right text-text-accent">
            Taxa estimada
          </p>
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-4 md:mt-5">
          <dt className="text-body-lg-bold text-foreground">Total</dt>
          <dd className="text-body-lg-bold text-text-accent">
            {summary.total} ETH
          </dd>
        </div>
      </dl>

      {blocked ? (
        <button type="button" disabled className={CHECKOUT_CTA_CLASS}>
          Edição indisponível
        </button>
      ) : user ? (
        <Link to="/checkout" className={CHECKOUT_CTA_CLASS}>
          Finalizar
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            rememberAfterLogin('/checkout')
            openAuthDialog('login')
          }}
          className={CHECKOUT_CTA_CLASS}
        >
          Conectar e finalizar
        </button>
      )}

      <Link
        to="/"
        hash="catalogo"
        className="text-body-bold mt-2 hidden justify-center text-text-accent transition-colors hover:text-primary-light md:flex"
      >
        Continuar explorando
      </Link>
    </aside>
  )
}
