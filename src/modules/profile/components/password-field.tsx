import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Field } from '@/components/common/field'
import { Input } from '@/components/ui/input'
import { cn } from 'cn'

import { PROFILE_CONTROL } from '../constants'

interface PasswordFieldProps {
  id: string
  name: string
  label: string
  value: string
  autoComplete: string
  error?: string
  disabled?: boolean
  onChange: (value: string) => void
}

/** Campo de senha com alternância de visibilidade, como no diálogo de login. */
export function PasswordField({
  id,
  name,
  label,
  value,
  autoComplete,
  error,
  disabled,
  onChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <Field id={id} label={label} required error={error}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={cn('pr-11', PROFILE_CONTROL)}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-controls={id}
          aria-pressed={visible}
          disabled={disabled}
          className="absolute inset-y-0 right-1 flex w-9 items-center justify-center text-text-secondary transition-colors hover:text-foreground"
        >
          {visible ? (
            <Eye className="size-5" aria-hidden="true" />
          ) : (
            <EyeOff className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </Field>
  )
}
