import { Link } from '@tanstack/react-router'

import type { Nft } from '../types'

interface CatalogItemProps {
  nft: Nft
}

export function CatalogItem({ nft }: CatalogItemProps) {
  return (
    <Link
      to="/nfts/$id"
      params={{ id: nft.id }}
      aria-label={`Ver ${nft.name}`}
      className="block"
    >
      <div className="rounded-xl bg-surface-card px-1 pt-5 pb-3 md:rounded-none md:px-0 md:pt-7.75 md:pb-4.75">
        <img
          src={nft.image}
          alt={`${nft.name}, coleção ${nft.collection}`}
          width={360}
          height={360}
          loading="lazy"
          className="aspect-square w-full rounded-[15px] object-cover"
        />
      </div>
      <div className="mt-2 md:mt-3">
        <h3 className="text-body text-foreground">{nft.name}</h3>
        <p className="text-body-lg-bold">
          <span className="inline-flex flex-wrap items-center gap-3">
            <span className="text-text-accent">{nft.price} ETH</span>
            {nft.previousPrice ? (
              <span className="text-text-secondary">
                {nft.previousPrice} ETH
              </span>
            ) : null}
          </span>
        </p>
      </div>
    </Link>
  )
}

export function CatalogItemSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="shimmer aspect-square rounded-lg bg-surface-raised" />
      <div className="shimmer mt-3 h-5 w-4/5 rounded-md bg-surface-raised" />
      <div className="shimmer mt-2 h-4 w-3/4 rounded-md bg-surface-raised" />
      <div className="shimmer mt-2 h-4 w-1/2 rounded-md bg-surface-raised" />
    </div>
  )
}
