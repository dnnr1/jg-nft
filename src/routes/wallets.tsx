import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { ErrorState } from '@/components/common/error-state'
import { AccountSidebar } from '@/components/layout/account-sidebar'
import { useRequireSession } from '@/modules/auth/use-require-session'
import { PrimaryWalletSection } from '@/modules/wallets/components/primary-wallet-section'
import { SecondaryWalletSection } from '@/modules/wallets/components/secondary-wallet-section'
import { WalletsSkeleton } from '@/modules/wallets/components/wallets-skeleton'
import { walletsQuery } from '@/modules/wallets/queries'

export const Route = createFileRoute('/wallets')({
  head: () => ({
    meta: [{ title: 'Carteiras — Kurio' }],
  }),
  component: WalletsPage,
})

function WalletsPage() {
  const { isAllowed } = useRequireSession()
  const walletsResult = useQuery({
    ...walletsQuery(),
    enabled: isAllowed,
  })

  const wallets = walletsResult.data?.items ?? []
  const primary = wallets.find((wallet) => wallet.primary) ?? null

  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-12">
      <AccountSidebar />

      <div className="flex min-w-0 flex-col">
        {walletsResult.isPending || !isAllowed ? (
          <WalletsSkeleton />
        ) : walletsResult.isError || !walletsResult.data ? (
          <ErrorState
            title="Não foi possível carregar suas carteiras"
            description="Verifique sua conexão e tente novamente."
            onRetry={() => void walletsResult.refetch()}
          />
        ) : (
          <>
            <PrimaryWalletSection wallets={wallets} />
            <SecondaryWalletSection wallets={wallets} primary={primary} />
          </>
        )}
      </div>
    </div>
  )
}
