import type { UseQueryResult } from '@tanstack/react-query'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { cn } from 'cn'
import { hasActiveFilters, type ResolvedCatalogSearch } from '../search-params'
import type { CatalogListResponse } from '../types'
import { CatalogItem, CatalogItemSkeleton } from './catalog-item'

const GRID =
  'grid grid-cols-1 gap-x-4 gap-y-6 min-[360px]:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-10 min-[360px]:max-md:[&>*:nth-child(even)]:translate-y-8'

interface CatalogGridProps {
  query: UseQueryResult<CatalogListResponse>
  search: ResolvedCatalogSearch
  skeletonCount: number
  onClearFilters: () => void
}

export function CatalogGrid({
  query,
  search,
  skeletonCount,
  onClearFilters,
}: CatalogGridProps) {
  const { data, isPending, isError, isFetching, refetch } = query

  if (isError) {
    return (
      <ErrorState
        title="Erro ao carregar NFTs"
        description="Não foi possível carregar o catálogo. Tente novamente."
        onRetry={() => void refetch()}
      />
    )
  }

  if (!isPending && data && data.items.length === 0) {
    return (
      <EmptyState
        title="Nenhum NFT encontrado"
        description={
          hasActiveFilters(search)
            ? 'Experimente outra busca ou remova os filtros.'
            : 'O catálogo está vazio no momento.'
        }
        actionLabel="Limpar filtros"
        onAction={onClearFilters}
      />
    )
  }

  return (
    <div
      className={cn(
        'transition-opacity duration-300',
        isFetching && !isPending && 'opacity-70',
      )}
    >
      <div className={GRID} aria-label="NFTs do catálogo" aria-busy={isPending}>
        {isPending
          ? Array.from({ length: skeletonCount }, (_, index) => (
              <CatalogItemSkeleton key={index} />
            ))
          : data?.items.map((nft) => <CatalogItem key={nft.id} nft={nft} />)}
      </div>
    </div>
  )
}
