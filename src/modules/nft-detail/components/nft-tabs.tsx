import { useState } from 'react'

import { IconlyStar } from '@/components/icons'
import { cn } from 'cn'
import type { Nft } from '@/modules/catalog/types'

type DetailTab = 'detalhes' | 'avaliacoes'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatReviewDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

interface NftTabsProps {
  nft: Nft
}

export function NftTabs({ nft }: NftTabsProps) {
  const [tab, setTab] = useState<DetailTab>('detalhes')
  const reviews = nft.reviews

  const tabs: ReadonlyArray<{
    id: DetailTab
    label: string
  }> = [
    { id: 'detalhes', label: 'Detalhes do NFT' },
    {
      id: 'avaliacoes',
      label: `Avaliações de colecionadores (${reviews?.count ?? 0})`,
    },
  ]

  function onTabListKeyDown(event: React.KeyboardEvent) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    setTab((current) =>
      event.key === 'ArrowRight'
        ? current === 'detalhes'
          ? 'avaliacoes'
          : 'detalhes'
        : current === 'detalhes'
          ? 'avaliacoes'
          : 'detalhes',
    )
  }

  return (
    <section aria-label="Mais informações">
      <div
        role="tablist"
        aria-label="Detalhes e avaliações"
        onKeyDown={onTabListKeyDown}
        className="mb-3 flex gap-8 border-b border-border"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            id={`tab-${item.id}`}
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            className={cn(
              'text-body-17-bold pb-2',
              tab === item.id
                ? 'border-b-2 border-primary font-bold text-text-accent'
                : 'text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'detalhes' ? (
        <div
          role="tabpanel"
          id="panel-detalhes"
          aria-labelledby="tab-detalhes"
          tabIndex={0}
          className="space-y-4 text-sm leading-6 text-text-secondary"
        >
          {(nft.details ?? nft.description).split('\n').map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            <strong className="text-foreground">Rede:</strong>
            <br />
            {nft.network}
          </p>
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-avaliacoes"
          aria-labelledby="tab-avaliacoes"
          tabIndex={0}
          className="space-y-6"
        >
          {reviews && reviews.items.length > 0 ? (
            reviews.items.map((item) => (
              <article
                key={item.id}
                aria-label={`Avaliação de ${item.author}`}
                className="space-y-1.5 border-b border-border pb-6 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-body-17-bold font-bold text-foreground">
                    {item.author}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-text-secondary">
                    <span className="flex" aria-hidden="true">
                      {Array.from({ length: 5 }, (_, index) => (
                        <IconlyStar
                          key={index}
                          className={cn(
                            'size-3.5',
                            index < item.rating
                              ? 'text-primary'
                              : 'text-secondary',
                          )}
                        />
                      ))}
                    </span>
                    {item.rating} de 5
                  </span>
                </div>
                <p className="text-sm leading-6 text-text-secondary">
                  {item.comment}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatReviewDate(item.date)}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm leading-6 text-text-secondary">
              Ainda não há avaliações para este NFT. Compre e volte para
              compartilhar sua experiência com outros colecionadores.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
