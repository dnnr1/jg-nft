import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

function CheckoutMobileHeader() {
  const router = useRouter()
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between md:hidden">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => {
          if (router.history.canGoBack()) router.history.back()
          else void navigate({ to: '/cart' })
        }}
        className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-surface-raised"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <h1 className="text-body-lg-bold text-foreground">
        Pagamento com carteira
      </h1>
      <span aria-hidden="true" className="size-9" />
    </div>
  )
}

function CheckoutBreadcrumb() {
  return (
    <nav
      aria-label="Caminho de navegação"
      className="text-body hidden flex-wrap items-center gap-2 font-bold text-foreground md:flex"
    >
      <Link to="/" className="transition-colors hover:text-text-accent">
        Início
      </Link>
      <span aria-hidden="true">/</span>
      <Link
        to="/"
        hash="catalogo"
        className="transition-colors hover:text-text-accent"
      >
        Mercado
      </Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Pagamento</span>
    </nav>
  )
}

export function CheckoutHeader() {
  return (
    <>
      <CheckoutMobileHeader />
      <CheckoutBreadcrumb />
    </>
  )
}
