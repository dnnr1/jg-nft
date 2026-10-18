/**
 * Aritmética de valores em ETH.
 *
 * Os preços trafegam como strings decimais (`"1.39"`). Para evitar erros de
 * ponto flutuante nos cálculos apresentados ao colecionador, os valores são
 * convertidos para inteiros numa escala de 1e6 (micro-ETH) antes de somar,
 * multiplicar ou arredondar.
 */

const SCALE = 1_000_000
const SCALE_DIGITS = 6

export interface FormatEthOptions {
  /** Casas decimais máximas exibidas (as casas finais zeradas são removidas). */
  maxDecimals?: number
  /** Casas decimais mínimas exibidas (zero é preenchido à direita). */
  minDecimals?: number
}

/** Converte uma string decimal de ETH em micro-ETH (inteiro). */
export function parseEth(value: string): number {
  const normalized = value.trim().replace(',', '.')
  const match = /^(\d+)(?:\.(\d+))?$/.exec(normalized)
  if (!match) {
    throw new Error(`Valor em ETH inválido: "${value}"`)
  }
  const whole = Number(match[1])
  const fraction = (match[2] ?? '').padEnd(SCALE_DIGITS, '0').slice(0, SCALE_DIGITS)
  return whole * SCALE + Number(fraction)
}

/** Formata micro-ETH de volta para string decimal, arredondando com clareza. */
export function formatEth(
  units: number,
  { maxDecimals = 2, minDecimals = 0 }: FormatEthOptions = {},
): string {
  const step = 10 ** (SCALE_DIGITS - maxDecimals)
  const rounded = Math.round(units / step) * step
  const whole = Math.trunc(rounded / SCALE)
  const remainder = Math.abs(rounded - whole * SCALE)
  const fraction = String(remainder).padStart(SCALE_DIGITS, '0').slice(0, maxDecimals)
  const trimmed = fraction.replace(/0+$/, '').padEnd(minDecimals, '0')
  return trimmed ? `${whole}.${trimmed}` : String(whole)
}

/** Multiplica micro-ETH por um fator inteiro (ex.: quantidade de edições). */
export function multiplyEth(units: number, factor: number): number {
  return Math.round(units * factor)
}
