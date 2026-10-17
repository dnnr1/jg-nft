import type { ReactNode } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useDialogBehavior } from '@/components/common/dialog-behavior'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}

export function Drawer({ open, onClose, title, description, children }: DrawerProps) {
  const panelRef = useDialogBehavior({ open, onClose })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/80 outline-none"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm animate-in slide-in-from-right fade-in flex-col overflow-y-auto bg-background shadow-2xl outline-none duration-200"
      >
        <div className="flex flex-col gap-1.5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-foreground">{title}</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  )
}
