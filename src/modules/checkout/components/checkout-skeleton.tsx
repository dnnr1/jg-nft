import { cn } from 'cn'

function ControlSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="shimmer h-3 w-28 rounded-sm bg-surface-raised" />
      <div className="shimmer h-9 w-full rounded-[10px] bg-surface-raised" />
    </div>
  )
}

export function CheckoutSkeleton() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Carregando o pagamento…
      </p>

      <div
        className={cn(
          'hidden gap-5 md:grid md:grid-cols-1 md:gap-10',
          'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_354px] lg:gap-5',
        )}
      >
        <div className="lg:col-span-2">
          <div className="shimmer h-4 w-52 rounded-sm bg-surface-raised" />
          <div className="mt-5 grid gap-x-5 gap-y-5 sm:grid-cols-2">
            {Array.from({ length: 10 }, (_, index) => (
              <ControlSkeleton key={index} />
            ))}
          </div>
          <div className="shimmer mt-5 h-34 w-full rounded-[10px] bg-surface-raised" />
        </div>

        <div>
          <div className="shimmer h-5 w-28 rounded-sm bg-surface-raised" />
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-md bg-surface-card p-3"
              >
                <div className="shimmer size-14 shrink-0 rounded-md bg-surface-raised" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="shimmer h-4 w-32 rounded-sm bg-surface-raised" />
                  <div className="shimmer h-3 w-24 rounded-sm bg-surface-raised" />
                </div>
                <div className="shimmer h-4 w-14 rounded-sm bg-surface-raised" />
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex justify-between gap-4">
                <div className="shimmer h-4 w-24 rounded-sm bg-surface-raised" />
                <div className="shimmer h-5 w-16 rounded-sm bg-surface-raised" />
              </div>
            ))}
          </div>
          <div className="shimmer mt-6 h-4 w-32 rounded-sm bg-surface-raised" />
          <div className="mt-3 flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="shimmer h-11 w-full rounded-[10px] bg-surface-raised"
              />
            ))}
          </div>
          <div className="shimmer mt-5 h-9 w-full rounded-default bg-surface-raised" />
        </div>
      </div>

      <div className="flex flex-col gap-6 md:hidden">
        <div className="flex justify-between">
          <div className="shimmer h-4 w-36 rounded-sm bg-surface-raised" />
          <div className="shimmer h-4 w-24 rounded-sm bg-surface-raised" />
        </div>
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="shimmer h-20 w-full rounded-lg bg-surface-raised"
          />
        ))}
        <div className="shimmer h-4 w-32 rounded-sm bg-surface-raised" />
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="shimmer h-13 w-full rounded-[10px] bg-surface-raised"
          />
        ))}
        <div className="shimmer ml-auto h-5 w-32 rounded-sm bg-surface-raised" />
        <div className="shimmer h-13 w-full rounded-full bg-surface-raised" />
      </div>
    </div>
  )
}
