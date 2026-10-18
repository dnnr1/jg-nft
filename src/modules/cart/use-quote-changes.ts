import { useCallback, useEffect, useRef, useState } from 'react'

import type { Cart } from './types'

export type QuoteChangeKind = 'price' | 'availability'

export interface QuoteChange {
  id: string
  name: string
  kind: QuoteChangeKind
  /** Valor exibido antes da mudança. */
  from: string
  /** Valor exibido depois da mudança. */
  to: string
}

interface LineSnapshot {
  name: string
  unitPrice: string
  available: number
}

function snapshotOf(cart: Cart | undefined): Map<string, LineSnapshot> {
  const snapshot = new Map<string, LineSnapshot>()
  for (const item of cart?.items ?? []) {
    snapshot.set(item.id, {
      name: item.nft.name,
      unitPrice: item.unitPrice,
      available: item.available,
    })
  }
  return snapshot
}

/**
 * Acompanha o carrinho em cache e descreve as mudanças de preço e de
 * disponibilidade recebidas depois da última revisão do usuário.
 *
 * Serve às telas de carrinho e pagamento: a alteração nunca é aplicada em
 * silêncio — o resumo mostra os novos valores e a lista abaixo diz exatamente o
 * que mudou, para que a compra seja confirmada de novo (a API também recusa a
 * cotação antiga com `QUOTE_CHANGED`).
 */
export function useQuoteChanges(cart: Cart | undefined) {
  const [changes, setChanges] = useState<QuoteChange[]>([])
  const knownRef = useRef<Map<string, LineSnapshot> | null>(null)

  useEffect(() => {
    const next = snapshotOf(cart)
    const previous = knownRef.current
    knownRef.current = next

    // Primeira leitura é a linha de base: nada mudou ainda.
    if (previous === null) return

    const detected: QuoteChange[] = []
    for (const [id, line] of next) {
      const before = previous.get(id)
      if (!before) continue

      if (before.unitPrice !== line.unitPrice) {
        detected.push({
          id,
          name: line.name,
          kind: 'price',
          from: before.unitPrice,
          to: line.unitPrice,
        })
      }
      if (before.available !== line.available) {
        detected.push({
          id,
          name: line.name,
          kind: 'availability',
          from: String(before.available),
          to: String(line.available),
        })
      }
    }

    if (detected.length > 0) setChanges(detected)
  }, [cart])

  const acknowledge = useCallback(() => setChanges([]), [])

  return { changes, acknowledge }
}
