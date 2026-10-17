import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import { cn } from 'cn'
import { Input } from '@/components/ui/input'

interface SearchFieldProps {
  value: string
  onCommit: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
}

const COMMIT_DELAY_MS = 350

export function SearchField({
  value,
  onCommit,
  placeholder = 'Buscar NFTs',
  label = 'Buscar NFTs',
  className,
}: SearchFieldProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onCommit(draft.trim()), COMMIT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [draft, value, onCommit])

  return (
    <form
      role="search"
      className={cn('flex min-w-0 flex-1', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onCommit(draft.trim())
      }}
    >
      <span className="relative min-w-0 flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-sand"
        />
        <Input
          type="search"
          aria-label={label}
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="h-11.25 border-none pl-10 text-body-bold text-sand placeholder:text-sand"
        />
      </span>
    </form>
  )
}
