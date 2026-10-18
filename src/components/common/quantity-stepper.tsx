import { Minus, Plus } from 'lucide-react'

import { cn } from 'cn'

interface QuantityStepperProps {
  qty: number
  max: number
  disabled?: boolean
  onChange: (qty: number) => void
  compact?: boolean
  /** Círculos de 30px, com o botão de diminuir em tom secundário. */
  variant?: 'default' | 'circle'
  /** Menor quantidade permitida. Use 0 quando o pai trata a remoção. */
  minQty?: number
  decrementLabel?: string
}

export function QuantityStepper({
  qty,
  max,
  disabled,
  onChange,
  compact,
  variant = 'default',
  minQty = 1,
  decrementLabel = 'Diminuir quantidade',
}: QuantityStepperProps) {
  const circle = variant === 'circle'
  const controlClass = cn(
    'flex items-center justify-center disabled:opacity-40',
    circle
      ? 'size-7.5 rounded-full'
      : cn('rounded-[20px]', compact ? 'h-7.5 w-5 border border-ink' : 'h-12.5 w-8.25'),
  )

  return (
    <div
      role="group"
      aria-label="Selecionar quantidade"
      className={cn(
        'flex items-center',
        circle || compact ? 'gap-2' : 'gap-3',
      )}
    >
      <button
        type="button"
        aria-label={decrementLabel}
        disabled={disabled || qty <= minQty}
        onClick={() => onChange(qty - 1)}
        className={cn(
          controlClass,
          circle ? 'bg-surface-raised text-sand' : 'bg-primary text-ink',
        )}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output
        aria-label="Quantidade"
        className={cn(
          'text-center whitespace-nowrap text-foreground',
          circle
            ? 'w-5 text-body-lg-medium'
            : compact
              ? 'w-5 text-lg font-medium'
              : 'w-8 text-xl font-normal',
        )}
      >
        {qty}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={disabled || qty >= max}
        onClick={() => onChange(qty + 1)}
        className={cn(controlClass, 'bg-primary text-ink')}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
