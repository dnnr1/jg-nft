import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'

import { cn } from 'cn'

export type ToastTone = 'success' | 'error' | 'pending'

interface ToastProps {
  message: string
  tone?: ToastTone
  onClose: () => void
  duration?: number
}

const TONE_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  pending: Loader2,
} as const

export function Toast({
  message,
  tone = 'success',
  onClose,
  duration = 4000,
}: ToastProps) {
  const Icon = TONE_ICONS[tone]
  const autoDismiss = tone !== 'pending' && duration > 0

  useEffect(() => {
    if (!autoDismiss) return
    const timer = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(timer)
  }, [autoDismiss, duration, onClose])

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn(
        'animate-in fade-in slide-in-from-bottom-2 fixed inset-x-4 bottom-[calc(10rem+env(safe-area-inset-bottom,0px))] z-50 flex items-start gap-3 rounded-lg border bg-surface-card px-4 py-3 shadow-card duration-200 md:inset-x-auto md:right-6 md:bottom-6 md:w-[360px]',
        tone === 'error' ? 'border-coral/60' : 'border-border',
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'mt-0.5 size-4 shrink-0',
          tone === 'success' && 'text-success',
          tone === 'error' && 'text-coral',
          tone === 'pending' && 'animate-spin text-primary',
        )}
      />
      <p className="text-tiny flex-1 text-foreground">{message}</p>
      <button
        type="button"
        aria-label="Fechar notificação"
        onClick={onClose}
        className="-mt-1 -mr-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-sand transition-colors hover:bg-surface-raised hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
