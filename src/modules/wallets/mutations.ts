import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createWallet,
  updateWallet,
  type WalletPatch,
} from './api'
import { walletsKeys } from './keys'
import type { WalletInput, WalletsResponse } from './types'

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

/** Cadastra a carteira e devolve a lista já reordenada pelo servidor simulado. */
export function useCreateWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: WalletInput) => createWallet(input),
    onSuccess: (data: WalletsResponse) => {
      queryClient.setQueryData(walletsKeys.list(), data)
    },
  })
}
