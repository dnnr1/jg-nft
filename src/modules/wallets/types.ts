import { z } from 'zod'

import {
  CATALOG_NETWORKS,
  type CatalogNetwork,
} from '@/modules/catalog/search-params'

export const walletSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Endereço 0x completo. */
  address: z.string(),
  /** Nome ENS, quando a carteira possui um. */
  ens: z.string().optional(),
  network: z.enum(CATALOG_NETWORKS),
  primary: z.boolean(),
  connected: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const walletsResponseSchema = z.object({
  items: z.array(walletSchema),
})

export type Wallet = z.infer<typeof walletSchema>
export type WalletsResponse = z.infer<typeof walletsResponseSchema>

/** Como a rede aparece nos cartões de carteira do checkout. */
export const WALLET_NETWORK_LABELS: Record<CatalogNetwork, string> = {
  ethereum: 'Rede principal Ethereum',
  polygon: 'Rede Polygon',
  solana: 'Rede Solana',
}

/** Identificação curta da carteira: ENS quando existir, senão 0x1234..ABCD. */
export function walletDisplayAddress(wallet: Wallet): string {
  if (wallet.ens) return wallet.ens
  return shortenAddress(wallet.address)
}

export function shortenAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}..${address.slice(-4)}`
}
