import { cn } from 'cn'

function ControlSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="shimmer h-3 w-28 rounded-sm bg-surface-raised" />
      <div className="shimmer h-9 w-full rounded-[10px] bg-surface-raised" />
    </div>
  )
}

/** Espelha a altura dos blocos do perfil para evitar deslocamento de layout. */
export function ProfileSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-8">
      <p role="status" className="sr-only">
        Carregando seus dados…
      </p>

      <section>
        <div className="shimmer h-4 w-40 rounded-sm bg-surface-raised" />

        <div className={cn('mt-5 grid gap-x-5 gap-y-5 sm:grid-cols-2')}>
          {Array.from({ length: 5 }, (_, index) => (
            <ControlSkeleton key={index} />
          ))}
        </div>

        <div className="mt-6 flex items-center gap-5">
          <div className="shimmer size-16 shrink-0 rounded-full bg-surface-raised" />
          <div className="shimmer h-8 w-44 rounded-sm bg-surface-raised" />
        </div>
      </section>

      <section className="border-t border-border pt-8">
        <div className="shimmer h-4 w-32 rounded-sm bg-surface-raised" />
        <div className="mt-5 grid gap-x-5 gap-y-5 sm:grid-cols-2">
          {Array.from({ length: 3 }, (_, index) => (
            <ControlSkeleton key={index} />
          ))}
        </div>
      </section>

      <div className="border-t border-border pt-6">
        <div className="shimmer h-10 w-full rounded-full bg-surface-raised md:w-28 md:rounded-default" />
      </div>
    </div>
  )
}
