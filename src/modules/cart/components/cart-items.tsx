import { cn } from 'cn'

import { CartItemRow } from './cart-item-row'
import type { CartItem } from '../types'

/**
 * Colunas compartilhadas entre o cabeçalho da tabela e as linhas (em cartões).
 * A largura fixa das colunas segue a referência; o nome absorve a sobra da
 * largura disponível. Sem gaps: as larguras somam a largura do cartão.
 */
export const CART_COLUMNS =
  'md:grid-cols-[minmax(0,1fr)_104px_112px_124px_36px] xl:grid-cols-[288px_128px_128px_138px_minmax(40px,1fr)]'

interface CartItemsProps {
  items: CartItem[]
  onQuantityChange: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  pendingQuantityId?: string
  pendingRemoveId?: string
}

export function CartItems({
  items,
  onQuantityChange,
  onRemove,
  pendingQuantityId,
  pendingRemoveId,
}: CartItemsProps) {
  return (
    <div>
      <div
        aria-hidden="true"
        className={cn(
          'text-body hidden border-b border-border pb-2 font-bold text-foreground md:grid',
          CART_COLUMNS,
        )}
      >
        <span>NFTs</span>
        <span>Preço</span>
        <span>Edições</span>
        <span>Total</span>
        <span />
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
            quantityPending={pendingQuantityId === item.id}
            removePending={pendingRemoveId === item.id}
          />
        ))}
      </ul>
    </div>
  )
}
