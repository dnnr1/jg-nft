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
  const notifiedRef = useRef(false)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  useEffect(() => {
    if (user) {
      authenticatedRef.current = true
      return
    }
    if (!isReady) return

    // A saída acontece uma única vez por visita à rota. Sem esta trava, a
    // navegação para a origem do fluxo reexecuta o efeito (o componente segue
    // montado por um instante) e a intenção de retomada seria sobrescrita pela
    // rota de origem — `/checkout` viraria `/cart` e o login devolveria o
    // visitante ao carrinho.
    if (notifiedRef.current) return
    notifiedRef.current = true

    if (!authenticatedRef.current) {
      rememberAfterLogin(pathname)
      openAuthDialog('login')
    }
    void navigate({ to: fallbackTo, replace: true })
  }, [isReady, user, pathname, fallbackTo, openAuthDialog, navigate])

  return { user, isReady, isAllowed: isReady && user !== null }
}
