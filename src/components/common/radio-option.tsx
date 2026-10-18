import type { ReactNode } from 'react'

import { cn } from 'cn'

/** Círculo de seleção usado nos cartões e opções de rádio do checkout. */
export function RadioCircle({
  checked,
  className,
}: {
  checked: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'size-4 shrink-0 rounded-full transition-[border-color,border-width]',
        checked ? 'border-[3px] border-primary' : 'border border-border-soft',
        className,
      )}
    />
  )
}

interface RadioOptionProps {
  id: string
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  /** `outline`: linha com borda (desktop). `surface`: cartão (mobile). */
  tone?: 'outline' | 'surface'
  /** Posição do círculo de seleção. */
  inputPosition?: 'start' | 'end'
  className?: string
  children: ReactNode
}

export function RadioOption({
  id,
  name,
  value,
  checked,
  onChange,
  tone = 'outline',
  inputPosition = 'start',
  className,
  children,
}: RadioOptionProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center gap-4 rounded-[10px] transition-colors',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ink',
        tone === 'outline'
          ? cn(
              'h-11 border px-4',
              checked
                ? 'border-primary'
                : 'border-border hover:border-border-soft',
            )
          : cn(
              'bg-surface-card px-4 py-3.5 hover:bg-surface-raised',
              checked && 'bg-surface-raised',
            ),
        className,
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      {inputPosition === 'start' ? <RadioCircle checked={checked} /> : null}
      <span className="min-w-0 flex-1">{children}</span>
      {inputPosition === 'end' ? <RadioCircle checked={checked} /> : null}
    </label>
  )
}
