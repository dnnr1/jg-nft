import axios from 'axios'

import { apiClient } from '@/lib/api'

import {
  authResponseSchema,
  type LoginInput,
  type SignupInput,
  type User,
} from './types'

function toRequestError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { message?: unknown } }
      | undefined
    const message = data?.error?.message
    if (typeof message === 'string' && message.length > 0) {
      return new Error(message)
    }
  }
  return new Error(fallback)
}

export async function loginWithPassword(input: LoginInput): Promise<User> {
  try {
    const response = await apiClient.post<unknown>('/auth/login', {
      email: input.email,
      password: input.password,
    })
    return authResponseSchema.parse(response.data).user
  } catch (error) {
    throw toRequestError(error, 'Não foi possível entrar. Tente novamente.')
  }
}

export async function registerAccount(input: SignupInput): Promise<User> {
  try {
    const response = await apiClient.post<unknown>('/auth/register', {
      name: input.name,
      email: input.email,
      password: input.password,
    })
    return authResponseSchema.parse(response.data).user
  } catch (error) {
    throw toRequestError(
      error,
      'Não foi possível criar a conta. Tente novamente.',
    )
  }
}
