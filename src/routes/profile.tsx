import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { ErrorState } from '@/components/common/error-state'
import { AccountSidebar } from '@/components/layout/account-sidebar'
import { apiErrorStatus } from '@/lib/api'
import { useAuth } from '@/modules/auth/auth-context'
import { useRequireSession } from '@/modules/auth/use-require-session'
import { ProfileForm } from '@/modules/profile/components/profile-form'
import { ProfileSkeleton } from '@/modules/profile/components/profile-skeleton'
import { profileQuery } from '@/modules/profile/queries'

export const Route = createFileRoute('/profile')({
  head: () => ({
    meta: [{ title: 'Perfil do colecionador — Kurio' }],
  }),
  component: ProfilePage,
})

function ProfilePage() {
  const { isAllowed } = useRequireSession()
  const { logout, openAuthDialog } = useAuth()
  const profileResult = useQuery({
    ...profileQuery(),
    enabled: isAllowed,
  })

  const unauthorized =
    profileResult.isError && apiErrorStatus(profileResult.error) === 401

  // Sessão expirada: encerra a sessão local e pede o login novamente — a
  // guarda devolve o colecionador ao perfil depois de entrar.
  useEffect(() => {
    if (!unauthorized) return
    logout()
    openAuthDialog('login')
  }, [unauthorized, logout, openAuthDialog])

  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-12">
      <AccountSidebar />

      <div className="flex min-w-0 flex-col gap-6">
        <h1 className="text-h1 text-foreground">Perfil do colecionador</h1>

        {profileResult.isPending || !isAllowed ? (
          <ProfileSkeleton />
        ) : profileResult.isError || !profileResult.data ? (
          <ErrorState
            title="Não foi possível carregar seu perfil"
            description="Verifique sua conexão e tente novamente."
            onRetry={() => void profileResult.refetch()}
          />
        ) : (
          <ProfileForm profile={profileResult.data} />
        )}
      </div>
    </div>
  )
}
