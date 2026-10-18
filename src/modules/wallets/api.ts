import { apiClient } from '@/lib/api'

import {
  walletsResponseSchema,
  type WalletInput,
  type WalletsResponse,
} from './types'

export interface WalletPatch
  extends Partial<WalletInput> {
  primary?: boolean
  connected?: boolean
}

export async function fetchWallets(): Promise<WalletsResponse> {
  const response = await apiClient.get<WalletsResponse>('/wallets')
  return walletsResponseSchema.parse(response.data)
}

export async function createWallet(
  input: WalletInput,
): Promise<WalletsResponse> {
  const response = await apiClient.post<WalletsResponse>('/wallets', input)
  return walletsResponseSchema.parse(response.data)
}

export async function updateWallet(
  id: string,
  patch: WalletPatch,
): Promise<WalletsResponse> {
  const response = await apiClient.patch<WalletsResponse>(
    `/wallets/${encodeURIComponent(id)}`,
    patch,
  )
  return walletsResponseSchema.parse(response.data)
}
