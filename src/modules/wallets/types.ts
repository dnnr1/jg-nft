import { z } from 'zod'

import {
  CATALOG_NETWORKS,
  type CatalogNetwork,
} from '@/modules/catalog/search-params'

/** Tipos de carteira oferecidos no cadastro. */
export const WALLET_TYPES = ['principal', 'secundaria', 'reserva'] as const

export type WalletType = (typeof WALLET_TYPES)[number]

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  principal: 'Principal',
  secundaria: 'Secundária',
  reserva: 'Reserva',
}

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
  /** Dados do cadastro de carteira (tela Carteiras). */
  type: z.enum(WALLET_TYPES).optional(),
  displayName: z.string().optional(),
  profileName: z.string().optional(),
  secondaryWallet: z.string().optional(),
  referralCode: z.string().optional(),
  email: z.string().optional(),
  ensName: z.string().optional(),
  ensDomain: z.string().optional(),
})

export const walletsResponseSchema = z.object({
  items: z.array(walletSchema),
})

export type Wallet = z.infer<typeof walletSchema>
export type WalletsResponse = z.infer<typeof walletsResponseSchema>

/** Dados aceitos no cadastro e na edição de uma carteira. */
export interface WalletInput {
  label: string
  address: string
  network: CatalogNetwork
  type: WalletType
  displayName: string
  profileName: string
  secondaryWallet: string
  referralCode: string
  email: string
  ensName: string
  ensDomain: string
}

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
