import type { CatalogNetwork } from '@/modules/catalog/search-params'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** Data do recibo no formato do layout: "29 Jul, 2026". Determinística (UTC). */
export function formatReceiptDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = MONTHS[date.getUTCMonth()] ?? ''
  return `${day} ${month}, ${date.getUTCFullYear()}`
}

/** Hash da transação abreviado: "0xA91F...E82C". */
export function shortTransactionId(transactionId: string): string {
  if (transactionId.length <= 12) return transactionId
  return `${transactionId.slice(0, 6)}...${transactionId.slice(-4)}`
}

/** Nome do explorador de blocos de cada rede. */
export const EXPLORER_LABELS: Record<CatalogNetwork, string> = {
  ethereum: 'Etherscan',
  polygon: 'Polygonscan',
  solana: 'Solscan',
}

/** Rótulo do botão do explorador: "Ver no Etherscan". */
export function explorerActionLabel(network: CatalogNetwork): string {
  return `Ver no ${EXPLORER_LABELS[network]}`
}
