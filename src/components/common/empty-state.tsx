import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-border p-8 text-center">
      <h2 className="text-h2 font-bold text-foreground">{title}</h2>
      <p className="text-body my-4 text-text-secondary">{description}</p>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  )
}
