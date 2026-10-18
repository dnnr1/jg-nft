/** Espelha a altura dos blocos do cadastro de carteira. */
export function WalletsSkeleton() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Carregando suas carteiras…
      </p>

      <div className="shimmer h-7 w-56 rounded-sm bg-surface-raised" />
      <div className="shimmer mt-3 h-4 w-full max-w-md rounded-sm bg-surface-raised" />

      <div className="mt-5 grid gap-x-5 gap-y-5 sm:grid-cols-2">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="shimmer h-3 w-28 rounded-sm bg-surface-raised" />
            <div className="shimmer h-9 w-full rounded-[10px] bg-surface-raised" />
          </div>
        ))}
      </div>

      <div className="shimmer mt-6 h-10 w-full rounded-full bg-surface-raised md:w-40 md:rounded-default" />

      <div className="mt-12 border-t border-border pt-8">
        <div className="shimmer h-6 w-48 rounded-sm bg-surface-raised" />
        <div className="shimmer mt-4 h-4 w-72 rounded-sm bg-surface-raised" />
      </div>
    </div>
  )
}
