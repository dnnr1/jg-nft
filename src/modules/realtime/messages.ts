import { z } from 'zod'

import { nftSchema } from '@/modules/catalog/types'
import { orderSchema } from '@/modules/orders/types'

/**
 * Contrato dos eventos de tempo real trocados entre o servidor simulado
 * (Socket.IO interceptado pelo MSW) e o cliente.
 *
 * Cada evento carrega:
 * - `event`: nome estável do evento;
 * - `resource` + `id`: identidade estável do recurso afetado;
 * - `version`: versão monotônica do recurso. O cliente só aplica versões
 *   maiores que a última aplicada, o que torna a entrega idempotente e
 *   imune a eventos duplicados ou fora de ordem;
 * - `ownerId` (apenas eventos privados): sessão dona do recurso. Eventos de
 *   outra sessão são descartados no cliente e nunca chegam ao socket;
 * - `payload`: o recurso atualizado, exatamente como a API REST o devolve,
 *   para que as duas vias de leitura convirjam para o mesmo formato.
 */
export const realtimeEventNames = ['nft.updated', 'order.updated'] as const

export type RealtimeEventName = (typeof realtimeEventNames)[number]

const envelopeShape = {
  /** Versão monotônica do recurso no servidor simulado. */
  version: z.number().int().min(1),
  /** Momento da emissão, em ISO 8601. */
  emittedAt: z.string(),
}

/** Catálogo (lista e detalhe) e carrinho mudaram de preço/disponibilidade. */
export const nftUpdatedMessageSchema = z.object({
  event: z.literal('nft.updated'),
  resource: z.literal('nft'),
  id: z.string(),
  ...envelopeShape,
  payload: nftSchema,
})

/** Pedido mudou de situação (pendente, confirmado ou recusado). */
export const orderUpdatedMessageSchema = z.object({
  event: z.literal('order.updated'),
  resource: z.literal('order'),
  id: z.string(),
  /** Sessão dona do pedido: evento privado, nunca entregue a outra conta. */
  ownerId: z.string(),
  ...envelopeShape,
  payload: orderSchema,
})

export const realtimeMessageSchema = z.discriminatedUnion('event', [
  nftUpdatedMessageSchema,
  orderUpdatedMessageSchema,
])

export type NftUpdatedMessage = z.infer<typeof nftUpdatedMessageSchema>
export type OrderUpdatedMessage = z.infer<typeof orderUpdatedMessageSchema>
export type RealtimeMessage = z.infer<typeof realtimeMessageSchema>

/** Valida um quadro cru recebido do socket, descartando o que não casa. */
export function parseRealtimeMessage(data: unknown): RealtimeMessage | null {
  const result = realtimeMessageSchema.safeParse(data)
  return result.success ? result.data : null
}
