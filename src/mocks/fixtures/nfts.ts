import type { Nft, NftReviewItem } from '@/modules/catalog/types'
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

const EDITION_TOTALS = [1, 10, 25, 50] as const

interface NftSeed {
  name: string
  priceCents: number
  previousPriceCents?: number
  collection: string
  network?: CatalogNetwork
  edition?: { current: number; total: number }
  available?: number
  editable?: boolean
  rarity?: 'RARO' | 'COMUM' | 'ÚNICO'
  attributes?: Array<{ trait: string; value: string }>
  reviews?: NftReviewItem[]
}

function review(
  id: string,
  author: string,
  rating: number,
  comment: string,
  day: number,
): NftReviewItem {
  return {
    id,
    author,
    rating,
    comment,
    date: `2026-09-${String(day).padStart(2, '0')}T12:00:00.000Z`,
  }
}

const heroSeeds: NftSeed[] = [
  {
    name: 'Emerald Ape #042',
    priceCents: 119,
    collection: 'Kurio Apes',
    edition: { current: 1, total: 25 },
    available: 25,
    editable: true,
    reviews: [
      review('rev-emerald-1', 'Ana Vaz', 5, 'Peça impecável, com rastreio completo da edição.', 12),
      review('rev-emerald-2', 'Bruno Sato', 4, 'Chega rápido e a arte é ainda melhor ao vivo.', 14),
    ],
  },
  {
    name: 'Sage Nomad #009',
    priceCents: 169,
    collection: 'Kurio Nomads',
    reviews: [
      review('rev-sage-1', 'Clara Mendes', 5, 'Minha peça favorita da coleção, detalhes incríveis.', 12),
      review('rev-sage-2', 'Diego Ruiz', 5, 'Vale cada fração de ETH. Recomendo demais.', 15),
    ],
  },
  {
    name: 'Neon Vessel #552',
    priceCents: 199,
    previousPriceCents: 229,
    collection: 'Kurio Editions',
    reviews: [
      review('rev-neon-1', 'Elisa Kim', 4, 'Cores vibrantes e procedência verificada.', 13),
      review('rev-neon-2', 'Ana Vaz', 3, 'Bonita, mas esperava mais variedade na galeria.', 16),
    ],
  },
  { name: 'Cosmic Bloom #118', priceCents: 129, collection: 'Kurio Blooms' },
  {
    name: 'Violet Nomad #314',
    priceCents: 139,
    collection: 'Kurio Nomads',
    edition: { current: 1, total: 50 },
    available: 50,
  },
  {
    name: 'Ivory Baron #088',
    priceCents: 179,
    collection: 'Kurio Editions',
    edition: { current: 1, total: 50 },
    available: 50,
  },
  { name: 'Golden Beat #207', priceCents: 99, collection: 'Kurio Signals' },
  { name: 'Golden Signal #160', priceCents: 39, collection: 'Kurio Signals' },
  { name: 'Golden Frequency #071', priceCents: 245, collection: 'Kurio Editions' },
  {
    name: 'Teal Motion #062',
    priceCents: 45,
    collection: 'Kurio Editions',
    network: 'solana',
    edition: { current: 13, total: 50 },
    available: 3,
    rarity: 'COMUM',
    attributes: [
      { trait: 'Paleta', value: 'Coral' },
      { trait: 'Elemento', value: 'Fluido' },
    ],
    reviews: [
      review('rev-teal-1', 'Ana Vaz', 5, 'Movimento e cor em equilíbrio perfeito. Compra certeira.', 12),
      review('rev-teal-2', 'Bruno Sato', 2, 'A arte é bonita, mas a paleta não me convenceu.', 17),
    ],
  },
]

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

function tokenIdOf(name: string): string {
  const digits = name.match(/#(\d+)/)?.[1] ?? '0'
  return `#${digits.padStart(4, '0')}`
}

function attributesOf(name: string): Array<{ trait: string; value: string }> {
  const [adjective = '', noun = ''] = name.split(' ')
  return [
    { trait: 'Paleta', value: adjective },
    { trait: 'Elemento', value: noun },
  ]
}

function galleryOf(id: string, index: number): string[] {
  const ownFile = IMAGE_FILES.find((file) => file.replace('.png', '') === id)
  const ordered = ownFile
    ? [ownFile, ...IMAGE_FILES.filter((file) => file !== ownFile)]
    : [
        ...IMAGE_FILES.slice(index % IMAGE_FILES.length),
        ...IMAGE_FILES.slice(0, index % IMAGE_FILES.length),
      ]
  return ordered.map((file) => `/assets/nft/${file}`)
}

function averageOf(items: NftReviewItem[]): number {
  if (items.length === 0) return 0
  return items.reduce((sum, item) => sum + item.rating, 0) / items.length
}

function buildNft(index: number, seed: NftSeed): Nft {
  const id = slugify(seed.name)
  const category = pick(CATEGORIES, index)
  const network: CatalogNetwork = seed.network ?? pick(CATALOG_NETWORKS, index)
  const creator = pick(CREATORS, index)
  const total = seed.edition?.total ?? pick(EDITION_TOTALS, index)
  const current = seed.edition?.current ?? 1
  const soldOut = seed.available === 0 || (seed.available === undefined && index % 13 === 5)
  const available =
    seed.available ??
    (soldOut ? 0 : Math.max(1, total - ((index * 3) % total)))
  const images = galleryOf(id, index)
  const reviews = seed.reviews
    ? {
        average: averageOf(seed.reviews),
        count: seed.reviews.length,
        items: seed.reviews,
      }
    : undefined

  return {
    id,
    name: seed.name,
    collection: seed.collection,
    creator: { id: creator.id, name: creator.name },
    edition: { current, total },
    price: formatCents(seed.priceCents),
    previousPrice: seed.previousPriceCents
      ? formatCents(seed.previousPriceCents)
      : undefined,
    network,
    categories: [category],
    image: images[0] ?? `/assets/nft/${pick(IMAGE_FILES, index)}`,
    images,
    description: `Peça da coleção ${seed.collection}, criada por ${creator.name}. Edição verificada com procedência on-chain.`,
    tokenId: tokenIdOf(seed.name),
    rarity: seed.rarity ?? (total === 1 ? 'ÚNICO' : index % 5 === 0 ? 'RARO' : 'COMUM'),
    attributes: seed.attributes ?? attributesOf(seed.name),
    details: `${seed.name} é uma obra digital da coleção ${seed.collection}. Cada atributo fica registrado nos metadados do token.\nA propriedade inclui a arte em alta resolução e acesso exclusivo para colecionadores.`,
    reviews,
    editable: seed.editable ?? index % 9 !== 0,
    available,
    favoritesCount: (index * 11) % 240,
    version: 1,
    updatedAt: createdAt(index),
    createdAt: createdAt(index),
  }
}

function buildCatalog(): Nft[] {
  const nfts: Nft[] = heroSeeds.map((seed, index) => buildNft(index, seed))

  for (let i = 0; nfts.length < 36; i++) {
    const index = nfts.length
    const adjective = pick(NAME_ADJECTIVES, i)
    const noun = pick(NAME_NOUNS, i)
    const number = String(((i * 7) % 900) + 100).padStart(3, '0')
    const priceCents = ((i * 137 + 41) % 1229) + 2
    const withPriceDrop = i % 7 === 3 && priceCents + 55 <= 1230

    const seed: NftSeed = {
      name: `${adjective} ${noun} #${number}`,
      priceCents,
      previousPriceCents: withPriceDrop ? priceCents + 55 : undefined,
      collection: pick(COLLECTIONS, i),
    }

    if (i % 5 === 0) {
      seed.reviews = [
        review(
          `rev-gen-${i}-a`,
          pick(CREATORS, i + 2).name,
          (i % 4) + 1,
          'Arte com acabamento impecável e procedência verificada.',
          (i % 26) + 2,
        ),
        review(
          `rev-gen-${i}-b`,
          pick(CREATORS, i + 4).name,
          ((i + 3) % 3) + 2,
          'Compra tranquila no marketplace. Recomendo a coleção.',
          (i % 25) + 4,
        ),
      ]
    }

    nfts.push(buildNft(index, seed))
  }

  return nfts
}

export const nftFixtures: Nft[] = buildCatalog()
