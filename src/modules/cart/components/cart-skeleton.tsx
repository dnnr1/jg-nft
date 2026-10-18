import { cn } from 'cn'

import { CART_COLUMNS } from './cart-items'

const ROW_GRID = cn(
  'hidden overflow-hidden rounded-lg bg-surface-card md:grid md:h-16 md:items-center',
  CART_COLUMNS,
)

function RowSkeleton() {
  return (
    <li className="list-none">
      <div className="flex items-center gap-3 rounded-lg bg-surface-card p-3 md:hidden">
        <div className="shimmer size-20 shrink-0 rounded-lg bg-surface-raised" />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="shimmer h-4 w-28 rounded-sm bg-surface-raised" />
            <div className="shimmer h-3 w-20 rounded-sm bg-surface-raised" />
            <div className="shimmer h-4 w-16 rounded-sm bg-surface-raised" />
          </div>
          <div className="shimmer h-7.5 w-24 shrink-0 rounded-full bg-surface-raised" />
        </div>
      </div>

      <div className={ROW_GRID}>
        <div className="flex items-center gap-[15px]">
          <div className="shimmer size-16 shrink-0 rounded-lg bg-surface-raised" />
          <div className="flex-1">
            <div className="shimmer h-4 w-40 rounded-sm bg-surface-raised" />
            <div className="shimmer mt-2 h-3 w-28 rounded-sm bg-surface-raised" />
          </div>
        </div>
        <div className="shimmer h-4 w-14 rounded-sm bg-surface-raised" />
        <div className="shimmer h-7.5 w-24 rounded-[20px] bg-surface-raised" />
        <div className="shimmer h-4 w-20 rounded-sm bg-surface-raised" />
        <div className="shimmer size-9 rounded-md bg-surface-raised" />
      </div>
    </li>
  )
}

export function CartSkeleton() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Carregando carrinho…
      </p>
      <div className="grid gap-5 md:gap-10 lg:grid-cols-[minmax(0,742px)_306px] lg:justify-between">
        <div>
          <div
            aria-hidden="true"
            className={cn(
              'mb-3 hidden border-b border-border pb-2 md:grid',
              CART_COLUMNS,
            )}
          >
            <div className="shimmer h-4 w-16 rounded-sm bg-surface-raised" />
            <div className="shimmer h-4 w-12 rounded-sm bg-surface-raised" />
            <div className="shimmer h-4 w-14 rounded-sm bg-surface-raised" />
            <div className="shimmer h-4 w-12 rounded-sm bg-surface-raised" />
          </div>
          <ul className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <RowSkeleton key={index} />
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-surface-card p-4 md:rounded-none md:bg-transparent md:p-0">
          <div className="shimmer hidden h-6 w-44 rounded-sm bg-surface-raised md:block" />
          <div className="shimmer h-11 w-full rounded-full bg-surface-raised md:mt-6 md:h-9 md:rounded-md" />
          <div className="mt-5 flex flex-col gap-2 md:mt-6">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex justify-between gap-4">
                <div className="shimmer h-4 w-20 rounded-sm bg-surface-raised" />
                <div className="shimmer h-5 w-16 rounded-sm bg-surface-raised" />
              </div>
            ))}
            <div className="mt-3 flex justify-between gap-4">
              <div className="shimmer h-5 w-16 rounded-sm bg-surface-raised" />
              <div className="shimmer h-5 w-24 rounded-sm bg-surface-raised" />
            </div>
          </div>
          <div className="shimmer mt-5 h-11 w-full rounded-full bg-surface-raised md:mt-4 md:h-10 md:rounded-default" />
        </div>
      </div>
    </div>
  )
}
