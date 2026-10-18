import type { User } from './types'

export const SESSION_STORAGE_KEY = 'kurio.session'

/** Lê a sessão persistida, tolerando armazenamento indisponível. */
export function readStoredUser(): User | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function persistStoredUser(user: User | null): void {
  try {
    if (user) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  } catch {
    // Armazenamento indisponível: a sessão permanece apenas em memória.
  }
}

/**
 * Token da sessão simulada: o identificador do usuário. O cliente envia esse
 * valor em `Authorization` e os mocks o usam para reconhecer quem está
 * autenticado — em uma API real o mesmo interceptor enviaria o JWT.
 */
export function readSessionToken(): string | null {
  return readStoredUser()?.id ?? null
}
