import type { Profile } from '@/modules/profile/types'

const STORAGE_KEY = 'kurio.accounts.v1'

/** Sal fixo apenas da simulação: mantém o hash determinístico para a demo. */
const PASSWORD_SALT = 'kurio-demo'

const SEED_AT = '2026-08-01T12:00:00.000Z'

/**
 * Hash FNV-1a da senha com sal. É um recurso didático da simulação: nenhuma
 * senha é guardada em claro, e a comparação acontece sempre por hash.
 */
export function hashPassword(password: string): string {
  const input = `${PASSWORD_SALT}:${password}`
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `fnv1a$${(hash >>> 0).toString(16).padStart(8, '0')}`
}

export interface AccountRecord {
  id: string
  /** Nome da conta, exibido no cabeçalho do site. */
  name: string
  email: string
  passwordHash: string
  profile: Omit<Profile, 'id' | 'email'>
}

interface AccountState {
  accounts: AccountRecord[]
}

export class AccountError extends Error {
  readonly status: number
  readonly code: string
  /** Campo do formulário apontado pelo erro. */
  readonly field: string | null

  constructor(
    status: number,
    code: string,
    message: string,
    field: string | null = null,
  ) {
    super(message)
    this.name = 'AccountError'
    this.status = status
    this.code = code
    this.field = field
  }
}

function seedState(): AccountState {
  return {
    accounts: [
      {
        id: 'usr_test123',
        name: 'Daniel Roberto',
        email: 'test123@gmail.com',
        passwordHash: hashPassword('12345678'),
        profile: {
          displayName: 'Daniel Roberto',
          username: 'daniel.rbrt',
          ensName: 'danielrbrt',
          ensDomain: '.eth',
          walletNickname: 'Principal',
          avatarUrl: null,
        },
      },
      {
        id: 'usr_demo456',
        name: 'Marina Alvez',
        email: 'marina@kurio.xyz',
        passwordHash: hashPassword('kurio1234'),
        profile: {
          displayName: 'Marina Alvez',
          username: 'marina.alvz',
          ensName: 'marinaalvz',
          ensDomain: '.eth',
          walletNickname: 'Carteira principal',
          avatarUrl: null,
        },
      },
    ],
  }
}

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function loadState(): AccountState {
  const store = storage()
  if (!store) return seedState()
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw) as Partial<AccountState>
    if (!Array.isArray(parsed.accounts) || parsed.accounts.length === 0) {
      return seedState()
    }
    return { accounts: parsed.accounts as AccountRecord[] }
  } catch {
    return seedState()
  }
}

let state: AccountState = loadState()

function persist(): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Persistência é best-effort: as contas seguem válidas em memória.
  }
}

function findById(id: string): AccountRecord | undefined {
  return state.accounts.find((account) => account.id === id)
}

function requireAccount(id: string): AccountRecord {
  const account = findById(id)
  if (!account) {
    throw new AccountError(404, 'NOT_FOUND', 'Conta não encontrada')
  }
  return account
}

/** Usado para validar o token da sessão simulada. */
export function hasAccount(id: string): boolean {
  return findById(id) !== undefined
}

/** Autentica por e-mail e senha. Erros de credencial não revelam qual campo falhou. */
export function authenticateAccount(
  email: string,
  password: string,
): AccountRecord {
  const account = state.accounts.find(
    (item) => item.email === email.trim().toLowerCase(),
  )
  if (!account || account.passwordHash !== hashPassword(password)) {
    throw new AccountError(
      401,
      'INVALID_CREDENTIALS',
      'E-mail ou senha incorretos',
    )
  }
  return account
}

export function emailInUse(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  return state.accounts.some((account) => account.email === normalized)
}

export function registerAccount(input: {
  name: string
  email: string
  password: string
}): AccountRecord {
  const email = input.email.trim().toLowerCase()
  if (emailInUse(email)) {
    throw new AccountError(
      409,
      'EMAIL_IN_USE',
      'Este e-mail já está cadastrado',
      'email',
    )
  }

  const identifier = hashPassword(email).slice(-6)
  const account: AccountRecord = {
    id: `usr_${identifier}`,
    name: input.name.trim(),
    email,
    passwordHash: hashPassword(input.password),
    profile: {
      displayName: input.name.trim(),
      username: input.name.trim().toLowerCase().replace(/\s+/g, '.'),
      ensName: input.name.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
      ensDomain: '.eth',
      walletNickname: 'Principal',
      avatarUrl: null,
    },
  }
  state = { accounts: [...state.accounts, account] }
  persist()
  return account
}

function toProfile(account: AccountRecord): Profile {
  return { id: account.id, email: account.email, ...account.profile }
}

export function readProfile(accountId: string): Profile {
  return toProfile(requireAccount(accountId))
}

export interface ProfilePatch {
  displayName?: unknown
  username?: unknown
  email?: unknown
  ensName?: unknown
  ensDomain?: unknown
  walletNickname?: unknown
  avatarUrl?: unknown
}

function requiredText(
  value: unknown,
  field: string,
  label: string,
  min = 1,
): string {
  if (typeof value !== 'string' || value.trim().length < min) {
    throw new AccountError(
      422,
      'VALIDATION_ERROR',
      min > 1
        ? `Informe ${label} (mínimo de ${min} caracteres).`
        : `Informe ${label}.`,
      field,
    )
  }
  return value.trim()
}

/**
 * Atualiza os dados do perfil. Nome de usuário e e-mail são únicos entre as
 * contas — reutilizá-los gera conflito (409) apontando o campo.
 */
export function updateProfile(
  accountId: string,
  patch: ProfilePatch,
): { profile: Profile; user: { id: string; name: string; email: string } } {
  const account = requireAccount(accountId)

  const displayName = requiredText(
    patch.displayName,
    'displayName',
    'o nome de exibição',
    2,
  )
  const username = requiredText(patch.username, 'username', 'o nome de usuário')
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    throw new AccountError(
      422,
      'VALIDATION_ERROR',
      'Use apenas letras, números, ponto, hífen ou sublinhado.',
      'username',
    )
  }
  const email = requiredText(patch.email, 'email', 'o e-mail').toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AccountError(
      422,
      'VALIDATION_ERROR',
      'Informe um e-mail válido.',
      'email',
    )
  }
  const ensName = requiredText(patch.ensName, 'ensName', 'o nome ENS')
  const ensDomain = requiredText(patch.ensDomain, 'ensDomain', 'o domínio ENS')
  const walletNickname = requiredText(
    patch.walletNickname,
    'walletNickname',
    'o apelido da carteira',
    2,
  )

  if (
    state.accounts.some(
      (item) => item.id !== accountId && item.profile.username === username,
    )
  ) {
    throw new AccountError(
      409,
      'USERNAME_IN_USE',
      'Este nome de usuário já está em uso',
      'username',
    )
  }
  if (state.accounts.some((item) => item.id !== accountId && item.email === email)) {
    throw new AccountError(
      409,
      'EMAIL_IN_USE',
      'Este e-mail já está cadastrado',
      'email',
    )
  }

  const avatarUrl =
    typeof patch.avatarUrl === 'string' && patch.avatarUrl.length > 0
      ? patch.avatarUrl
      : null

  const next: AccountRecord = {
    ...account,
    name: displayName,
    email,
    profile: {
      displayName,
      username,
      ensName,
      ensDomain,
      walletNickname,
      avatarUrl,
    },
  }

  state = {
    accounts: state.accounts.map((item) =>
      item.id === accountId ? next : item,
    ),
  }
  persist()

  return {
    profile: toProfile(next),
    user: { id: next.id, name: next.name, email: next.email },
  }
}

export function changePassword(
  accountId: string,
  currentPassword: string,
  newPassword: string,
): void {
  const account = requireAccount(accountId)

  if (account.passwordHash !== hashPassword(currentPassword)) {
    throw new AccountError(
      422,
      'INVALID_PASSWORD',
      'A senha atual está incorreta.',
      'currentPassword',
    )
  }
  if (newPassword.length < 8) {
    throw new AccountError(
      422,
      'VALIDATION_ERROR',
      'A nova senha deve ter no mínimo 8 caracteres.',
      'newPassword',
    )
  }
  if (newPassword === currentPassword) {
    throw new AccountError(
      422,
      'VALIDATION_ERROR',
      'A nova senha deve ser diferente da atual.',
      'newPassword',
    )
  }

  state = {
    accounts: state.accounts.map((item) =>
      item.id === accountId
        ? { ...item, passwordHash: hashPassword(newPassword) }
        : item,
    ),
  }
  persist()
}

/** Restaura o cenário conhecido (usado por testes e pelo reset de demonstração). */
export function resetAccounts(): void {
  state = seedState()
  persist()
}

export const DEMO_ACCOUNT = {
  id: 'usr_test123',
  email: 'test123@gmail.com',
  password: '12345678',
  seededAt: SEED_AT,
} as const
