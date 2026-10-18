/**
 * Assinatura da cotação do carrinho.
 *
 * Reúne apenas o que muda o valor ou a viabilidade de uma compra: identidade,
 * quantidade, preço unitário, disponibilidade e o cupom efetivo. É usada tanto
 * pela API simulada (para emitir o `etag` do carrinho) quanto pelo cliente (para
 * recalcular o `etag` quando um evento de tempo real atualiza o carrinho em
 * cache). As duas vias precisam produzir exatamente a mesma string.
 */
export interface QuoteLine {
  id: string
  quantity: number
  unitPrice: string
  available: number
}

export function quoteSignatureOf(
  lines: ReadonlyArray<QuoteLine>,
  couponCode: string | null,
): string {
  const canonical = [...lines]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (line) =>
        `${line.id}:${line.quantity}:${line.unitPrice}:${line.available}`,
    )
    .join('|')

  return `${canonical}#${couponCode ?? ''}`
}

/** ETag forte e curto (FNV-1a) da cotação, enviado em `If-Match` ao confirmar. */
export function quoteEtagOf(
  lines: ReadonlyArray<QuoteLine>,
  couponCode: string | null,
): string {
  const input = quoteSignatureOf(lines, couponCode)
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `"quote-${(hash >>> 0).toString(16).padStart(8, '0')}"`
}

/** Código do erro devolvido quando a cotação revisada não é mais a atual. */
export const QUOTE_CHANGED_CODE = 'QUOTE_CHANGED'
