import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { useRouter } from '@tanstack/react-router'

import { loginWithPassword, registerAccount } from './api'
import { consumeAfterLoginPath } from './after-login'
import { persistStoredUser, readStoredUser } from './session'
import type { LoginInput, SignupInput, User } from './types'

export type AuthMode = 'login' | 'signup'

interface AuthContextValue {
  user: User | null
  /** `false` até a sessão ser lida do armazenamento (evita guardas precipitadas). */
  isReady: boolean
  dialogOpen: boolean
  dialogMode: AuthMode
  openAuthDialog: (mode?: AuthMode) => void
  closeAuthDialog: () => void
  setDialogMode: (mode: AuthMode) => void
  login: (input: LoginInput) => Promise<User>
  signup: (input: SignupInput) => Promise<User>
  /** Atualiza a sessão em memória e no armazenamento (ex.: perfil salvo). */
  updateSession: (session: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<AuthMode>('login')
  const router = useRouter()

  useEffect(() => {
    setUser(readStoredUser())
    setIsReady(true)
  }, [])

  // Retoma o fluxo interrompido pela exigência de sessão assim que ela existe.
  useEffect(() => {
    if (!user) return
    const target = consumeAfterLoginPath()
    if (!target || target === router.state.location.pathname) return
    router.history.push(target)
  }, [user, router])

  const persistSession = useCallback((session: User | null) => {
    persistStoredUser(session)
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

  const updateSession = useCallback(
    (session: User) => {
      setUser(session)
      persistSession(session)
    },
    [persistSession],
  )

  const value = useMemo(
    () => ({
      user,
      isReady,
      dialogOpen,
      dialogMode,
      openAuthDialog,
      closeAuthDialog,
      setDialogMode,
      login,
      signup,
      updateSession,
      logout,
    }),
    [
      user,
      isReady,
      dialogOpen,
      dialogMode,
      openAuthDialog,
      closeAuthDialog,
      login,
      signup,
      updateSession,
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
