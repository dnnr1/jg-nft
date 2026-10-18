import { formatEth, multiplyEth, parseEth } from '@/lib/eth'

import type { CartSummary, PricedLine } from './types'

/**
 * Taxa de rede simulada: 6/10000 (0,06%) do subtotal, arredondada em micro-ETH.
 * Fica isolada aqui para ser reutilizada tanto pela API simulada (MSW) quanto
 * pelas atualizações otimistas do cache — a cotação exibida é sempre a mesma.
 */
const NETWORK_FEE_NUMERATOR = 6
const NETWORK_FEE_DENOMINATOR = 10_000

/** Total de uma linha (preço unitário × edições) como string decimal. */
export function lineTotalOf(unitPrice: string, quantity: number): string {
  return formatEth(multiplyEth(parseEth(unitPrice), quantity), {
    maxDecimals: 2,
    minDecimals: 2,
  })
}

/** Subtotal, desconto, taxa de rede e total de um conjunto de linhas. */
export function computeCartSummary(
  lines: ReadonlyArray<PricedLine>,
  percentOff = 0,
): CartSummary {
  const editions = lines.reduce((sum, line) => sum + line.quantity, 0)
  const subtotalUnits = lines.reduce(
    (sum, line) => sum + multiplyEth(parseEth(line.unitPrice), line.quantity),
    0,
  )
  const discountUnits = Math.round((subtotalUnits * percentOff) / 100)
  const networkFeeUnits = Math.round(
    (subtotalUnits * NETWORK_FEE_NUMERATOR) / NETWORK_FEE_DENOMINATOR,
  )
  const totalUnits = subtotalUnits - discountUnits + networkFeeUnits

  return {
    editions,
    subtotal: formatEth(subtotalUnits, { maxDecimals: 2, minDecimals: 2 }),
    discount: formatEth(discountUnits, { maxDecimals: 3, minDecimals: 2 }),
    networkFee: formatEth(networkFeeUnits, { maxDecimals: 3, minDecimals: 3 }),
    total: formatEth(totalUnits, { maxDecimals: 3, minDecimals: 2 }),
  }
}
