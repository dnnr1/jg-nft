import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, Search } from 'lucide-react'

import { Lightbox } from '@/components/common/lightbox'
import { HeartOutlineIcon } from '@/components/icons'
import { cn } from 'cn'
import type { Nft } from '@/modules/catalog/types'

interface NftGalleryProps {
  nft: Nft
}

export function NftGallery({ nft }: NftGalleryProps) {
  const [selected, setSelected] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  return (
    <section aria-label="Galeria do NFT" className="min-w-0">
      <div className="mb-4 flex items-center justify-between md:hidden">
        <Link
          to="/"
          aria-label="Voltar ao mercado"
          className="flex size-8.75 items-center justify-center rounded-[17.5px] border border-border bg-surface-raised text-foreground"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
        <Link
          to="/login"
          aria-label="Entrar para favoritar"
          className="flex size-8.75 items-center justify-center rounded-[17.5px] border border-border bg-surface-raised text-primary"
        >
          <HeartOutlineIcon className="size-5" />
        </Link>
      </div>

      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:gap-4">
        <div className="order-2 hidden shrink-0 gap-3 md:flex md:flex-col">
          {nft.images.map((src, index) => (
            <button
              key={src + index}
              type="button"
              aria-label={`Ver imagem ${index + 1} de ${nft.name}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={cn(
                'size-16 overflow-hidden rounded-xl border-2 bg-surface-card',
                selected === index ? 'border-primary' : 'border-transparent',
              )}
            >
              <img
                src={src}
                alt=""
                width={64}
                height={64}
                loading="lazy"
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>

        <div className="order-1 min-w-0 flex-1 md:order-2">
          <div className="relative aspect-[1.18/1] overflow-hidden rounded-2xl bg-surface-card md:aspect-square md:p-4">
            <button
              type="button"
              aria-label={`Ampliar imagem de ${nft.name}`}
              onClick={() => setZoomOpen(true)}
              className="absolute inset-0 size-full cursor-zoom-in md:p-4"
            >
              <img
                src={nft.images[selected]}
                alt={nft.name}
                width={404}
                height={404}
                fetchPriority="high"
                className="size-full rounded-2xl object-cover md:rounded-xl"
              />
              <span className="pointer-events-none absolute top-3 right-3 hidden size-10 items-center justify-center rounded-full bg-surface-raised text-foreground md:flex">
                <Search className="size-5" aria-hidden="true" />
              </span>
            </button>
            {nft.rarity ? (
              <span className="absolute top-3 left-3 rounded-full bg-ink/85 px-2 py-1 text-xs text-text-accent md:top-auto md:bottom-6 md:left-6">
                {nft.rarity}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Lightbox
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        src={nft.images[selected] ?? nft.image}
        alt={`${nft.name}, imagem ampliada`}
      />
    </section>
  )
}
