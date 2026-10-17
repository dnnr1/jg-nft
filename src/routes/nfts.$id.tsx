import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nfts/$id')({
  component: NftDetailPage,
})

function NftDetailPage() {
  return null
}
