import { RadioOption } from '@/components/common/radio-option'
import { cn } from 'cn'
import {
  BROWSER_WALLET_CHIPS,
  DESKTOP_WALLET_PROVIDERS,
  MOBILE_WALLET_PROVIDERS,
  WALLET_PROVIDER_LABELS,
  type WalletProviderId,
} from '../constants'

/** Avatar do provedor: monograma ou marca do Coinbase, como na referência. */
function ProviderAvatar({ id }: { id: WalletProviderId }) {
  if (id === 'coinbase') {
    return (
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-[6px] border border-border-soft text-sand"
      >
        <span className="size-2.5 rounded-[2px] border-2 border-current" />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className="text-tiny-bold flex size-6 shrink-0 items-center justify-center rounded-full border border-border-soft text-sand"
    >
      {id === 'metamask' ? 'M' : 'W'}
    </span>
  )
}

function ProviderContent({
  id,
  variant,
}: {
  id: WalletProviderId
  variant: WalletProvidersVariant
}) {
  const label = WALLET_PROVIDER_LABELS[id]

  if (variant === 'surface') {
    return (
      <span className="flex items-center gap-3">
        <ProviderAvatar id={id} />
        <span className="text-body text-foreground">{label}</span>
      </span>
    )
  }

  if (id === 'browser') {
    return (
      <span className="flex items-center">
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className="text-micro inline-flex items-center rounded-full border border-border-soft px-2.5 py-1 font-bold tracking-[0.08em] text-sand"
        >
          {BROWSER_WALLET_CHIPS.join(' · ')}
        </span>
      </span>
    )
  }

  return <span className="text-body text-foreground">{label}</span>
}

type WalletProvidersVariant = 'outline' | 'surface'

interface WalletProvidersProps {
  variant: WalletProvidersVariant
  /** Nome do grupo de rádio (único por variante na página). */
  name: string
  /** Prefixo dos ids dos inputs. */
  idPrefix: string
  value: WalletProviderId | null
  onChange: (id: WalletProviderId) => void
  className?: string
}

export function WalletProviders({
  variant,
  name,
  idPrefix,
  value,
  onChange,
  className,
}: WalletProvidersProps) {
  const providers =
    variant === 'outline' ? DESKTOP_WALLET_PROVIDERS : MOBILE_WALLET_PROVIDERS

  return (
    <div
      role="radiogroup"
      aria-label="Carteira e rede"
      className={cn('flex flex-col gap-3', className)}
    >
      {providers.map((id) => (
        <RadioOption
          key={id}
          id={`${idPrefix}-${id}`}
          name={name}
          value={id}
          checked={value === id}
          onChange={() => onChange(id)}
          tone={variant}
          inputPosition={variant === 'surface' ? 'end' : 'start'}
        >
          <ProviderContent id={id} variant={variant} />
        </RadioOption>
      ))}
    </div>
  )
}
