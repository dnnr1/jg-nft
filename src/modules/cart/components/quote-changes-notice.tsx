import { cn } from 'cn'

import type { QuoteChange } from '../use-quote-changes'

interface QuoteChangesNoticeProps {
  changes: QuoteChange[]
  /** Quando informado, exibe o botão para dispensar o aviso. */
  onAcknowledge?: () => void
  className?: string
}

function describe(change: QuoteChange): string {
  return change.kind === 'price'
    ? `O preço de ${change.name} passou de ${change.from} para ${change.to} ETH.`
    : `A disponibilidade de ${change.name} passou de ${change.from} para ${change.to} edições.`
}

/**
 * Aviso acessível das mudanças de cotação recebidas em tempo real.
 *
 * É um `role="status"` para que leitores de tela anunciem a alteração sem
 * interromper o restante da leitura.
 */
export function QuoteChangesNotice({
  changes,
  onAcknowledge,
  className,
}: QuoteChangesNoticeProps) {
  if (changes.length === 0) return null

  return (
    <div
      role="status"
      data-testid="quote-changes-notice"
      className={cn(
        'rounded-md border border-primary/40 bg-primary/10 px-4 py-3',
        className,
      )}
    >
      <p className="text-body-sm font-medium text-foreground">
        A cotação do carrinho mudou enquanto esta tela estava aberta.
      </p>
      <ul className="mt-1 list-disc pl-5 text-tiny text-text-secondary">
        {changes.map((change) => (
          <li key={`${change.id}-${change.kind}`}>{describe(change)}</li>
        ))}
      </ul>
      <p className="mt-1 text-tiny text-text-secondary">
        O resumo abaixo já mostra os novos valores. Revise o total e confirme a
        compra novamente.
      </p>
      {onAcknowledge ? (
        <button
          type="button"
          onClick={onAcknowledge}
          className="text-tiny mt-2 rounded border border-border bg-surface-raised px-3 py-1 transition-colors hover:border-primary"
        >
          Entendi
        </button>
      ) : null}
    </div>
  )
}
