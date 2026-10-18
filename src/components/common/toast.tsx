import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Check, X } from 'lucide-react'

const TOAST_DURATION_MS = 4500

interface ToastItem {
  id: number
  message: string
}

interface ToastContextValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextIdRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string) => {
      nextIdRef.current += 1
      const id = nextIdRef.current
      setToasts((current) => [...current, { id, message }])
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-[calc(104px+env(safe-area-inset-bottom,0px))] z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 md:right-6 md:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex animate-in slide-in-from-bottom-4 fade-in items-start gap-3 rounded-md border border-primary/50 bg-surface-card p-4 shadow-card duration-200"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-5 shrink-0 place-content-center rounded-full bg-success"
            >
              <Check className="size-3 text-elevated-light" />
            </span>
            <p className="flex-1 text-body-sm text-foreground">
              {toast.message}
            </p>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => dismiss(toast.id)}
              className="text-text-secondary transition-colors hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider')
  }
  return context
}
