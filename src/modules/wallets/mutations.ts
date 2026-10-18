import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateWallet, type WalletPatch } from './api'
import { walletsKeys } from './keys'
import type { WalletsResponse } from './types'

/** Conecta ou define como principal, com escrita direta do resultado no cache. */
export function useUpdateWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: WalletPatch }) =>
      updateWallet(id, patch),
    onSuccess: (data: WalletsResponse) => {
      queryClient.setQueryData(walletsKeys.list(), data)
    },
  })
}
