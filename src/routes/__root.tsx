/// <reference types="vite/client" />
import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { ReactNode } from 'react'

import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import appCss from '@/styles/app.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Kurio — Marketplace de NFTs' },
      {
        name: 'description',
        content:
          'Descubra, colecione e negocie NFTs selecionados de criadores emergentes e consagrados na Kurio.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '256x256',
        href: '/favicon.png',
      },
    ],
  }),
  notFoundComponent: NotFound,
  errorComponent: ({ error, reset }) => (
    <RootDocument>
      <RootError
        error={error instanceof Error ? error : new Error(String(error))}
        reset={reset}
      />
    </RootDocument>
  ),
  component: RootComponent,
})

function RootComponent() {
  const isCatalog = useRouterState({
    select: (state) => state.location.pathname === '/',
  })
  const isNftDetail = useRouterState({
    select: (state) => state.location.pathname.startsWith('/nfts/'),
  })

  return (
    <RootDocument>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <main
        id="conteudo"
        className={`mx-auto max-w-[1440px] ${
          isNftDetail ? 'p-0 md:px-30 md:py-6' : 'px-6 py-10 md:px-30 md:py-6'
        } ${
          isCatalog
            ? 'pb-[calc(128px+env(safe-area-inset-bottom,0px))] md:pb-6'
            : ''
        }`}
      >
        <SiteHeader divider={isCatalog} />
        <Outlet />
        <SiteFooter />
      </main>
      {isCatalog ? <MobileTabBar /> : null}
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools buttonPosition="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-display font-bold text-foreground">404</h1>
      <p className="text-body text-text-secondary">Página não encontrada</p>
      <div>
        <Link
          to="/"
          className="mt-4 inline-block rounded border border-primary bg-primary/20 px-4 py-2 text-tiny text-primary transition-colors hover:bg-primary/30"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  )
}

function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4 rounded-md border border-coral/40 bg-surface-card p-6">
      <h2 className="text-h2 font-bold text-coral">Erro ao carregar rota</h2>
      <p className="text-body-sm text-foreground/80">{error.message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded border border-border bg-surface-raised px-4 py-2 text-tiny transition-colors hover:border-primary"
        >
          Tentar novamente
        </button>
        <Link
          to="/"
          className="rounded border border-primary bg-primary/20 px-4 py-2 text-tiny text-primary transition-colors hover:bg-primary/30"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  )
}
