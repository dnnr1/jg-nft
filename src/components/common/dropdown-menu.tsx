import { useEffect, useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'

import { cn } from 'cn'

export interface DropdownMenuItem {
  label: string
  onSelect: () => void
  disabled?: boolean
}

interface DropdownMenuProps {
  /** Nome acessível do botão e do menu. */
  label: string
  items: DropdownMenuItem[]
  className?: string
}

/**
 * Menu de ações do cartão de carteira. Usa `<details>` nativo (abre com
 * Enter/Espaço e mantém o foco no gatilho) e fecha ao clicar fora ou com Esc.
 */
export function DropdownMenu({ label, items, className }: DropdownMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const close = () => {
      if (detailsRef.current) detailsRef.current.open = false
      setOpen(false)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!detailsRef.current?.contains(event.target as Node)) close()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      detailsRef.current
        ?.querySelector<HTMLElement>('summary')
        ?.focus()
      close()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <details
      ref={detailsRef}
      className={cn('relative shrink-0', className)}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        aria-label={label}
        className="flex size-8 cursor-pointer list-none items-center justify-center rounded-md text-sand transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"
      >
        <MoreVertical className="size-4" aria-hidden="true" />
      </summary>
      <ul
        role="menu"
        aria-label={label}
        className="absolute top-9 right-0 z-20 w-48 rounded-md border border-border bg-surface-raised py-1 shadow-card"
      >
        {items.map((item) => (
          <li key={item.label} role="none">
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (detailsRef.current) detailsRef.current.open = false
                setOpen(false)
                item.onSelect()
              }}
              className="text-tiny w-full px-3 py-2 text-left text-foreground transition-colors hover:bg-surface-card disabled:opacity-40"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}
