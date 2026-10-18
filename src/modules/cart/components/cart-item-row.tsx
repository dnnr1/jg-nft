import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'

import { QuantityStepper } from '@/components/common/quantity-stepper'
import { cn } from 'cn'
import type { CartItem } from '../types'
import { CART_COLUMNS } from './cart-items'

interface CartItemRowProps {
  item: CartItem
  onQuantityChange: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  quantityPending?: boolean
  removePending?: boolean
}

function ItemThumb({ item }: { item: CartItem }) {
  return (
    <Link
      to="/nfts/$id"
      params={{ id: item.nft.id }}
      search={{ qty: 1 }}
      tabIndex={-1}
      aria-hidden="true"
      className="shrink-0"
    >
      <img
        src={item.nft.image}
        alt=""
        width={144}
        height={144}
        loading="lazy"
        className="size-16 rounded-md bg-surface-raised object-cover"
      />
    </Link>
  )
}

function ItemName({ item }: { item: CartItem }) {
  const { nft } = item

  return (
    <div className="min-w-0">
      <Link
        to="/nfts/$id"
        params={{ id: nft.id }}
        search={{ qty: 1 }}
        className="text-body-bold block truncate text-foreground transition-colors hover:text-text-accent"
      >
        {nft.name}
      </Link>
      <p className="text-tiny text-text-secondary">
        ID do token: {nft.tokenId ?? '—'}
      </p>
    </div>
  )
}

function RemoveButton({
  item,
  onRemove,
  pending,
}: {
  item: CartItem
  onRemove: (id: string) => void
  pending?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={`Remover ${item.nft.name} do carrinho`}
      disabled={pending}
      onClick={() => onRemove(item.id)}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-sand transition-colors hover:bg-surface-raised hover:text-coral disabled:opacity-40 md:justify-self-start"
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </button>
  )
}

export function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
  quantityPending,
  removePending,
}: CartItemRowProps) {
  const { nft } = item
  const maxQty = Math.max(1, item.available)
  const blocked = !item.editable || item.available === 0

  return (
    <li className="list-none">
      {/* Mobile — cartão compacto, imagem colada às bordas */}
      <div
        className={cn(
          'flex overflow-hidden rounded-lg bg-surface-card md:hidden',
          quantityPending && 'opacity-70',
        )}
      >
        <Link
          to="/nfts/$id"
          params={{ id: nft.id }}
          search={{ qty: 1 }}
          tabIndex={-1}
          aria-hidden="true"
          className="shrink-0 self-stretch"
        >
          <img
            src={nft.image}
            alt=""
            width={144}
            height={144}
            loading="lazy"
            className="h-full w-20 bg-surface-raised object-cover"
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 items-center justify-between gap-2 p-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <Link
                to="/nfts/$id"
                params={{ id: nft.id }}
                search={{ qty: 1 }}
                className="text-body line-clamp-2 font-bold text-foreground transition-colors hover:text-text-accent"
              >
                {nft.name}
              </Link>
              <p className="text-caption whitespace-nowrap text-text-secondary">
                Edição: {nft.edition.current}/{nft.edition.total}
              </p>
              <strong className="text-body-lg-bold whitespace-nowrap text-text-accent">
                <span className="sr-only">Total da linha: </span>
                {item.lineTotal} ETH
              </strong>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {blocked ? (
                <>
                  <output
                    aria-label="Quantidade"
                    className="text-body-lg-medium w-5 text-center text-foreground"
                  >
                    {item.quantity}
                  </output>
                  <RemoveButton
                    item={item}
                    onRemove={onRemove}
                    pending={removePending}
                  />
                </>
              ) : (
                <QuantityStepper
                  variant="circle"
                  qty={item.quantity}
                  max={maxQty}
                  minQty={0}
                  decrementLabel={
                    item.quantity <= 1
                      ? `Remover ${nft.name} do carrinho`
                      : `Diminuir quantidade de ${nft.name}`
                  }
                  onChange={(quantity) => {
                    if (quantity < 1) onRemove(item.id)
                    else onQuantityChange(item.id, quantity)
                  }}
                />
              )}
            </div>
          </div>

          {blocked ? (
            <p className="text-tiny px-3 pb-3 text-coral" role="status">
              Edição indisponível — remova o item para continuar.
            </p>
          ) : null}
        </div>
      </div>

      {/* Desktop — cartão de linha */}
      <div
        className={cn(
          'hidden overflow-hidden rounded-l-md rounded-r-none bg-surface-card md:grid md:h-16 md:items-center',
          CART_COLUMNS,
          quantityPending && 'opacity-70',
        )}
      >
        <div className="flex min-w-0 items-center gap-[15px]">
          <ItemThumb item={item} />
          <ItemName item={item} />
        </div>

        <span className="text-body-regular text-text-secondary">
          <span className="sr-only">Preço por edição: </span>
          {nft.price} ETH
        </span>

        <QuantityStepper
          compact
          qty={item.quantity}
          max={maxQty}
          disabled={blocked}
          onChange={(quantity) => onQuantityChange(item.id, quantity)}
        />

        <strong className="text-body-bold text-text-accent">
          <span className="sr-only">Total da linha: </span>
          {item.lineTotal} ETH
        </strong>

        <RemoveButton item={item} onRemove={onRemove} pending={removePending} />
      </div>
    </li>
  )
}
