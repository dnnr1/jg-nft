import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function pick<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length]
  if (item === undefined) {
    throw new Error(`Acesso inválido: array de comprimento ${items.length}`)
  }
  return item
}
