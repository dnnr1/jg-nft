import { useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Search } from 'lucide-react'

import { CartFilledIcon, SignInIcon } from '@/components/icons'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from 'cn'
import {
  resolveCatalogSearch,
  toUrlSearch,
  type CatalogUrlSearch,
} from '@/modules/catalog/search-params'
import { useCartCount } from '@/modules/cart/use-cart-count'

interface NavEntry {
  label: string
  hash?: string
}

const NAV_ENTRIES: ReadonlyArray<NavEntry> = [
  { label: 'Início' },
  { label: 'Mercado', hash: 'catalogo' },
  { label: 'Criadores', hash: 'criadores' },
  { label: 'Aprenda', hash: 'diario' },
]

function NavAnchor({
  entry,
  active,
}: {
  entry: NavEntry
  active: boolean
}) {
  return (
    <Link
      to="/"
      hash={entry.hash}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative inline-flex pb-5 text-body-lg-bold transition-colors',
        active ? 'text-primary' : 'text-foreground hover:text-text-accent',
      )}
    >
      {entry.label}
      <span
        aria-hidden="true"
        className={cn(
          'absolute bottom-0 left-0 h-0.75 w-full bg-primary transition-opacity',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
    </Link>
  )
}

function HeaderSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const currentQuery = useRouterState({
    select: (state) => (state.location.search as CatalogUrlSearch).q ?? '',
  })

  function toggle() {
    setDraft(currentQuery)
    setOpen((value) => !value)
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Buscar NFTs"
        onClick={toggle}
        className="inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-primary/10"
      >
        <Search className="size-5" aria-hidden="true" />
      </button>
    )
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        const q = draft.trim()
        void navigate({
          to: '/',
          hash: 'catalogo',
          resetScroll: false,
          search: (previous) =>
            toUrlSearch({
              ...resolveCatalogSearch(previous as CatalogUrlSearch),
              q: q || undefined,
              page: 1,
            }),
        })
      }}
    >
      <Input
        autoFocus
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
        placeholder="Buscar NFTs"
        aria-label="Buscar NFTs"
        className="h-9 w-52 text-sm"
      />
    </form>
  )
}

function CartLink() {
  const count = useCartCount()

  return (
    <Link
      to="/cart"
      aria-label={
        count > 0 ? `Carrinho — ${count} edições` : 'Carrinho — vazio'
      }
      className="relative inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-primary/10"
    >
      <CartFilledIcon className="size-5" />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="text-tiny-bold absolute -top-1 -right-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-ink"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  )
}

export function SiteHeader({ divider }: { divider: boolean }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const isEntryActive = (label: string): boolean => {
    if (label === 'Início') return pathname === '/'
    if (label === 'Mercado')
      return pathname === '/cart' || pathname.startsWith('/nfts/')
    return false
  }

  return (
    <header
      className={cn(
        'mb-8 hidden h-11.25 items-start justify-between md:flex',
        divider && 'border-b border-border',
      )}
    >
      <Link
        to="/"
        className="w-40 text-body-sm leading-[34.3px] font-bold tracking-[1.4px] text-foreground"
      >
        KURIO
      </Link>
      <nav
        aria-label="Navegação principal"
        className="flex gap-8 text-body-lg-bold"
      >
        {NAV_ENTRIES.map((entry) => (
          <NavAnchor
            key={entry.label}
            entry={entry}
            active={isEntryActive(entry.label)}
          />
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <HeaderSearch />
        <CartLink />
        <Link
          to="/login"
          className={cn(
            buttonVariants(),
            'h-9 px-4 font-medium hover:bg-primary/90',
          )}
        >
          <SignInIcon className="size-5" />
          <span>Entrar</span>
        </Link>
      </div>
    </header>
  )
}
