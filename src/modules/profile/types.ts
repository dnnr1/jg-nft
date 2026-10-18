import { z } from 'zod'

export const profileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.string(),
  ensName: z.string(),
  ensDomain: z.string(),
  walletNickname: z.string(),
  /** Data URL do avatar escolhido, ou `null` quando não há imagem. */
  avatarUrl: z.string().nullable(),
})

export type Profile = z.infer<typeof profileSchema>

const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})

export const profileResponseSchema = z.object({ profile: profileSchema })

/** O perfil salvo também atualiza o nome exibido na sessão. */
export const profileUpdateResponseSchema = z.object({
  profile: profileSchema,
  user: sessionUserSchema,
})

export const passwordResponseSchema = z.object({ ok: z.boolean() })

export type ProfileUpdateInput = Pick<
  Profile,
  | 'displayName'
  | 'username'
  | 'email'
  | 'ensName'
  | 'ensDomain'
  | 'walletNickname'
  | 'avatarUrl'
>

export interface PasswordChangeInput {
  currentPassword: string
  newPassword: string
}
