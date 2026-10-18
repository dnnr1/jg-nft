import type { Nft } from '@/modules/catalog/types'

import { nftFixtures } from './fixtures/nfts'
import { publishNftUpdated } from './realtime-bus'

/**
 * Estado mutável do catálogo simulado.
 *
 * As fixtures continuam sendo o cenário inicial, mas o que a API REST e os
 * eventos de tempo real devolvem vem daqui: uma mudança de preço ou de
 * disponibilidade feita por um cenário precisa aparecer nas duas vias.
 */
function clone(nft: Nft): Nft {
  return {
    ...nft,
    creator: { ...nft.creator },
    edition: { ...nft.edition },
    categories: [...nft.categories],
    images: [...nft.images],
    attributes: nft.attributes ? [...nft.attributes] : undefined,
    reviews: nft.reviews
      ? { ...nft.reviews, items: nft.reviews.items.map((item) => ({ ...item })) }
      : undefined,
  }
}

const seed: Nft[] = nftFixtures.map(clone)

let catalog: Nft[] = seed.map(clone)

export function readNfts(): readonly Nft[] {
  return catalog
}

/** Mesma ordem das fixtures, com o índice estável usado na ordenação. */
export function readIndexedNfts(): Array<Nft & { index: number }> {
  return catalog.map((nft, index) => ({ ...nft, index }))
}

export function readNft(id: string): Nft | null {
  return catalog.find((nft) => nft.id === id) ?? null
}

/** Campos que o enunciado permite alterar em tempo real. */
export interface NftUpdate {
  price?: string
  available?: number
  editable?: boolean
}

/**
 * Aplica uma mudança no catálogo, incrementa a versão do recurso e publica o
 * evento `nft.updated`. A resposta REST passa a devolver o mesmo dado.
 */
export function updateNft(id: string, patch: NftUpdate): Nft {
  const current = readNft(id)
  if (!current) {
    throw new Error(`NFT inexistente no cenário simulado: ${id}`)
  }

  const next: Nft = {
    ...current,
    ...patch,
    // Um novo preço empurra o anterior para a coluna de preço riscado, o mesmo
    // comportamento do catálogo para promoções.
    previousPrice:
      patch.price && patch.price !== current.price
        ? current.price
        : current.previousPrice,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  }

  catalog = catalog.map((nft) => (nft.id === id ? next : nft))
  publishNftUpdated(next)
  return next
}

/** Restaura o cenário conhecido (usado por testes e pelo reset de demonstração). */
export function resetNfts(): void {
  catalog = seed.map(clone)
}
