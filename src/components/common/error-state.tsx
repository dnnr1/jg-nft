import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title: string
  description?: string
  actionLabel?: string
  onRetry: () => void
}

export function ErrorState({
  title,
  description,
  actionLabel = 'Tentar novamente',
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="p-8 text-center">
      <h2 className="text-h2 font-bold text-foreground">{title}</h2>
      {description ? (
        <p className="text-body my-4 text-text-secondary">{description}</p>
      ) : null}
      <Button onClick={onRetry}>{actionLabel}</Button>
    </div>
  )
}
