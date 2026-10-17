import { useEffect, useId, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DualRangeSlider } from '@/components/common/dual-range-slider'
import { cn } from 'cn'
import {
  CATEGORIES,
  NETWORK_LABELS,
  type CatalogPatchFn,
  type CatalogNetwork,
  type ResolvedCatalogSearch,
} from '../search-params'
import type { CatalogListResponse } from '../types'

interface CatalogFiltersProps {
  facets: CatalogListResponse['facets'] | undefined
  search: ResolvedCatalogSearch
  onPatch: CatalogPatchFn
  loading: boolean
  failed: boolean
  onRetry: () => void
}

const SCALE_MAX_CENTS = 2000
const LEGEND = 'mb-3 text-lg leading-4 font-bold text-foreground'
const ROW =
  'relative flex h-10 w-full cursor-pointer items-center justify-between gap-2 text-body leading-10'
const FOCUS_RING =
  'pointer-events-none absolute inset-0 rounded-default peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-card'

function ethToCents(price: string): number {
  const [whole, fraction = ''] = price.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2))
}

function centsToEth(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}

function countLabel(
  id: string,
  kind: 'categories' | 'networks',
  facets: CatalogListResponse['facets'] | undefined,
  loading: boolean,
  failed: boolean,
) {
  if (failed) return <span aria-label="Contagem indisponível">—</span>
  if (loading || !facets) {
    return <Skeleton className="h-4 w-9" aria-label="Carregando contagem" />
  }
  const count = facets[kind].find((item) => item.id === id)?.count ?? 0
  return <span className={kind === 'categories' ? 'font-bold' : undefined}>({count})</span>
}

function FilterRow({
  name,
  checked,
  count,
  onToggle,
  helpId,
}: {
  name: string
  checked: boolean
  count: ReactNode
  onToggle: (next: boolean) => void
  helpId?: string
}) {
  return (
    <label
      className={cn(ROW, checked ? 'text-text-accent' : 'text-text-secondary')}
    >
      <input
        type="checkbox"
        aria-label={name}
        aria-describedby={helpId}
        checked={checked}
        onChange={(event) => onToggle(event.target.checked)}
        className="peer sr-only"
      />
      <span className={FOCUS_RING} aria-hidden="true" />
      <span>{name}</span>
      {count}
    </label>
  )
}

export function CatalogFilters({
  facets,
  search,
  onPatch,
  loading,
  failed,
  onRetry,
}: CatalogFiltersProps) {
  const domId = useId()

  const urlMin = search.minPrice ? ethToCents(search.minPrice) : 0
  const urlMax = search.maxPrice ? ethToCents(search.maxPrice) : SCALE_MAX_CENTS
  const scaleMax = Math.max(SCALE_MAX_CENTS, Math.ceil((urlMax + 1) / 100) * 100)
  const [range, setRange] = useState<[number, number]>([urlMin, urlMax])

  useEffect(() => {
    setRange([urlMin, urlMax])
  }, [urlMin, urlMax])

  return (
    <div className="space-y-10 bg-surface-card p-5">
      <fieldset className="min-w-0">
        <legend className={LEGEND}>Coleções</legend>
        <p id={`${domId}-colecoes`} className="sr-only">
          Selecione uma ou mais coleções. Para remover um filtro, desmarque a
          coleção correspondente.
        </p>
        <div className="px-3">
          {CATEGORIES.map((category) => (
            <FilterRow
              key={category}
              name={category}
              checked={search.categories.includes(category)}
              count={countLabel(category, 'categories', facets, loading, failed)}
              helpId={`${domId}-colecoes`}
              onToggle={(next) =>
                onPatch({
                  categories: next
                    ? [...search.categories, category]
                    : search.categories.filter((value) => value !== category),
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className={LEGEND}>Faixa de preço</legend>
        <div className="space-y-3 pl-3">
          <DualRangeSlider
            min={0}
            max={scaleMax}
            value={range}
            onValueChange={setRange}
            minLabel="Preço mínimo"
            maxLabel="Preço máximo"
          />
          <p className="wrap-break-word text-body leading-5 text-foreground">
            Preço: {centsToEth(range[0])} - {centsToEth(range[1])} ETH
          </p>
          <Button
            size="sm"
            className="h-9 rounded-default px-3 py-2 text-base leading-5 font-bold shadow-none"
            onClick={() =>
              onPatch({
                minPrice: range[0] === 0 ? undefined : centsToEth(range[0]),
                maxPrice:
                  range[1] >= scaleMax ? undefined : centsToEth(range[1]),
              })
            }
          >
            Aplicar
          </Button>
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className={LEGEND}>Rede</legend>
        <div className="pl-3">
          {(['ethereum', 'polygon', 'solana'] as const).map((network) => (
            <FilterRow
              key={network}
              name={NETWORK_LABELS[network] ?? network}
              checked={search.networks.includes(network as CatalogNetwork)}
              count={countLabel(network, 'networks', facets, loading, failed)}
              onToggle={(next) =>
                onPatch({
                  networks: next
                    ? [...search.networks, network as CatalogNetwork]
                    : search.networks.filter((value) => value !== network),
                })
              }
            />
          ))}
        </div>
      </fieldset>

      {failed ? (
        <div role="alert" className="text-tiny text-coral">
          <p>Não foi possível carregar as contagens.</p>
          <Button variant="link" size="xsm" onClick={onRetry}>
            Tentar novamente contagens
          </Button>
        </div>
      ) : null}
    </div>
  )
}
