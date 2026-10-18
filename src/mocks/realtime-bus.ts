import type { Nft } from '@/modules/catalog/types'
import type { Order } from '@/modules/orders/types'
import type {
  NftUpdatedMessage,
  OrderUpdatedMessage,
  RealtimeMessage,
} from '@/modules/realtime/messages'

/**
 * Barramento de eventos do servidor simulado.
 *
 * Os stores de mocks publicam aqui sempre que mudam dados, e o handler de
 * Socket.IO (`./socket.ts`) reenvia o evento para os sockets conectados. Assim
 * a mesma mudança aparece nas respostas REST e nos eventos, sem que existam
 * duas fontes de verdade.
 */
type RealtimeListener = (message: RealtimeMessage) => void

const listeners = new Set<RealtimeListener>()

/** Assina o barramento; o retorno remove a assinatura. */
export function subscribeRealtime(listener: RealtimeListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function publishRealtime(message: RealtimeMessage): void {
  for (const listener of [...listeners]) {
    listener(message)
  }
}

export function publishNftUpdated(nft: Nft): NftUpdatedMessage {
  const message: NftUpdatedMessage = {
    event: 'nft.updated',
    resource: 'nft',
    id: nft.id,
    version: nft.version,
    emittedAt: new Date().toISOString(),
    payload: nft,
  }
  publishRealtime(message)
  return message
}

export function publishOrderUpdated(
  order: Order,
  ownerId: string,
): OrderUpdatedMessage {
  const message: OrderUpdatedMessage = {
    event: 'order.updated',
    resource: 'order',
    id: order.id,
    version: order.version,
    ownerId,
    emittedAt: new Date().toISOString(),
    payload: order,
  }
  publishRealtime(message)
  return message
}

/** Quantidade de assinantes ativos (usada pelas verificações de contrato). */
export function realtimeListenerCount(): number {
  return listeners.size
}

/**
 * Remove todas as assinaturas. Faz parte do reset de demonstração: sem isso um
 * socket descartado continuaria recebendo eventos.
 */
export function resetRealtime(): void {
  listeners.clear()
}
