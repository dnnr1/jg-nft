import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  Download,
  Heart,
  LogOut,
  Percent,
  ShoppingCart,
  TriangleAlert,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { useAuth } from '@/modules/auth/auth-context'
import { cn } from 'cn'

interface AccountEntry {
  label: string
  icon: LucideIcon
  /** Destino da entrada. Sem rota, o item fica fora do escopo da entrega. */
  to?: '/profile' | '/wallets'
}

const ACCOUNT_ENTRIES: ReadonlyArray<AccountEntry> = [
  { label: 'Dados do perfil', icon: User, to: '/profile' },
  { label: 'Carteiras', icon: Wallet, to: '/wallets' },
  { label: 'Atividade', icon: ShoppingCart },
  { label: 'Lista de interesse', icon: Heart },
  { label: 'Ofertas', icon: Percent },
  { label: 'Arquivos baixados', icon: Download },
  { label: 'Suporte', icon: TriangleAlert },
]

const ITEM_CLASS =
  'relative flex shrink-0 items-center gap-3 rounded-sm px-3 py-2.5 whitespace-nowrap text-caption transition-colors'

/** Barra laranja que marca a seção atual na coluna do menu. */
function ActiveBar({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute inset-y-0 left-0 w-0.5 rounded-full bg-primary transition-opacity',
        active ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}

/**
 * Menu da área do colecionador, compartilhado pelas telas de perfil e
 * carteiras. Atividade, ofertas, downloads e suporte não fazem parte da
 * entrega, então aparecem desabilitados para não simular sucesso funcional.
 */
export function AccountSidebar({ className }: { className?: string }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    void navigate({ to: '/' })
  }

  return (
    <nav
      aria-label="Meu perfil"
      className={cn(
        'flex flex-nowrap items-center gap-1 overflow-x-auto pb-1 md:flex-col md:items-stretch md:gap-0.5 md:overflow-visible md:pb-0',
        className,
      )}
    >
      <h2 className="text-title mb-4 hidden text-foreground md:block">
        Meu perfil
      </h2>

      {ACCOUNT_ENTRIES.map((entry) => {
        const Icon = entry.icon

        if (!entry.to) {
          return (
            <button
              key={entry.label}
              type="button"
              disabled
              aria-disabled="true"
              title="Fora do escopo desta entrega"
              className={cn(ITEM_CLASS, 'text-text-secondary')}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {entry.label}
            </button>
          )
        }

        const active = pathname === entry.to

        return (
          <Link
            key={entry.label}
            to={entry.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              ITEM_CLASS,
              active
                ? 'text-primary'
                : 'text-foreground hover:text-text-accent',
            )}
          >
            <ActiveBar active={active} />
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {entry.label}
          </Link>
        )
      })}

      <div
        aria-hidden="true"
        className="mt-6 hidden border-t border-border pt-2 md:block"
      />

      <button
        type="button"
        onClick={handleLogout}
        className={cn(ITEM_CLASS, 'text-foreground hover:text-text-accent')}
      >
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        Sair
      </button>
    </nav>
  )
}
