import type { ReactNode } from 'react'

import { cn } from 'cn'

export interface FieldMessageState {
  error?: string
  hint?: string
}

export function fieldErrorId(id: string): string {
  return `${id}-error`
}

export function fieldHintId(id: string): string {
  return `${id}-hint`
}

/** Id do texto auxiliar que descreve o controle (erro tem precedência). */
export function fieldDescribedBy(
  id: string,
  { error, hint }: FieldMessageState,
): string | undefined {
  if (error) return fieldErrorId(id)
  if (hint) return fieldHintId(id)
  return undefined
}

interface FieldProps extends FieldMessageState {
  /** Id do controle associado, usado em `htmlFor` e na mensagem. */
  id: string
  label: string
  required?: boolean
  className?: string
  children: ReactNode
}

/**
 * Rótulo + controle + mensagem de erro. Centraliza a semântica dos campos do
 * checkout: o asterisco é decorativo e o estado obrigatório é anunciado por
 * extenso para leitores de tela.
 */
export function Field({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-caption text-foreground">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="text-coral">
              {' *'}
            </span>
            <span className="sr-only"> (obrigatório)</span>
          </>
        ) : null}
      </label>

      {children}

      {error ? (
        <p id={fieldErrorId(id)} role="alert" className="text-tiny text-coral">
          {error}
        </p>
      ) : hint ? (
        <p id={fieldHintId(id)} className="text-tiny text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
