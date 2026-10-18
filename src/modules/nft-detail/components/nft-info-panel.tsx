import {
  LinkedinIcon,
  TwitterIcon,
} from '@/components/common/brand-icons'
import { HeartOutlineIcon } from '@/components/icons'
import { useAuth } from '@/modules/auth/auth-context'
import { cn } from 'cn'
import type { Nft } from '@/modules/catalog/types'
import { QuantityStepper } from './quantity-stepper'

const EDITION_OPTIONS = ['1/1', '1/10', '1/50', 'ABERTA'] as const

function EnvelopeGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 18 18"
      fill="currentColor"
      className="size-4.5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 4.09091C7.30168 4.09091 4.98846 4.2365 3.51951 4.34356C3.03167 4.37911 2.65385 4.76529 2.65385 5.23696V5.76996L8.53304 8.85802C8.82344 9.01056 9.17656 9.01056 9.46697 8.85802L15.3462 5.76996V5.23696C15.3462 4.76529 14.9683 4.37911 14.4805 4.34356C13.0115 4.2365 10.6983 4.09091 9 4.09091ZM15.3462 7.01792L10.0273 9.81165C9.38843 10.1472 8.61157 10.1472 7.97268 9.81165L2.65385 7.01792V12.763C2.65385 13.2347 3.03167 13.6209 3.51951 13.6564C4.98846 13.7635 7.30168 13.9091 9 13.9091C10.6983 13.9091 13.0115 13.7635 14.4805 13.6564C14.9683 13.6209 15.3462 13.2347 15.3462 12.763V7.01792ZM3.43083 3.25588C4.90066 3.14876 7.25301 3 9 3C10.747 3 13.0993 3.14876 14.5692 3.25588C15.6676 3.33593 16.5 4.20441 16.5 5.23696V12.763C16.5 13.7956 15.6676 14.6641 14.5692 14.7441C13.0993 14.8512 10.747 15 9 15C7.25301 15 4.90066 14.8512 3.43083 14.7441C2.33237 14.6641 1.5 13.7956 1.5 12.763V5.23696C1.5 4.20441 2.33237 3.33593 3.43083 3.25588Z"
      />
    </svg>
  )
}

interface NftInfoPanelProps {
  nft: Nft
  qty: number
  onQtyChange: (qty: number) => void
}

export function NftInfoPanel({ nft, qty, onQtyChange }: NftInfoPanelProps) {
  const { openAuthDialog } = useAuth()
  const maxQty = Math.max(1, nft.available)
  const displayQty = Math.min(qty, maxQty)
  const soldOut = nft.available === 0
  const purchaseBlocked = soldOut || !nft.editable
  const reviewCount = nft.reviews?.count ?? 0
  const average = nft.reviews?.average ?? 0
  const fullStars = Math.floor(average)
  const ownEdition = `${nft.edition.current}/${nft.edition.total}`

  const editionLabels: ReadonlyArray<string> = [
    ...EDITION_OPTIONS.filter((label) => label !== ownEdition),
    ownEdition,
  ]

  const shareUrl = typeof window === 'undefined' ? '' : window.location.href
  const shareSubject = encodeURIComponent(nft.name)
  const shareLinks = [
    {
      label: 'Compartilhar no LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      icon: <LinkedinIcon className="size-4.5" />,
      external: true,
    },
    {
      label: 'Compartilhar por e-mail',
      href: `mailto:?subject=${shareSubject}&body=${encodeURIComponent(shareUrl)}`,
      icon: <EnvelopeGlyph />,
      external: false,
    },
    {
      label: 'Compartilhar no Twitter',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareSubject}`,
      icon: <TwitterIcon className="size-4.5" />,
      external: true,
    },
  ]

  return (
    <section
      aria-label="Informações do NFT"
      className="relative z-10 -mx-4 -mt-8 min-w-0 rounded-t-3xl bg-surface-card px-8 py-5 md:mx-0 md:mt-0 md:rounded-none md:bg-transparent md:p-0"
    >
      <div className="flex flex-col gap-5 md:gap-6">
        <header className="-mb-2 flex flex-col gap-3 md:mb-0">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl leading-7 font-bold text-foreground md:text-3xl">
              {nft.name}
            </h1>
            <span
              aria-label={`Avaliação ${average.toFixed(1)} de 5, ${reviewCount} avaliações`}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-1 text-xs text-foreground md:hidden"
            >
              <span className="text-primary" aria-hidden="true">
                ★
              </span>
              <span>{average.toFixed(1)}</span>
              <span className="text-text-secondary">({reviewCount})</span>
            </span>
          </div>

          <div className="hidden flex-col gap-2 md:flex">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[22px] font-bold text-primary">
                  {nft.price} ETH
                </span>
              </div>
              <div
                className="flex items-center gap-2 text-sm text-foreground"
                aria-label={`Avaliação ${fullStars} de 5, ${reviewCount} avaliações`}
              >
                <span className="flex items-center gap-0.5" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, index) => (
                    <span
                      key={index}
                      className={
                        index < fullStars
                          ? 'text-primary'
                          : 'text-text-secondary'
                      }
                    >
                      ★
                    </span>
                  ))}
                </span>
                <span>{reviewCount} avaliações de colecionadores</span>
              </div>
            </div>
            <div className="h-px w-full bg-border-soft" />
          </div>
        </header>

        <section className="flex flex-col gap-2">
          <h2 className="hidden text-sm font-bold text-foreground md:block">
            Sobre este NFT
          </h2>
          <p className="text-sm leading-5 text-text-secondary md:leading-6">
            {nft.description}
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-bold text-foreground md:text-sm">
            Edição
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {editionLabels.map((label) => (
              <span
                key={label}
                className={cn(
                  'text-xs',
                  label === ownEdition
                    ? 'font-bold text-text-accent'
                    : 'text-text-secondary',
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className="hidden items-center justify-between gap-4 md:flex">
          <QuantityStepper
            qty={displayQty}
            max={maxQty}
            disabled={purchaseBlocked}
            onChange={onQtyChange}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={purchaseBlocked}
              className="inline-flex h-10 min-w-32 items-center justify-center rounded-md bg-primary px-8 text-sm font-bold text-ink hover:bg-primary-dark disabled:opacity-40"
            >
              COMPRAR
            </button>
            <button
              type="button"
              aria-label="Entrar para favoritar"
              onClick={() => openAuthDialog('login')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary bg-transparent px-4 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              <HeartOutlineIcon className="size-5" />
              Favoritar
            </button>
          </div>
        </section>

        {purchaseBlocked ? (
          <p className="text-tiny text-coral" role="status">
            {soldOut
              ? 'Edição esgotada — sem exemplares disponíveis.'
              : 'Este NFT não está disponível para compra no momento.'}
          </p>
        ) : null}

        <section className="flex flex-col gap-3 text-[15px] md:gap-4">
          <div className="flex items-start gap-1">
            <span className="text-text-secondary">ID do token:</span>
            <span className="text-text-secondary">{nft.tokenId ?? '—'}</span>
          </div>
          <div className="flex items-start gap-1">
            <span className="text-text-secondary">Coleção:</span>
            <span className="text-text-secondary">{nft.collection}</span>
          </div>
        </section>

        <div className="hidden flex-wrap items-center gap-2 text-[15px] font-bold text-foreground md:flex">
          <span>Compartilhar este NFT:</span>
          <div className="flex items-center gap-2">
            {shareLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noreferrer' : undefined}
                aria-label={link.label}
                className="flex items-center justify-center transition-colors hover:text-primary"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
