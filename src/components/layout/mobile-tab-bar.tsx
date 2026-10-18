import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart, ScanLine, ShoppingCart, UserRound } from 'lucide-react'

import { useAuth } from '@/modules/auth/auth-context'

export function MobileTabBar() {
  const navigate = useNavigate()
  const onHome = useRouterState({
    select: (state) => state.location.pathname === '/',
  })
  const { user, openAuthDialog } = useAuth()

  function goToProfileOrAuth() {
    if (user) {
      void navigate({ to: '/profile' })
    } else {
      openAuthDialog('login')
    }
  }

  return (
    <nav aria-label="Navegação mobile" className="dock md:hidden">
      <svg
        className="dock-notch"
        viewBox="0 0 390 90"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M0 90V28Q0 0 28 0H135C155 0 152 46 195 46S235 0 255 0H362Q390 0 390 28V90Z" />
      </svg>
      <div className="dock-items">
        <Link
          to="/"
          aria-label="Início"
          aria-current={onHome ? 'page' : undefined}
          className="dock-item"
        >
          <span className="dock-home-icon" aria-hidden="true" />
        </Link>
        <button
          type="button"
          aria-label="Favoritos"
          className="dock-item"
          onClick={goToProfileOrAuth}
        >
          <Heart aria-hidden="true" fill="currentColor" />
        </button>
        <Link to="/wallets" aria-label="Carteiras" className="dock-fab">
          <ScanLine aria-hidden="true" />
        </Link>
        <Link to="/cart" aria-label="Carrinho" className="dock-item">
          <ShoppingCart aria-hidden="true" fill="currentColor" />
        </Link>
        <button
          type="button"
          aria-label="Perfil"
          className="dock-item"
          onClick={goToProfileOrAuth}
        >
          <UserRound aria-hidden="true" fill="currentColor" />
        </button>
      </div>
    </nav>
  )
}
