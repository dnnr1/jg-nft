import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'

import { cn } from 'cn'
import { CatalogItem, CatalogItemSkeleton } from '@/modules/catalog/components/catalog-item'
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

interface CartRelatedProps {
  query: UseQueryResult<CatalogListResponse>
  /** NFTs já presentes no carrinho não são recomendados. */
  excludeIds: string[]
}

export function CartRelated({ query, excludeIds }: CartRelatedProps) {
  const [page, setPage] = useState(0)
  const { data, isPending } = query

  const excluded = new Set(excludeIds)
  const pages = data
    ? chunkPages(data.items.filter((item) => !excluded.has(item.id)))
    : []
  const pageCount = pages.length

  return (
    <section
      aria-labelledby="cart-related-title"
      className="flex flex-col gap-8 max-md:hidden"
    >
      <div className="border-b border-border">
        <h2
          id="cart-related-title"
          className="text-body-17-bold w-fit pb-3 text-text-accent"
        >
          Colecionadores também viram
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
                  <CatalogItemSkeleton key={index} />
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
                    <CatalogItem key={item.id} nft={item} />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {pageCount > 1 ? (
          <div className="mt-6 flex justify-center gap-0">
            {pages.map((entry, index) => (
              <button
                key={entry.label}
                type="button"
                aria-label={`Ir para ${entry.label}`}
                aria-current={page === index ? 'true' : undefined}
                onClick={() => setPage(index)}
                className="flex size-5 items-center justify-center rounded-full"
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
