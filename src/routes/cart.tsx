import { useCallback } from 'react'
import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'

import { ErrorState } from '@/components/common/error-state'
import { buttonVariants } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/api'
import { cn } from 'cn'
import { catalogListQuery } from '@/modules/catalog/queries'
import { CartItems } from '@/modules/cart/components/cart-items'
import { CartRelated } from '@/modules/cart/components/cart-related'
import { CartSkeleton } from '@/modules/cart/components/cart-skeleton'
import { CartSummaryPanel } from '@/modules/cart/components/cart-summary'
import { QuoteChangesNotice } from '@/modules/cart/components/quote-changes-notice'
import {
  useApplyCartCoupon,
  useRemoveCartCoupon,
  useRemoveCartItem,
  useUpdateCartItemQuantity,
} from '@/modules/cart/mutations'
import { cartQuery } from '@/modules/cart/queries'
import { useQuoteChanges } from '@/modules/cart/use-quote-changes'

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [{ title: 'Carrinho de NFTs — Kurio' }],
  }),
  component: CartPage,
})

const RELATED_PARAMS = {
  sort: 'recent',
  tab: 'todos',
  page: 1,
  pageSize: 10,
} as const

/** Tabela + resumo da carteira, nas larguras do layout de referência. */
const CART_GRID =
  'grid gap-5 md:gap-10 lg:grid-cols-[minmax(0,742px)_306px] lg:justify-between'

function CartPage() {
  const cartResult = useQuery(cartQuery())
  const relatedResult = useQuery(catalogListQuery({ ...RELATED_PARAMS }))

  const quantityMutation = useUpdateCartItemQuantity()
  const removeMutation = useRemoveCartItem()
  const couponMutation = useApplyCartCoupon()
  const removeCouponMutation = useRemoveCartCoupon()

  // Mudanças de cotação recebidas em tempo real (preço/disponibilidade).
  const quoteChanges = useQuoteChanges(cartResult.data)

  const changeQuantity = useCallback(
    (id: string, quantity: number) => {
      quantityMutation.mutate({ id, quantity })
    },
    [quantityMutation],
  )

  const removeItem = useCallback(
    (id: string) => {
      removeMutation.mutate(id)
    },
    [removeMutation],
  )

  const mutationError = removeMutation.isError
    ? apiErrorMessage(removeMutation.error, 'Não foi possível remover o item.')
    : quantityMutation.isError
      ? apiErrorMessage(
          quantityMutation.error,
          'Não foi possível atualizar a quantidade.',
        )
      : removeCouponMutation.isError
        ? apiErrorMessage(
            removeCouponMutation.error,
            'Não foi possível remover o cupom.',
          )
        : null

  const relatedQueryFailed = relatedResult.isError

  const cart = cartResult.data

  if (cartResult.isPending) {
    return (
      <div className="flex flex-col gap-5">
        <CartMobileHeader />
        <CartSkeleton />
      </div>
    )
  }

  if (cartResult.isError || !cart) {
    return (
      <div className="flex flex-col gap-6">
        <CartPageHeader />
        <ErrorState
          title="Não foi possível carregar seu carrinho"
          description="Verifique sua conexão e tente novamente."
          onRetry={() => void cartResult.refetch()}
        />
      </div>
    )
  }

  const blocked = cart.items.some(
    (item) => !item.editable || item.available === 0,
  )

  return (
    <div className="flex flex-col gap-14">
      {mutationError ? (
        <p
          role="alert"
          className="text-body rounded-md border border-coral/40 bg-coral/10 px-4 py-3 text-coral"
        >
          {mutationError}
        </p>
      ) : null}

      <QuoteChangesNotice
        changes={quoteChanges.changes}
        onAcknowledge={quoteChanges.acknowledge}
      />

      <div className="flex flex-col gap-5 md:gap-0">
        <CartPageHeader />

        {cart.items.length === 0 ? (
          <section className="rounded-lg border border-border p-8 text-center md:mt-6">
            <h2 className="text-h2 font-bold text-foreground">
              Seu carrinho está vazio
            </h2>
            <p className="text-body my-4 text-text-secondary">
              Explore o mercado e adicione edições à sua coleção.
            </p>
            <Link
              to="/"
              hash="catalogo"
              className={cn(buttonVariants(), 'inline-flex')}
            >
              Explorar mercado
            </Link>
          </section>
        ) : (
          <div className={CART_GRID}>
            <section aria-label="Itens do carrinho">
              <CartItems
                items={cart.items}
                onQuantityChange={changeQuantity}
                onRemove={removeItem}
                pendingQuantityId={quantityMutation.variables?.id}
                pendingRemoveId={removeMutation.variables}
              />
            </section>

            <CartSummaryPanel
              cart={cart}
              onApplyCoupon={(code) => couponMutation.mutate(code)}
              onRemoveCoupon={() => removeCouponMutation.mutate()}
              couponPending={
                couponMutation.isPending || removeCouponMutation.isPending
              }
              couponError={
                couponMutation.isError
                  ? apiErrorMessage(
                      couponMutation.error,
                      'Não foi possível aplicar o cupom.',
                    )
                  : null
              }
              blocked={blocked}
            />
          </div>
        )}
      </div>

      {relatedQueryFailed ? null : (
        <CartRelated
          query={relatedResult}
          excludeIds={cart.items.map((item) => item.id)}
        />
      )}
    </div>
  )
}

function CartMobileHeader() {
  const router = useRouter()
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between md:hidden">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => {
          if (router.history.canGoBack()) router.history.back()
          else void navigate({ to: '/' })
        }}
        className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-surface-raised"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <h1 className="text-body-lg-bold text-foreground">Carrinho de NFTs</h1>
      <span aria-hidden="true" className="size-9" />
    </div>
  )
}

function CartPageHeader() {
  return (
    <>
      <CartMobileHeader />
      <CartBreadcrumb />
    </>
  )
}

function CartBreadcrumb() {
  return (
    <nav
      aria-label="Caminho de navegação"
      className="text-body hidden flex-wrap items-center gap-2 font-bold text-foreground md:flex"
    >
      <Link to="/" className="transition-colors hover:text-text-accent">
        Início
      </Link>
      <span aria-hidden="true">/</span>
      <Link
        to="/"
        hash="catalogo"
        className="transition-colors hover:text-text-accent"
      >
        Mercado
      </Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Carrinho</span>
    </nav>
  )
}
