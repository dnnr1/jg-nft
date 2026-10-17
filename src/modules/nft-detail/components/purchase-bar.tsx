import { ShoppingBag } from 'lucide-react'

import type { Nft } from '@/modules/catalog/types'
import { QuantityStepper } from './quantity-stepper'

interface PurchaseBarProps {
  nft: Nft
  qty: number
  onQtyChange: (qty: number) => void
}

export function PurchaseBar({ nft, qty, onQtyChange }: PurchaseBarProps) {
  const maxQty = Math.max(1, nft.available)
  const displayQty = Math.min(qty, maxQty)
  const blocked = nft.available === 0 || !nft.editable

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-4 rounded-t-[40px] bg-surface-card px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_0_20px_0_rgba(10,6,4,0.45)] md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-text-secondary">
            Qtd.
          </span>
          <QuantityStepper
            compact
            qty={displayQty}
            max={maxQty}
            disabled={blocked}
            onChange={onQtyChange}
          />
        </div>
        <span className="text-right text-xl leading-4 font-bold text-text-accent">
          {nft.price} ETH
        </span>
      </div>

      <div className="flex items-center justify-start gap-3">
        <button
          type="button"
          disabled={blocked}
          className="inline-flex h-15 w-49 items-center justify-start rounded-[40px] bg-[linear-gradient(93deg,#D28A4C_-3.96%,rgba(210,138,76,0.8)_121.97%)] px-11 text-base leading-5 font-bold text-ink disabled:opacity-40"
        >
          Comprar NFT
        </button>
        <button
          type="button"
          aria-label="Adicionar ao carrinho"
          className="inline-flex size-15 items-center justify-center rounded-full border border-border bg-surface-raised text-secondary"
        >
          <ShoppingBag className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
