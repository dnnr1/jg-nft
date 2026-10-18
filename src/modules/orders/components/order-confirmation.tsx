import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from 'cn'

import {
  explorerActionLabel,
  formatReceiptDate,
  shortTransactionId,
} from '../format'
import type { Order, OrderStatus } from '../types'
import { ThankYouBadge } from './thank-you-badge'

const STATUS_HEADINGS: Record<OrderStatus, string> = {
  confirmed: 'Seus NFTs agora estão na sua carteira',
  pending: 'Estamos confirmando sua transação',
  refused: 'Não foi possível concluir o pedido',
}

function MetaItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-micro text-text-secondary">{label}</dt>
      <dd className="text-caption truncate text-foreground">{value}</dd>
    </div>
  )
}

function OrderItems({ order }: { order: Order }) {
  return (
    <table className="mt-1 w-full border-collapse text-left">
      <caption className="sr-only">Detalhes da transação</caption>
      <thead>
        <tr className="text-caption-bold text-foreground">
          <th scope="col" className="border-b border-border pt-2 pb-1.5 font-bold">
            NFTs
          </th>
          <th
            scope="col"
            className="border-b border-border pt-2 pb-1.5 text-center font-bold"
          >
            Edições
          </th>
          <th
            scope="col"
            className="border-b border-border pt-2 pb-1.5 text-right font-bold"
          >
            Subtotal
          </th>
        </tr>
      </thead>
      <tbody>
        {order.items.map((item) => (
          <tr key={item.id}>
            <td className="py-2 pr-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={item.image}
                  alt=""
                  width={48}
                  height={48}
                  loading="lazy"
                  className="size-12 shrink-0 rounded-sm bg-surface-raised object-cover"
                />
                <div className="min-w-0">
                  <p className="text-body-bold truncate text-foreground">
                    {item.name}
                  </p>
                  <p className="text-micro truncate text-text-secondary">
                    ID do token: {item.tokenId ?? '—'}
                  </p>
                </div>
              </div>
            </td>
            <td className="text-body-regular py-2 text-center whitespace-nowrap text-text-secondary">
              (× {item.quantity})
            </td>
            <td className="text-body-lg-bold py-2 text-right whitespace-nowrap text-text-accent">
              {item.lineTotal} ETH
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function StatusMessage({ order }: { order: Order }) {
  return (
    <div className="border-t border-border px-4 py-5 text-center md:px-6">
      <p className="text-body-regular text-text-secondary">
        {order.status === 'refused'
          ? order.failureReason ??
            'O pagamento foi recusado. Nenhum valor foi cobrado; seus itens continuam no carrinho.'
          : 'Assim que a rede confirmar a transação, o recibo é atualizado automaticamente.'}
      </p>
      {order.status === 'refused' ? (
        <Link to="/cart" className={cn(buttonVariants(), 'mt-4 h-9 w-full')}>
          Voltar ao carrinho
        </Link>
      ) : (
        <Link
          to="/"
          hash="catalogo"
          className={cn(buttonVariants(), 'mt-4 h-9 w-full')}
        >
          Explorar mercado
        </Link>
      )}
    </div>
  )
}

export function OrderConfirmation({ order }: { order: Order }) {
  const confirmed = order.status === 'confirmed'
  const { summary } = order

  return (
    <article
      aria-labelledby="order-confirmation-title"
      className="relative mx-auto w-full max-w-md overflow-hidden border border-border bg-surface-card shadow-card"
    >
      <Link
        to="/"
        hash="catalogo"
        aria-label="Fechar confirmação"
        className="absolute top-2 right-2 z-10 inline-flex size-8 items-center justify-center rounded-sm text-primary transition-colors hover:bg-primary/10"
      >
        <X className="size-4" aria-hidden="true" />
      </Link>

      <header className="px-4 pt-5 pb-3 text-center md:px-6">
        {confirmed ? <ThankYouBadge className="mx-auto h-11 w-12" /> : null}
        <h1
          id="order-confirmation-title"
          data-testid="order-status"
          className="text-body-lg-bold mt-3 text-foreground"
        >
          {STATUS_HEADINGS[order.status]}
        </h1>
      </header>

      {confirmed ? (
        <>
          <dl className="grid grid-cols-2 gap-y-3 border-y-2 border-primary px-4 py-3 md:grid-cols-4 md:px-6">
            <MetaItem
              className="pr-3"
              label="ID da transação"
              value={shortTransactionId(order.transactionId)}
            />
            <MetaItem
              className="border-l border-primary pl-3 md:pr-3"
              label="Data"
              value={formatReceiptDate(order.createdAt)}
            />
            <MetaItem
              className="md:border-l md:border-primary md:pl-3 md:pr-3"
              label="Total"
              value={`${summary.total} ETH`}
            />
            <MetaItem
              className="border-l border-primary pl-3"
              label="Carteira"
              value={order.walletLabel}
            />
          </dl>

          <div className="px-4 pt-4 md:px-6">
            <h2 className="text-body-bold text-foreground">
              Detalhes da transação
            </h2>

            <OrderItems order={order} />

            <dl className="mt-3 flex flex-col gap-1.5">
              <div className="flex items-baseline justify-end gap-3">
                <dt className="text-caption text-text-secondary">
                  Taxa de rede
                </dt>
                <dd className="text-caption text-foreground">
                  {summary.networkFee} ETH
                </dd>
              </div>
              <div className="flex items-baseline justify-end gap-3">
                <dt className="text-body-bold text-foreground">Total</dt>
                <dd className="text-body-bold text-text-accent">
                  {summary.total} ETH
                </dd>
              </div>
            </dl>

            <p className="text-micro mt-4 text-center text-text-secondary">
              Transação confirmada na {order.networkLabel}. A propriedade foi
              transferida para sua carteira conectada e registrada na rede.
            </p>

            <a
              href={order.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants(), 'mx-auto mt-4 flex h-9 w-fit')}
            >
              {explorerActionLabel(order.network)}
              <span className="sr-only"> (abre em uma nova aba)</span>
            </a>
          </div>
        </>
      ) : (
        <StatusMessage order={order} />
      )}

      <div aria-hidden="true" className="mt-8 h-1 w-full bg-primary" />
    </article>
  )
}
