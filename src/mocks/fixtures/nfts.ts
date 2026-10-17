import type { Nft } from '@/modules/catalog/types'
import {
  CATALOG_NETWORKS,
  CATEGORIES,
  type CatalogNetwork,
} from '@/modules/catalog/search-params'
import { pick } from '@/lib/utils'

const COLLECTIONS = [
  'Kurio Editions',
  'Kurio Apes',
  'Kurio Nomads',
  'Kurio Signals',
  'Kurio Blooms',
] as const

const CREATORS = [
  { id: 'creator-ana', name: 'Ana Vaz' },
  { id: 'creator-bruno', name: 'Bruno Sato' },
  { id: 'creator-clara', name: 'Clara Mendes' },
  { id: 'creator-diego', name: 'Diego Ruiz' },
  { id: 'creator-elisa', name: 'Elisa Kim' },
] as const

const NAME_ADJECTIVES = [
  'Amber',
  'Crimson',
  'Onyx',
  'Jade',
  'Cobalt',
  'Solar',
  'Lunar',
  'Neon',
  'Ruby',
  'Teal',
  'Obsidian',
  'Copper',
] as const

const NAME_NOUNS = [
  'Echo',
  'Drift',
  'Pulse',
  'Warden',
  'Orbit',
  'Beast',
  'Vessel',
  'Bloom',
  'Circuit',
  'Mirage',
  'Prism',
  'Sonar',
] as const

const IMAGE_FILES = [
  'golden-signal-160.png',
  'sage-nomad-009.png',
  'golden-frequency-071.png',
  'violet-nomad-314.png',
] as const

function formatCents(cents: number): string {
  const whole = Math.floor(cents / 100)
  const fraction = cents % 100
  return `${whole}.${String(fraction).padStart(2, '0')}`
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function createdAt(index: number): string {
  const date = new Date(
    Date.UTC(2026, 7, 1 + ((index * 3 + 2) % 28), index % 24, (index * 7) % 60),
  )
  return date.toISOString()
}

function buildNft(
  index: number,
  seed: {
    name: string
    priceCents: number
    previousPriceCents?: number
    collection: string
  },
): Nft {
  const id = slugify(seed.name)
  const category = pick(CATEGORIES, index)
  const network: CatalogNetwork = pick(CATALOG_NETWORKS, index)
  const creator = pick(CREATORS, index)
  const editionTotals = [1, 10, 25, 50] as const
  const total = pick(editionTotals, index)
  const soldOut = index % 13 === 5
  const available = soldOut ? 0 : Math.max(1, total - ((index * 3) % total))
  const imageFile =
    IMAGE_FILES.find((file) => file.replace('.png', '') === id) ??
    pick(IMAGE_FILES, index)
  const image = `/assets/nft/${imageFile}`

  return {
    id,
    name: seed.name,
    collection: seed.collection,
    creator: { id: creator.id, name: creator.name },
    edition: { current: 1, total },
    price: formatCents(seed.priceCents),
    previousPrice: seed.previousPriceCents
      ? formatCents(seed.previousPriceCents)
      : undefined,
    network,
    categories: [category],
    image,
    images: [image],
    description: `Peça da coleção ${seed.collection}, criada por ${creator.name}. Edição verificada com procedência on-chain.`,
    editable: index % 9 !== 0,
    available,
    favoritesCount: (index * 11) % 240,
    version: 1,
    updatedAt: createdAt(index),
    createdAt: createdAt(index),
  }
}

function buildCatalog(): Nft[] {
  const heroSeeds: Array<{
    name: string
    priceCents: number
    previousPriceCents?: number
    collection: string
  }> = [
    { name: 'Emerald Ape #042', priceCents: 119, collection: 'Kurio Apes' },
    { name: 'Sage Nomad #009', priceCents: 169, collection: 'Kurio Nomads' },
    {
      name: 'Neon Vessel #552',
      priceCents: 199,
      previousPriceCents: 229,
      collection: 'Kurio Editions',
    },
    { name: 'Cosmic Bloom #118', priceCents: 129, collection: 'Kurio Blooms' },
    { name: 'Violet Nomad #314', priceCents: 139, collection: 'Kurio Nomads' },
    { name: 'Ivory Baron #088', priceCents: 179, collection: 'Kurio Editions' },
    { name: 'Golden Beat #207', priceCents: 99, collection: 'Kurio Signals' },
    { name: 'Golden Signal #160', priceCents: 39, collection: 'Kurio Signals' },
    { name: 'Golden Frequency #071', priceCents: 245, collection: 'Kurio Editions' },
  ]

  const nfts: Nft[] = heroSeeds.map((seed, index) => buildNft(index, seed))

  for (let i = 0; nfts.length < 36; i++) {
    const index = nfts.length
    const adjective = pick(NAME_ADJECTIVES, i)
    const noun = pick(NAME_NOUNS, i)
    const number = String(((i * 7) % 900) + 100).padStart(3, '0')
    const priceCents = ((i * 137 + 41) % 1229) + 2
    const withPriceDrop = i % 7 === 3 && priceCents + 55 <= 1230

    nfts.push(
      buildNft(index, {
        name: `${adjective} ${noun} #${number}`,
        priceCents,
        previousPriceCents: withPriceDrop ? priceCents + 55 : undefined,
        collection: pick(COLLECTIONS, i),
      }),
    )
  }

  return nfts
}

export const nftFixtures: Nft[] = buildCatalog()
