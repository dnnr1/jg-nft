import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useDialogBehavior } from '@/components/common/dialog-behavior'

interface LightboxProps {
  open: boolean
  onClose: () => void
  src: string
  alt: string
}

export function Lightbox({ open, onClose, src, alt }: LightboxProps) {
  const panelRef = useDialogBehavior({ open, onClose })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
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
        aria-label="Imagem ampliada"
        tabIndex={-1}
        className="absolute inset-0 grid place-items-center p-6 outline-none"
      >
        <figure className="relative">
          <img
            src={src}
            alt={alt}
            className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain"
          />
        </figure>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Fechar imagem ampliada"
          className="absolute top-4 right-4 border border-border bg-surface-raised"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
