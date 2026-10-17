export function NftDetailSkeleton() {
  return (
    <div
      className="min-h-dvh bg-surface-raised px-4 pt-4 pb-40 md:min-h-0 md:bg-transparent md:px-0 md:pt-0 md:pb-16"
      aria-busy="true"
    >
      <p role="status" className="sr-only">
        Carregando detalhes do NFT…
      </p>

      <div className="flex flex-col gap-4 md:gap-24">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="hidden md:block">
            <div className="shimmer h-5 w-64 rounded-sm bg-surface-card" />
          </div>

          <div className="grid grid-cols-1 items-start gap-0 md:gap-8 lg:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-4 flex items-center justify-between md:hidden">
                <div className="shimmer size-8.75 rounded-[17.5px] bg-surface-card" />
                <div className="shimmer size-8.75 rounded-[17.5px] bg-surface-card" />
              </div>
              <div className="flex min-w-0 flex-col gap-4 md:flex-row md:gap-4">
                <div className="order-2 hidden shrink-0 gap-3 md:flex md:flex-col">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div
                      key={index}
                      className="shimmer size-16 rounded-xl bg-surface-card"
                    />
                  ))}
                </div>
                <div className="order-1 min-w-0 flex-1 md:order-2">
                  <div className="shimmer aspect-[1.18/1] rounded-2xl bg-surface-card md:aspect-square" />
                </div>
              </div>
            </div>

            <div className="relative z-10 -mx-4 -mt-8 rounded-t-3xl bg-surface-card px-8 py-5 md:mx-0 md:mt-0 md:rounded-none md:bg-transparent md:p-0">
              <div className="flex flex-col gap-5 md:gap-6">
                <div className="-mb-2 flex flex-col gap-3 md:mb-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="shimmer h-7 w-52 rounded-sm bg-surface-raised" />
                    <div className="shimmer h-6 w-16 rounded-full bg-surface-raised md:hidden" />
                  </div>
                  <div className="hidden flex-col gap-2 md:flex">
                    <div className="flex items-center justify-between">
                      <div className="shimmer h-6 w-24 rounded-sm bg-surface-raised" />
                      <div className="shimmer h-4 w-44 rounded-sm bg-surface-raised" />
                    </div>
                    <div className="shimmer h-px w-full bg-surface-raised" />
                  </div>
                </div>
                <div className="shimmer h-4 w-3/4 rounded-sm bg-surface-raised" />
                <div className="shimmer h-4 w-1/2 rounded-sm bg-surface-raised" />
                <div className="flex flex-wrap items-center gap-2">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div
                      key={index}
                      className="shimmer h-4 w-10 rounded-sm bg-surface-raised"
                    />
                  ))}
                </div>
                <div className="hidden items-center justify-between md:flex">
                  <div className="shimmer h-12.5 w-26 rounded-full bg-surface-raised" />
                  <div className="flex gap-2">
                    <div className="shimmer h-10 w-32 rounded-md bg-surface-raised" />
                    <div className="shimmer h-10 w-24 rounded-md bg-surface-raised" />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 2 }, (_, index) => (
                    <div
                      key={index}
                      className="shimmer h-4 w-2/3 rounded-sm bg-surface-raised"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="shimmer h-6 w-48 rounded-sm bg-surface-card" />
          <div className="shimmer h-4 w-full rounded-sm bg-surface-card" />
          <div className="shimmer h-4 w-5/6 rounded-sm bg-surface-card" />
        </div>

        <div className="flex flex-col gap-6">
          <div className="shimmer h-6 w-40 rounded-sm bg-surface-card" />
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index}>
                <div className="shimmer aspect-square rounded-2xl bg-surface-card" />
                <div className="shimmer mt-3 h-5 w-4/5 rounded-md bg-surface-card" />
                <div className="shimmer mt-2 h-4 w-1/2 rounded-md bg-surface-card" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
