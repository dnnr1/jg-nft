import { useEffect, useRef } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import { rememberAfterLogin } from './after-login'
import { useAuth } from './auth-context'

type FallbackRoute = '/' | '/cart'

/**
 * Mantém uma rota acessível apenas com sessão ativa. Sem usuário, o visitante
 * volta para a origem do fluxo, e a intenção de retomada fica guardada para
 * devolvê-lo a esta mesma página depois de entrar.
 *
 * Quando a sessão é encerrada na própria tela (o "Sair" do menu ou do
 * cabeçalho), a saída acontece sem reabrir o diálogo de login.
 */
export function useRequireSession(fallbackTo: FallbackRoute = '/') {
  const { user, isReady, openAuthDialog } = useAuth()
  const navigate = useNavigate()
  const authenticatedRef = useRef(false)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  useEffect(() => {
    if (user) {
      authenticatedRef.current = true
      return
    }
    if (!isReady) return

    if (!authenticatedRef.current) {
      rememberAfterLogin(pathname)
      openAuthDialog('login')
    }
    void navigate({ to: fallbackTo, replace: true })
  }, [isReady, user, pathname, fallbackTo, openAuthDialog, navigate])

  return { user, isReady, isAllowed: isReady && user !== null }
}
