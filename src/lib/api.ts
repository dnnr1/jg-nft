import axios from 'axios'
import { z } from 'zod'

import { readSessionToken } from '@/modules/auth/session'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
})

/**
 * Anexa o token da sessão simulada. Os recursos que exigem autenticação
 * (perfil e senha) respondem 401 sem ele, o que permite exercitar sessão
 * expirada e acesso não autorizado.
 */
apiClient.interceptors.request.use((config) => {
  const token = readSessionToken()
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    /** Campo do formulário apontado pelo erro, quando houver. */
    field: z.string().optional(),
  }),
})

/** Extrai a mensagem do envelope de erro da API, com fallback amigável. */
export function apiErrorMessage(
  error: unknown,
  fallback = 'Não foi possível concluir a operação. Tente novamente.',
): string {
  if (axios.isAxiosError(error)) {
    const parsed = apiErrorSchema.safeParse(error.response?.data)
    if (parsed.success) return parsed.data.error.message
  }
  return fallback
}

/** Status HTTP do erro da API, quando a falha veio de uma resposta. */
export function apiErrorStatus(error: unknown): number | null {
  return axios.isAxiosError(error) ? (error.response?.status ?? null) : null
}

/** Código do envelope de erro da API (ex.: `EMAIL_IN_USE`). */
export function apiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null
  const parsed = apiErrorSchema.safeParse(error.response?.data)
  return parsed.success ? parsed.data.error.code : null
}

/** Campo do formulário apontado pelo erro, quando a API informa. */
export function apiErrorField(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null
  const parsed = apiErrorSchema.safeParse(error.response?.data)
  return parsed.success ? (parsed.data.error.field ?? null) : null
}
