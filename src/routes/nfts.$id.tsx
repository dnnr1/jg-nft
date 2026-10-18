import { useCallback, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { Toast, type ToastTone } from '@/components/common/toast'
import { Button } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/api'
import { useAddCartItem } from '@/modules/cart/mutations'
import { NftGallery } from '@/modules/nft-detail/components/nft-gallery'
import { NftInfoPanel } from '@/modules/nft-detail/components/nft-info-panel'
import { NftTabs } from '@/modules/nft-detail/components/nft-tabs'
import { NftRecommendations } from '@/modules/nft-detail/components/nft-recommendations'
import { NftDetailSkeleton } from '@/modules/nft-detail/components/nft-detail-skeleton'
import { PurchaseBar } from '@/modules/nft-detail/components/purchase-bar'
import {
  collectionRecommendationsQuery,
  nftDetailQuery,
} from '@/modules/nft-detail/queries'
import {
  DEFAULT_QTY,
  detailSearchSchema,
  resolveDetailSearch,
  type DetailUrlSearch,
} from '@/modules/nft-detail/search-params'

export const Route = createFileRoute('/nfts/$id')({
  validateSearch: (search: Record<string, unknown>) =>
    detailSearchSchema.parse(search),
  head: () => ({
    meta: [{ title: 'Detalhes do NFT — Kurio' }],
  }),
  component: NftDetailPage,
})

function isNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

function NftDetailPage() {
  const { id } = Route.useParams()
  const rawSearch = Route.useSearch()
  const navigate = useNavigate()
  const { qty } = resolveDetailSearch(rawSearch)

  const detailQuery = useQuery(nftDetailQuery(id))
  const recommendationsQuery = useQuery(
    collectionRecommendationsQuery(id, detailQuery.data?.collection),
  )
  const addToCart = useAddCartItem()
  const [toast, setToast] = useState<{
    tone: ToastTone
    message: string
  } | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const changeQty = useCallback(
    (next: number) => {
      void navigate({
        to: '.',
        replace: true,
        resetScroll: false,
        search: (previous: DetailUrlSearch) => ({
          ...previous,
          qty: next === DEFAULT_QTY ? undefined : next,
        }),
      })
    },
    [navigate],
  )

  if (detailQuery.isPending) {
    return <NftDetailSkeleton />
  }

  if (detailQuery.isError) {
    if (isNotFoundError(detailQuery.error)) {
      return (
        <div className="p-8 text-center">
          <h1 className="text-h1 font-bold text-foreground">
            NFT não encontrado
          </h1>
          <p className="text-body my-4 text-text-secondary">
            Este item saiu do catálogo ou o endereço está incorreto.
          </p>
          <Link
            to="/"
            className="inline-block rounded border border-primary bg-primary/20 px-4 py-2 text-tiny text-primary transition-colors hover:bg-primary/30"
          >
            Voltar ao catálogo
          </Link>
        </div>
      )
    }
    return (
      <div role="alert" className="p-8 text-center">
        <h1 className="text-h2 font-bold text-foreground">
          Não foi possível carregar este NFT
        </h1>
        <p className="text-body my-4 text-text-secondary">
          Verifique sua conexão e tente novamente.
        </p>
        <Button onClick={() => void detailQuery.refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  const nft = detailQuery.data
  const displayQty = Math.min(qty, Math.max(1, nft.available))

  const buyNft = () => {
    setToast({ tone: 'pending', message: 'Adicionando ao carrinho…' })
    addToCart.mutate(
      { nft, quantity: displayQty },
      {
        onSuccess: (_, variables) =>
          setToast({
            tone: 'success',
            message: `${nft.name} adicionado ao carrinho (${variables.quantity} ${
              variables.quantity === 1 ? 'edição' : 'edições'
            }).`,
          }),
        onError: (error) =>
          setToast({
            tone: 'error',
            message: apiErrorMessage(
              error,
              'Não foi possível adicionar ao carrinho.',
            ),
          }),
      },
    )
  }

  return (
    <div className="min-h-dvh bg-surface-raised px-4 pt-4 pb-40 md:min-h-0 md:bg-transparent md:px-0 md:pt-0 md:pb-16">
      <div className="flex flex-col gap-4 md:gap-24">
        <div className="flex flex-col gap-4 md:gap-6">
          <nav
            aria-label="Caminho de navegação"
            className="hidden items-center gap-2 text-[15px] font-bold text-foreground md:flex"
          >
            <Link
              to="/"
              className="transition-colors hover:text-primary"
            >
              Início
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              to="/"
              hash="catalogo"
              className="transition-colors hover:text-primary"
            >
              Mercado
            </Link>
            <span aria-hidden="true">/</span>
            <span>{nft.name}</span>
          </nav>

          <div className="grid grid-cols-1 items-start gap-0 md:gap-8 lg:grid-cols-2">
            <NftGallery nft={nft} />
            <NftInfoPanel
              nft={nft}
              qty={qty}
              onQtyChange={changeQty}
              onBuy={buyNft}
              buyPending={addToCart.isPending}
            />
          </div>
        </div>

        <NftTabs nft={nft} />
        <NftRecommendations query={recommendationsQuery} currentId={nft.id} />
      </div>

      <PurchaseBar
        nft={nft}
        qty={qty}
        onQtyChange={changeQty}
        onBuy={buyNft}
        buyPending={addToCart.isPending}
      />

      {toast ? (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onClose={closeToast}
        />
      ) : null}

      <span role="status" className="sr-only">
        {`Quantidade selecionada: ${displayQty}. Estoque disponível: ${nft.available}. ${nft.price} ETH.`}
      </span>
    </div>
  )
}
