import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/modules/auth/auth-context'

import { changePassword, updateProfile } from './api'
import { profileKeys } from './keys'
import type { PasswordChangeInput, ProfileUpdateInput } from './types'

/**
 * Salva o perfil e espelha o resultado no cache e na sessão: o nome de
 * exibição é o mesmo mostrado no cabeçalho.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { updateSession } = useAuth()

  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => updateProfile(input),
    onSuccess: ({ profile, user }) => {
      queryClient.setQueryData(profileKeys.detail(), profile)
      updateSession(user)
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: PasswordChangeInput) => changePassword(input),
  })
}
