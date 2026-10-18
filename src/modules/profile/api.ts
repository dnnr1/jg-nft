import { apiClient } from '@/lib/api'
import type { User } from '@/modules/auth/types'

import {
  passwordResponseSchema,
  profileResponseSchema,
  profileUpdateResponseSchema,
  type PasswordChangeInput,
  type Profile,
  type ProfileUpdateInput,
} from './types'

export async function fetchProfile(): Promise<Profile> {
  const response = await apiClient.get<unknown>('/profile')
  return profileResponseSchema.parse(response.data).profile
}

/** Envia o perfil e devolve os dados atualizados junto da sessão correspondente. */
export async function updateProfile(
  input: ProfileUpdateInput,
): Promise<{ profile: Profile; user: User }> {
  const response = await apiClient.patch<unknown>('/profile', input)
  return profileUpdateResponseSchema.parse(response.data)
}

export async function changePassword(input: PasswordChangeInput): Promise<void> {
  const response = await apiClient.post<unknown>('/profile/password', input)
  passwordResponseSchema.parse(response.data)
}
