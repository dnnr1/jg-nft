import { apiClient } from '@/lib/api'

import { walletsResponseSchema, type WalletsResponse } from './types'

export interface WalletPatch {
  primary?: boolean
  connected?: boolean
}

export async function fetchWallets(): Promise<WalletsResponse> {
  const response = await apiClient.get<WalletsResponse>('/wallets')
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
