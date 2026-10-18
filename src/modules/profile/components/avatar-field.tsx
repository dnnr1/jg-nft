import { useRef, useState, type ChangeEvent } from 'react'

import { Button } from '@/components/ui/button'
import { nameInitials } from '@/lib/initials'

import { MAX_AVATAR_BYTES, PROFILE_FIELD_IDS } from '../constants'

interface AvatarFieldProps {
  /** Nome usado nas iniciais enquanto não há imagem. */
  name: string
  avatarUrl: string | null
  disabled?: boolean
  onChange: (avatarUrl: string | null) => void
}

const MAX_AVATAR_MB = Math.round(MAX_AVATAR_BYTES / (1024 * 1024))

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}

/**
 * Avatar do colecionador: a imagem escolhida é enviada junto do formulário,
 * então fica pendente até o "Salvar" (e pode ser removida antes disso).
 */
export function AvatarField({
  name,
  avatarUrl,
  disabled,
  onChange,
}: AvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Limpa o valor para permitir escolher o mesmo arquivo novamente.
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Escolha um arquivo de imagem.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError(`A imagem deve ter no máximo ${MAX_AVATAR_MB} MB.`)
      return
    }

    try {
      const dataUrl = await readAsDataUrl(file)
      setError(null)
      onChange(dataUrl)
    } catch {
      setError('Não foi possível ler a imagem.')
    }
  }

  return (
    <div>
      <p className="text-caption text-foreground">Avatar</p>

      <div className="mt-3 flex flex-wrap items-center gap-5">
        <span className="grid size-16 shrink-0 place-content-center overflow-hidden rounded-full bg-brand-gradient text-body-lg-bold text-ink">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            nameInitials(name)
          )}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            Alterar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || !avatarUrl}
            onClick={() => {
              setError(null)
              onChange(null)
            }}
          >
            Remover
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        id={PROFILE_FIELD_IDS.avatar}
        name="avatar"
        type="file"
        accept="image/*"
        tabIndex={-1}
        disabled={disabled}
        onChange={handleFile}
        className="sr-only"
      />

      {error ? (
        <p role="alert" className="text-tiny mt-2 text-coral">
          {error}
        </p>
      ) : null}
    </div>
  )
}
