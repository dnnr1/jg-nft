import { useState } from 'react'

import { Drawer } from '@/components/common/drawer'
import { SearchField } from '@/components/common/search-field'
import { Button } from '@/components/ui/button'
import { IconlyFilter } from '@/components/icons'
import type {
  CatalogPatchFn,
  ResolvedCatalogSearch,
} from '../search-params'
import type { CatalogListResponse } from '../types'
import { CatalogFilters } from './catalog-filters'

interface MobileControlsProps {
  search: ResolvedCatalogSearch
  facets: CatalogListResponse['facets'] | undefined
  loading: boolean
  failed: boolean
  onRetry: () => void
  onPatch: CatalogPatchFn
}

export function MobileControls({
  search,
  facets,
  loading,
  failed,
  onRetry,
  onPatch,
}: MobileControlsProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-4 flex gap-2 md:hidden">
      <SearchField
        value={search.q ?? ''}
        onCommit={(q) => onPatch({ q: q || undefined }, { replace: true })}
        placeholder="Explorar coleções"
        label="Buscar NFTs"
      />
      <Button
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Abrir filtros"
        className="h-11.25 w-11.25 shrink-0 rounded-[14px] bg-brand-gradient"
      >
        <IconlyFilter className="size-[22px]" aria-hidden="true" />
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Filtros"
        description="Combine coleções e preços para explorar NFTs."
      >
        <CatalogFilters
          facets={facets}
          search={search}
          loading={loading}
          failed={failed}
          onRetry={onRetry}
          onPatch={onPatch}
        />
      </Drawer>
    </div>
  )
}
