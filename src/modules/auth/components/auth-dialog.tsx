import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Eye, EyeOff, X } from 'lucide-react'
import { z } from 'zod'

import { useDialogBehavior } from '@/components/common/dialog-behavior'
import { useToast } from '@/components/common/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from 'cn'

import { useAuth } from '../auth-context'
import {
  loginFormSchema,
  signupFormSchema,
  type LoginInput,
  type SignupInput,
} from '../types'
import { FacebookBrandIcon, GoogleIcon } from './social-icons'

const SOCIAL_UNAVAILABLE_ID = 'auth-social-unavailable'

const FIELD_CLASSES =
  'h-12 rounded-sm border-border-soft bg-transparent px-4 text-body-sm placeholder:text-text-secondary md:h-10'

function collectFieldErrors(
  schema: z.ZodType,
  values: unknown,
): Record<string, string> {
  const result = schema.safeParse(values)
  const errors: Record<string, string> = {}
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && errors[key] === undefined) {
        errors[key] = issue.message
      }
    }
  }
  return errors
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-caption text-error">
      {message}
    </p>
  )
}

function TextField({
  id,
  label,
  error,
  ...props
}: Omit<React.ComponentProps<'input'>, 'id'> & {
  id: string
  label: string
  error?: string
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={FIELD_CLASSES}
        {...props}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

function PasswordField({
  id,
  label,
  error,
  ...props
}: Omit<React.ComponentProps<'input'>, 'id' | 'type'> & {
  id: string
  label: string
  error?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(FIELD_CLASSES, 'pr-12')}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-controls={id}
          aria-pressed={visible}
          disabled={props.disabled}
          className="absolute inset-y-0 right-1 flex w-10 items-center justify-center text-text-secondary transition-colors hover:text-foreground"
        >
          {visible ? (
            <Eye className="size-5" aria-hidden="true" />
          ) : (
            <EyeOff className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

// Credenciais da conta mockada para facilitar a demonstração.
const MOCK_CREDENTIALS = {
  email: 'test123@gmail.com',
  password: '12345678',
} as const

function LoginForm() {
  const { login, closeAuthDialog } = useAuth()
  const { showToast } = useToast()
  const [values, setValues] = useState<LoginInput>({
    email: MOCK_CREDENTIALS.email,
    password: MOCK_CREDENTIALS.password,
  })
  const [errors, setErrors] = useState<Partial<Record<'email' | 'password', string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function updateValue(field: keyof LoginInput, value: string) {
    const next = { ...values, [field]: value }
    setValues(next)
    if (submitted) setErrors(collectFieldErrors(loginFormSchema, next))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    const fieldErrors = collectFieldErrors(loginFormSchema, values)
    setErrors(fieldErrors)
    if (fieldErrors.email || fieldErrors.password) return

    setPending(true)
    setFormError(null)
    try {
      await login(values)
      showToast('Logado com sucesso')
      closeAuthDialog()
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Não foi possível entrar. Tente novamente.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Formulário de login"
      aria-busy={pending}
      className="grid gap-3"
    >
      <TextField
        id="login-email"
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        value={values.email}
        onChange={(event) => updateValue('email', event.target.value)}
        error={errors.email}
        disabled={pending}
      />
      <PasswordField
        id="login-password"
        label="Senha"
        name="password"
        autoComplete="current-password"
        placeholder="Senha"
        value={values.password}
        onChange={(event) => updateValue('password', event.target.value)}
        error={errors.password}
        disabled={pending}
      />
      <button
        type="button"
        disabled
        aria-describedby={SOCIAL_UNAVAILABLE_ID}
        className="justify-self-end text-caption text-text-accent"
      >
        Esqueceu a senha?
      </button>
      {formError ? (
        <p role="alert" className="text-caption text-error">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="mt-3 h-14 w-full md:h-11">
        {pending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}

function SignupForm() {
  const { signup, closeAuthDialog } = useAuth()
  const { showToast } = useToast()
  const [values, setValues] = useState<SignupInput>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<
    Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>
  >({})
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function updateValue(field: keyof SignupInput, value: string) {
    const next = { ...values, [field]: value }
    setValues(next)
    if (submitted) setErrors(collectFieldErrors(signupFormSchema, next))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    const fieldErrors = collectFieldErrors(signupFormSchema, values)
    setErrors(fieldErrors)
    if (
      fieldErrors.name ||
      fieldErrors.email ||
      fieldErrors.password ||
      fieldErrors.confirmPassword
    ) {
      return
    }

    setPending(true)
    setFormError(null)
    try {
      await signup(values)
      showToast('Conta criada com sucesso')
      closeAuthDialog()
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar a conta. Tente novamente.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Formulário de cadastro"
      aria-busy={pending}
      className="grid gap-3"
    >
      <TextField
        id="signup-name"
        label="Nome de usuário"
        name="name"
        type="text"
        autoComplete="username"
        placeholder="Nome de usuário"
        value={values.name}
        onChange={(event) => updateValue('name', event.target.value)}
        error={errors.name}
        disabled={pending}
      />
      <TextField
        id="signup-email"
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        value={values.email}
        onChange={(event) => updateValue('email', event.target.value)}
        error={errors.email}
        disabled={pending}
      />
      <PasswordField
        id="signup-password"
        label="Senha"
        name="password"
        autoComplete="new-password"
        placeholder="Senha"
        value={values.password}
        onChange={(event) => updateValue('password', event.target.value)}
        error={errors.password}
        disabled={pending}
      />
      <PasswordField
        id="signup-confirm-password"
        label="Confirmar senha"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Confirmar senha"
        value={values.confirmPassword}
        onChange={(event) => updateValue('confirmPassword', event.target.value)}
        error={errors.confirmPassword}
        disabled={pending}
      />
      {formError ? (
        <p role="alert" className="text-caption text-error">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="mt-3 h-14 w-full md:h-11">
        {pending ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'cursor-pointer text-title transition-colors',
        active ? 'text-text-accent' : 'text-foreground hover:text-text-accent',
      )}
    >
      {children}
    </button>
  )
}

export function AuthDialog() {
  const { dialogOpen, dialogMode, setDialogMode, closeAuthDialog } = useAuth()
  const panelRef = useDialogBehavior({ open: dialogOpen, onClose: closeAuthDialog })

  if (!dialogOpen) return null

  const isLogin = dialogMode === 'login'

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={closeAuthDialog}
        className="absolute inset-0 animate-in cursor-default bg-black/70 outline-none fade-in duration-150"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={isLogin ? 'Entrar na plataforma' : 'Criar conta'}
        tabIndex={-1}
        className="absolute inset-0 flex h-dvh w-full animate-in flex-col overflow-y-auto rounded-none border-b-4 border-primary bg-ink px-6 pt-14 pb-10 outline-none fade-in duration-150 md:inset-auto md:top-20 md:left-1/2 md:h-auto md:max-h-[calc(100dvh-6rem)] md:w-125 md:max-w-[calc(100vw-2rem)] md:-translate-x-1/2 md:zoom-in-95 md:bg-surface-card md:px-20 md:py-12 md:shadow-card"
      >
        <button
          type="button"
          onClick={closeAuthDialog}
          aria-label="Fechar"
          className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-sm text-foreground transition-colors hover:bg-surface-raised"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <Link
          to="/"
          className="mx-auto mb-6 text-display-2 font-bold tracking-[1.4px] text-foreground md:hidden"
        >
          KURIO
        </Link>

        <div className="mb-5 flex items-center justify-center gap-2 md:mb-6">
          <TabButton active={isLogin} onClick={() => setDialogMode('login')}>
            Entrar
          </TabButton>
          <span aria-hidden="true" className="text-foreground/40">
            |
          </span>
          <TabButton active={!isLogin} onClick={() => setDialogMode('signup')}>
            Criar conta
          </TabButton>
          <h2 className="sr-only">
            {isLogin ? 'Entrar na plataforma' : 'Criar conta'}
          </h2>
        </div>

        <p className="mb-6 text-center text-caption leading-5 text-text-secondary">
          {isLogin
            ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
            : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
        </p>

        {isLogin ? <LoginForm /> : <SignupForm />}

        <span id={SOCIAL_UNAVAILABLE_ID} className="sr-only">
          Indisponível nesta demonstração.
        </span>
        <div className="mt-6">
          <div className="flex items-center gap-3 text-caption text-text-secondary">
            <span aria-hidden="true" className="h-px flex-1 bg-border-soft" />
            Ou continue com
            <span aria-hidden="true" className="h-px flex-1 bg-border-soft" />
          </div>
          <div className="mt-4 grid gap-3">
            <Button
              type="button"
              variant="outline"
              disabled
              aria-describedby={SOCIAL_UNAVAILABLE_ID}
              className="w-full gap-2 text-caption text-text-secondary"
            >
              <GoogleIcon className="size-4" />
              Continuar com Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled
              aria-describedby={SOCIAL_UNAVAILABLE_ID}
              className="w-full gap-2 text-caption text-text-secondary"
            >
              <FacebookBrandIcon className="size-4" />
              Continuar com Facebook
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
