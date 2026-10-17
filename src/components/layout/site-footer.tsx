import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/common/brand-icons'
import { buttonVariants } from '@/components/ui/button'
import { cn } from 'cn'

const HIGHLIGHTS = [
  {
    badge: 'W',
    title: 'Segurança da carteira',
    description:
      'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    badge: 'C',
    title: 'Criadores em destaque',
    description:
      'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    badge: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

const LINK_COLUMNS = [
  {
    title: 'Meu perfil',
    links: [
      { label: 'Meu perfil', to: '/profile' },
      { label: 'Minha coleção', to: '/' },
      { label: 'Atividade', to: '/' },
      { label: 'Estúdio do criador', to: '/' },
      { label: 'Lista de interesse', to: '/' },
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      { label: 'Central de ajuda', to: '/' },
      { label: 'Como comprar NFTs', to: '/' },
      { label: 'Carteira e segurança', to: '/' },
      { label: 'Política do mercado', to: '/' },
      { label: 'Denunciar item', to: '/' },
    ],
  },
  {
    title: 'Coleções',
    links: [
      { label: 'Arte digital', to: '/' },
      { label: 'Fotografia', to: '/' },
      { label: 'Música', to: '/' },
      { label: 'Arte 3D', to: '/' },
      { label: 'Utilidade', to: '/' },
    ],
  },
] as const

const SOCIALS = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'Twitter', Icon: TwitterIcon },
  { label: 'LinkedIn', Icon: LinkedinIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
] as const

function Strip({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-22 items-center bg-surface-dark px-8 text-body-sm text-foreground">
      {children}
    </div>
  )
}

function LinkColumn({
  title,
  links,
}: {
  title: string
  links: ReadonlyArray<{ label: string; to: '/' | '/profile' }>
}) {
  return (
    <div className="p-8 pb-7.5">
      <h2 className="text-body-18-bold mb-2 text-foreground">{title}</h2>
      <div className="flex flex-col">
        {links.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="text-body-sm leading-7.5 text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function SiteFooter() {
  return (
    <>
      <footer className="mt-24 hidden bg-surface-card md:block">
        <div className="mx-auto flex divide-x divide-primary p-8">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.badge}
              className="flex flex-[1_1_202px] flex-col gap-4 px-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary font-bold text-2xl text-ink">
                {item.badge}
              </div>
              <h2 className="text-base font-bold text-foreground">
                {item.title}
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                {item.description}
              </p>
            </div>
          ))}
          <div className="flex flex-[0_1_357px] flex-col gap-3 px-4">
            <span className="text-lg leading-tight font-bold text-foreground">
              Antecipe-se ao próximo
              <br />
              lançamento
            </span>
            <form
              noValidate
              onSubmit={(event) => event.preventDefault()}
              className="flex w-full flex-col gap-1"
            >
              <div className="flex h-10 w-full items-center justify-between rounded-md bg-surface-dark pl-3 shadow-[0_0_20px_0_rgba(10,6,4,0.45)]">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  aria-label="E-mail para newsletter"
                  placeholder="digite seu e-mail..."
                  className="newsletter-email-input h-full w-full border-none bg-transparent text-sm text-foreground caret-primary outline-none placeholder:text-secondary focus:bg-transparent focus:text-foreground focus:placeholder:text-secondary focus-visible:ring-0"
                />
                <button
                  type="submit"
                  className={cn(
                    buttonVariants(),
                    'h-full rounded-l-none rounded-r-[6px] px-6 text-sm font-bold shadow-none hover:bg-primary/90',
                  )}
                >
                  Enviar
                </button>
              </div>
            </form>
            <p className="text-xs leading-relaxed text-text-secondary">
              Receba lançamentos selecionados, histórias de criadores e
              novidades do mercado.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4">
          <Strip>
            <span className="text-body-bold text-foreground">KURIO</span>
          </Strip>
          <Strip>
            <p className="text-foreground">
              Feito para colecionadores, criadores e cultura
            </p>
          </Strip>
          <Strip>
            <a
              className="text-center text-foreground"
              href="mailto:contato@email.com"
            >
              contato@email.com
            </a>
          </Strip>
          <Strip>
            <p className="text-center text-foreground">+55 11 4002 8922</p>
          </Strip>
        </div>

        <div className="grid grid-cols-4">
          {LINK_COLUMNS.map((column) => (
            <LinkColumn key={column.title} {...column} />
          ))}
          <div className="p-8 pb-7.5">
            <h2 className="text-body-18-bold mb-5 text-foreground">
              Redes sociais
            </h2>
            <div className="mb-8 flex flex-wrap items-center gap-2.5 text-primary">
              {SOCIALS.map(({ label, Icon }) => (
                <span
                  key={label}
                  role="img"
                  aria-label={label}
                  className="grid h-7.5 aspect-square place-content-center rounded-sm border border-primary"
                >
                  <Icon className="size-4" />
                </span>
              ))}
            </div>
            <div>
              <h2 className="text-body-18-bold mb-5 text-foreground">
                Carteiras compatíveis
              </h2>
              <span className="rounded-default border border-border-soft bg-surface-dark px-[10.5px] py-1.75 text-tiny-bold text-text-accent">
                METAMASK • WALLETCONNECT • COINBASE
              </span>
            </div>
          </div>
        </div>
      </footer>
      <p className="mt-1.5 hidden text-center text-body-regular text-foreground md:block">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </>
  )
}
