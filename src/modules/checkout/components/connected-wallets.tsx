import type { DropdownMenuItem } from '@/components/common/dropdown-menu'
import { DropdownMenu } from '@/components/common/dropdown-menu'
import { RadioCircle } from '@/components/common/radio-option'
import { cn } from 'cn'
import {
  WALLET_NETWORK_LABELS,
  walletDisplayAddress,
  type Wallet,
} from '@/modules/wallets/types'

interface WalletCardProps {
  wallet: Wallet
  selected: boolean
  pending: boolean
  onSelect: (id: string) => void
  onSetPrimary: (id: string) => void
  onToggleConnection: (id: string, connected: boolean) => void
}

function WalletCard({
  wallet,
  selected,
  pending,
  onSelect,
  onSetPrimary,
  onToggleConnection,
}: WalletCardProps) {
  const inputId = `connected-${wallet.id}`
  const labelId = `${inputId}-label`

  const items: DropdownMenuItem[] = [
    {
      label: 'Definir como principal',
      disabled: wallet.primary,
      onSelect: () => onSetPrimary(wallet.id),
    },
    {
      label: wallet.connected ? 'Desconectar' : 'Conectar',
      onSelect: () => onToggleConnection(wallet.id, !wallet.connected),
    },
  ]

  return (
    <li>
      <div
        className={cn(
          'relative flex items-center gap-4 rounded-lg bg-surface-card px-4 py-3.5 transition-opacity',
          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ink',
          pending && 'opacity-70',
        )}
      >
        <RadioCircle checked={selected} />

        <div className="min-w-0 flex-1">
          <p id={labelId} className="text-body-bold text-foreground">
            {wallet.label}
          </p>
          <p className="text-caption text-text-secondary">
            {walletDisplayAddress(wallet)}
          </p>
          <p className="text-caption text-text-secondary">
            {WALLET_NETWORK_LABELS[wallet.network]}
          </p>
        </div>

        <DropdownMenu
          label={`Ações de ${wallet.label}`}
          items={items}
          className="relative z-10"
        />

        <input
          id={inputId}
          type="radio"
          name="connected-wallet"
          value={wallet.id}
          checked={selected}
          onChange={() => onSelect(wallet.id)}
          aria-labelledby={labelId}
          className="sr-only"
        />
        <label
          htmlFor={inputId}
          aria-hidden="true"
          className="absolute inset-0 cursor-pointer rounded-lg"
        />
      </div>
    </li>
  )
}

interface ConnectedWalletsProps {
  wallets: Wallet[]
  selectedId: string | null
  onSelect: (id: string) => void
  onSetPrimary: (id: string) => void
  onToggleConnection: (id: string, connected: boolean) => void
  onSwap: () => void
  pendingId?: string | null
  error?: string | null
}

export function ConnectedWallets({
  wallets,
  selectedId,
  onSelect,
  onSetPrimary,
  onToggleConnection,
  onSwap,
  pendingId,
  error,
}: ConnectedWalletsProps) {
  const hasConnection = wallets.some((wallet) => wallet.connected)

  return (
    <section aria-labelledby="connected-wallets-heading">
      <div className="flex items-center justify-between gap-4">
        <h2
          id="connected-wallets-heading"
          className="text-body-bold text-foreground"
        >
          Carteira conectada
        </h2>
        <button
          type="button"
          onClick={onSwap}
          disabled={wallets.length < 2}
          className="text-tiny text-text-accent transition-colors hover:text-primary-light disabled:opacity-40"
        >
          Trocar carteira
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-tiny text-coral">
          {error}
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-3">
        {wallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            selected={wallet.id === selectedId}
            pending={pendingId === wallet.id}
            onSelect={onSelect}
            onSetPrimary={onSetPrimary}
            onToggleConnection={onToggleConnection}
          />
        ))}
      </ul>

      {hasConnection ? null : (
        <p role="status" className="mt-3 text-tiny text-coral">
          Nenhuma carteira conectada. Conecte uma carteira para pagar.
        </p>
      )}
    </section>
  )
}
