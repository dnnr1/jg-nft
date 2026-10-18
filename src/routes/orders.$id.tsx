import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { ErrorState } from '@/components/common/error-state'
import { buttonVariants } from '@/components/ui/button'
import { apiErrorStatus } from '@/lib/api'
import { cn } from 'cn'
import { OrderConfirmation } from '@/modules/orders/components/order-confirmation'
import { OrderConfirmationSkeleton } from '@/modules/orders/components/order-confirmation-skeleton'
import { orderQuery } from '@/modules/orders/queries'

export const Route = createFileRoute('/orders/$id')({
  head: () => ({
    meta: [{ title: 'Confirmação do pedido — Kurio' }],
  }),
  component: OrderConfirmationPage,
})

function OrderConfirmationPage() {
  const { id } = Route.useParams()
  const orderResult = useQuery(orderQuery(id))

  if (orderResult.isPending) {
    return (
      <div className="w-full">
        <OrderConfirmationSkeleton />
      </div>
    )
  }

  if (orderResult.isError || !orderResult.data) {
    const notFound = apiErrorStatus(orderResult.error) === 404

    return (
      <div className="w-full">
        {notFound ? (
          <section className="mx-auto w-full max-w-md border border-border bg-surface-card p-8 text-center shadow-card">
            <h1 className="text-h2 font-bold text-foreground">
              Pedido não encontrado
            </h1>
            <p className="text-body my-4 text-text-secondary">
              O recibo que você procura não existe ou não está mais disponível.
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
          <ErrorState
            title="Não foi possível carregar a confirmação"
            description="Verifique sua conexão e tente novamente."
            onRetry={() => void orderResult.refetch()}
          />
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <OrderConfirmation order={orderResult.data} />
    </div>
  )
}
