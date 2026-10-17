import { Minus, Plus } from 'lucide-react'

import { cn } from 'cn'

interface QuantityStepperProps {
  qty: number
  max: number
  disabled?: boolean
  onChange: (qty: number) => void
  compact?: boolean
}

export function QuantityStepper({
  qty,
  max,
  disabled,
  onChange,
  compact,
}: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label="Selecionar quantidade"
      className={cn('flex items-center', compact ? 'gap-2' : 'gap-3')}
    >
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={disabled || qty <= 1}
        onClick={() => onChange(qty - 1)}
        className={cn(
          'flex items-center justify-center rounded-[20px] bg-primary text-ink disabled:opacity-40',
          compact ? 'h-7.5 w-5 border border-ink' : 'h-12.5 w-8.25',
        )}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output
        aria-label="Quantidade"
        className={cn(
          'text-center text-foreground',
          compact ? 'w-5 text-lg font-medium' : 'w-8 text-xl font-normal',
        )}
      >
        {qty}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={disabled || qty >= max}
        onClick={() => onChange(qty + 1)}
        className={cn(
          'flex items-center justify-center rounded-[20px] bg-primary text-ink disabled:opacity-40',
          compact ? 'h-7.5 w-5 border border-ink' : 'h-12.5 w-8.25',
        )}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
