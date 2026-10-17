import { useState } from 'react'

import { cn } from 'cn'

interface DualRangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onValueChange: (value: [number, number]) => void
  minLabel: string
  maxLabel: string
}

const THUMB_CLASSES = [
  '[&::-webkit-slider-thumb]:pointer-events-auto',
  '[&::-webkit-slider-thumb]:h-[21px]',
  '[&::-webkit-slider-thumb]:w-[21px]',
  '[&::-webkit-slider-thumb]:appearance-none',
  '[&::-webkit-slider-thumb]:rounded-full',
  '[&::-webkit-slider-thumb]:border-[3px]',
  '[&::-webkit-slider-thumb]:border-ink',
  '[&::-webkit-slider-thumb]:bg-primary',
  '[&::-moz-range-thumb]:pointer-events-auto',
  '[&::-moz-range-thumb]:h-[21px]',
  '[&::-moz-range-thumb]:w-[21px]',
  '[&::-moz-range-thumb]:appearance-none',
  '[&::-moz-range-thumb]:rounded-full',
  '[&::-moz-range-thumb]:border-[3px]',
  '[&::-moz-range-thumb]:border-ink',
  '[&::-moz-range-thumb]:bg-primary',
].join(' ')

export function DualRangeSlider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  minLabel,
  maxLabel,
}: DualRangeSliderProps) {
  const [active, setActive] = useState<'min' | 'max' | null>(null)
  const [low, high] = value

  return (
    <div className="relative flex h-5.25 items-center">
      <div className="absolute inset-x-0 h-1 rounded-full bg-primary" />
      <input
        type="range"
        aria-label={minLabel}
        min={min}
        max={max}
        step={step}
        value={low}
        onChange={(event) => {
          const next = Math.min(Number(event.target.value), high - step)
          onValueChange([next, high])
        }}
        onFocus={() => setActive('min')}
        onBlur={() => setActive(null)}
        onPointerDown={() => setActive('min')}
        onPointerUp={() => setActive(null)}
        className={cn(
          'pointer-events-none absolute inset-x-0 h-1.75 w-full appearance-none bg-transparent outline-none',
          THUMB_CLASSES,
          active === 'min' ? 'z-30' : 'z-10',
        )}
      />
      <input
        type="range"
        aria-label={maxLabel}
        min={min}
        max={max}
        step={step}
        value={high}
        onChange={(event) => {
          const next = Math.max(Number(event.target.value), low + step)
          onValueChange([low, next])
        }}
        onFocus={() => setActive('max')}
        onBlur={() => setActive(null)}
        onPointerDown={() => setActive('max')}
        onPointerUp={() => setActive(null)}
        className={cn(
          'pointer-events-none absolute inset-x-0 h-1.75 w-full appearance-none bg-transparent outline-none',
          THUMB_CLASSES,
          active === 'max' ? 'z-30' : 'z-20',
        )}
      />
    </div>
  )
}
