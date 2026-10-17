import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { UseQueryResult } from '@tanstack/react-query'

import { cn } from 'cn'
import type { CatalogListResponse, Nft } from '@/modules/catalog/types'

const PAGE_SIZE = 5

interface RecommendationPage {
  label: string
  items: Nft[]
}

function chunkPages(items: Nft[]): RecommendationPage[] {
  const pages: RecommendationPage[] = []
  for (let start = 0; start < items.length; start += PAGE_SIZE) {
    pages.push({
      label: `Grupo ${pages.length + 1}`,
      items: items.slice(start, start + PAGE_SIZE),
    })
  }
  return pages
}

function RecommendationCard({ nft }: { nft: Nft }) {
  return (
    <Link
      to="/nfts/$id"
      params={{ id: nft.id }}
      search={{ qty: 1 }}
      aria-label={`Ver ${nft.name}`}
      className="group flex flex-col gap-3"
    >
      <div className="relative aspect-square bg-surface-card p-2.5">
        <img
          src={nft.image}
          alt={`${nft.name}, coleção ${nft.collection}`}
          width={360}
          height={360}
          loading="lazy"
          className="size-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-1 px-1">
        <h3 className="text-base leading-4 font-normal text-foreground">
          {nft.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg leading-4 font-bold text-primary">
            {nft.price} ETH
          </span>
          {nft.previousPrice ? (
            <span className="text-lg leading-4 text-text-secondary">
              {nft.previousPrice} ETH
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

function RecommendationSkeleton() {
  return (
    <div>
      <div className="shimmer aspect-square rounded-2xl bg-surface-card" />
      <div className="shimmer mt-3 h-5 w-4/5 rounded-md bg-surface-card" />
      <div className="shimmer mt-2 h-4 w-1/2 rounded-md bg-surface-card" />
    </div>
  )
}

interface NftRecommendationsProps {
  query: UseQueryResult<CatalogListResponse>
  currentId: string
}

export function NftRecommendations({
  query,
  currentId,
}: NftRecommendationsProps) {
  const [page, setPage] = useState(0)
  const { data, isPending } = query

  const pages = data
    ? chunkPages(data.items.filter((item) => item.id !== currentId))
    : []
  const pageCount = pages.length

  return (
    <section aria-label="Mais desta coleção" className="flex flex-col gap-6">
      <div className="border-b border-border">
        <h2 className="w-fit pb-3 text-[17px] font-bold text-primary">
          Mais desta coleção
        </h2>
      </div>

      <div
        role="region"
        aria-roledescription="carrossel"
        aria-label="NFTs recomendados"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' && page < pageCount - 1) {
            event.preventDefault()
            setPage((current) => current + 1)
          }
          if (event.key === 'ArrowLeft' && page > 0) {
            event.preventDefault()
            setPage((current) => current - 1)
          }
        }}
      >
        <div className="touch-pan-y overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {isPending ? (
              <div className="grid min-w-0 shrink-0 grow-0 basis-full grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: PAGE_SIZE }, (_, index) => (
                  <RecommendationSkeleton key={index} />
                ))}
              </div>
            ) : (
              pages.map((entry, index) => (
                <div
                  key={entry.label}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${entry.label} de ${pageCount}`}
                  aria-hidden={index !== page}
                  inert={index !== page}
                  className="grid min-w-0 shrink-0 grow-0 basis-full grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5"
                >
                  {entry.items.map((item) => (
                    <RecommendationCard key={item.id} nft={item} />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {pageCount > 1 ? (
          <div className="flex justify-center gap-2">
            {pages.map((entry, index) => (
              <button
                key={entry.label}
                type="button"
                aria-label={`Ir para ${entry.label}`}
                aria-current={page === index ? 'true' : undefined}
                onClick={() => setPage(index)}
                className="flex size-11 items-center justify-center rounded-full"
              >
                <span
                  className={cn(
                    'size-3 rounded-full border border-primary transition-colors',
                    page === index ? 'bg-primary' : 'bg-transparent',
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {pageCount > 0
            ? `${pageCount > 1 ? `Grupo ${page + 1} de ${pageCount}` : ''} de recomendações.`
            : ''}
        </p>
      </div>
    </section>
  )
}
