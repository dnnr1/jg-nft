import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { loginWithPassword, registerAccount } from './api'
import type { LoginInput, SignupInput, User } from './types'

const SESSION_STORAGE_KEY = 'kurio.session'

export type AuthMode = 'login' | 'signup'

interface AuthContextValue {
  user: User | null
  dialogOpen: boolean
  dialogMode: AuthMode
  openAuthDialog: (mode?: AuthMode) => void
  closeAuthDialog: () => void
  setDialogMode: (mode: AuthMode) => void
  login: (input: LoginInput) => Promise<User>
  signup: (input: SignupInput) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): User | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<AuthMode>('login')

  useEffect(() => {
    setUser(readStoredUser())
  }, [])

  const persistSession = useCallback((session: User | null) => {
    try {
      if (session) {
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      } else {
        window.localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    } catch {
      // Armazenamento indisponível: a sessão permanece apenas em memória.
    }
  }, [])

  const openAuthDialog = useCallback((mode: AuthMode = 'login') => {
    setDialogMode(mode)
    setDialogOpen(true)
  }, [])

  const closeAuthDialog = useCallback(() => setDialogOpen(false), [])

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await loginWithPassword(input)
      setUser(session)
      persistSession(session)
      return session
    },
    [persistSession],
  )

  const signup = useCallback(
    async (input: SignupInput) => {
      const session = await registerAccount(input)
      setUser(session)
      persistSession(session)
      return session
    },
    [persistSession],
  )

  const logout = useCallback(() => {
    setUser(null)
    persistSession(null)
  }, [persistSession])

  const value = useMemo(
    () => ({
      user,
      dialogOpen,
      dialogMode,
      openAuthDialog,
      closeAuthDialog,
      setDialogMode,
      login,
      signup,
      logout,
    }),
    [
      user,
      dialogOpen,
      dialogMode,
      openAuthDialog,
      closeAuthDialog,
      login,
      signup,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
