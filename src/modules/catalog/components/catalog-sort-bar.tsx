import { cn } from 'cn'
import {
  SORT_OPTIONS,
  type CatalogSort,
  type CatalogTab,
} from '../search-params'
import type { CatalogPatchFn, ResolvedCatalogSearch } from '../search-params'

const CATALOG_TAB_OPTIONS: ReadonlyArray<{ value: CatalogTab; label: string }> =
  [
    { value: 'todos', label: 'Todos os NFTs' },
    { value: 'novos', label: 'Novos lançamentos' },
    { value: 'alta', label: 'Em alta' },
  ]

interface CatalogSortBarProps {
  search: ResolvedCatalogSearch
  onPatch: CatalogPatchFn
}

function QuickSort({
  active,
  label,
  onSelect,
}: {
  active: boolean
  label: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        'cursor-pointer border-b-2 border-transparent pb-1.5',
        active
          ? 'border-primary text-primary text-body-bold md:text-body-combo'
          : 'text-foreground text-body-sm md:text-body-combo',
      )}
    >
      {label}
    </button>
  )
}

export function CatalogSortBar({ search, onPatch }: CatalogSortBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4 md:mb-8">
      <div
        role="group"
        aria-label="Seleção de catálogo"
        className="flex gap-4"
      >
        {CATALOG_TAB_OPTIONS.map((tab) => (
          <QuickSort
            key={tab.value}
            label={tab.label}
            active={search.tab === tab.value}
            onSelect={() => onPatch({ tab: tab.value })}
          />
        ))}
      </div>
      <label className="hidden items-baseline gap-1 text-body-combo text-foreground md:flex">
        Ordenar por:
        <select
          aria-label="Ordenar por"
          value={search.sort}
          onChange={(event) =>
            onPatch({ sort: event.target.value as CatalogSort })
          }
          className="cursor-pointer rounded-default border border-transparent bg-transparent py-1 pr-2 pl-1.5 text-body-combo text-foreground transition-colors outline-none hover:border-border-soft focus:border-primary focus:bg-surface-card"
        >
          {SORT_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-surface-card"
            >
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
