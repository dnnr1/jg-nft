/**
 * Esqueleto do recibo: preserva a largura e a altura do cartão de confirmação
 * para evitar deslocamento de layout enquanto o pedido carrega.
 */
export function OrderConfirmationSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto w-full max-w-md">
      <p role="status" className="sr-only">
        Carregando a confirmação do pedido…
      </p>

      <div className="overflow-hidden border border-border bg-surface-card shadow-card">
        <div className="px-4 pt-5 pb-3 md:px-6">
          <div className="shimmer mx-auto h-11 w-12 rounded-sm bg-surface-raised" />
          <div className="shimmer mx-auto mt-3 h-4 w-56 rounded-sm bg-surface-raised" />
        </div>

        <div className="grid grid-cols-2 gap-y-3 border-y-2 border-primary px-4 py-3 md:grid-cols-4 md:px-6">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className={index === 0 ? 'pr-3' : 'border-l border-primary pl-3 md:pr-3'}
            >
              <div className="shimmer h-2.5 w-16 rounded-sm bg-surface-raised" />
              <div className="shimmer mt-1.5 h-3.5 w-20 rounded-sm bg-surface-raised" />
            </div>
          ))}
        </div>

        <div className="px-4 pt-4 md:px-6">
          <div className="shimmer h-3.5 w-40 rounded-sm bg-surface-raised" />

          <div className="mt-3 flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <div className="shimmer size-12 shrink-0 rounded-sm bg-surface-raised" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="shimmer h-3.5 w-32 rounded-sm bg-surface-raised" />
                  <div className="shimmer h-2.5 w-20 rounded-sm bg-surface-raised" />
                </div>
                <div className="shimmer h-3.5 w-16 rounded-sm bg-surface-raised" />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col items-end gap-2">
            <div className="shimmer h-3 w-40 rounded-sm bg-surface-raised" />
            <div className="shimmer h-3.5 w-32 rounded-sm bg-surface-raised" />
          </div>

          <div className="shimmer mx-auto mt-4 h-9 w-40 rounded-default bg-surface-raised" />
        </div>

        <div className="mt-8 h-1 w-full bg-primary" />
      </div>
    </div>
  )
}
