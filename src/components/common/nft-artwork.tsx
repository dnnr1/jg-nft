import { useState } from 'react'

import { cn, pick } from '@/lib/utils'

const PALETTES: ReadonlyArray<[string, string]> = [
  ['#d28a4c', '#3d2010'],
  ['#e3a44e', '#4a2513'],
  ['#b39463', '#3a2412'],
  ['#ea6b4f', '#421a10'],
  ['#e89b55', '#402414'],
  ['#c47b3e', '#331a0c'],
  ['#8a5a2e', '#2a160b'],
  ['#a06b3c', '#302010'],
]

function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

interface NftArtworkProps {
  seed: string
  image?: string
  className?: string
  label?: string
}

export function NftArtwork({ seed, image, className, label }: NftArtworkProps) {
  const [failed, setFailed] = useState(false)
  const [from, to] = pick(PALETTES, hashSeed(seed))

  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('relative overflow-hidden', className)}
      style={{
        backgroundImage: `linear-gradient(135deg, ${from} 0%, ${to} 65%, #140d0a 100%)`,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute -right-1/4 -top-1/4 size-2/3 rounded-full"
        style={{
          backgroundImage: `radial-gradient(circle, ${from}66, transparent 70%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-8 -left-8 size-1/2 rounded-full border border-foreground/10"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-1/4 right-1/4 size-1/5 rotate-45 border border-foreground/15"
      />
      {image && !failed ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </div>
  )
}
