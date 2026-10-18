import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})

export type User = z.infer<typeof userSchema>

export const authResponseSchema = z.object({
  user: userSchema,
})

export type AuthResponse = z.infer<typeof authResponseSchema>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail')
  .regex(EMAIL_PATTERN, 'E-mail inválido')

const passwordSchema = z
  .string()
  .min(1, 'Informe sua senha')
  .min(8, 'A senha deve ter no mínimo 8 caracteres')

export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export type LoginInput = z.infer<typeof loginFormSchema>

export const signupFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'O nome de usuário deve ter no mínimo 3 caracteres'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type SignupInput = z.infer<typeof signupFormSchema>
