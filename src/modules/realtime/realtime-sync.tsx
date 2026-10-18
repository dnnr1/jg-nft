import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'

import { createRealtimeClient } from '@/lib/realtime'
import { useAuth } from '@/modules/auth/auth-context'

import { createRealtimeApplier, reconcileLiveQueries } from './apply'
import { parseRealtimeMessage } from './messages'

/**
 * Mantém a conexão de tempo real viva durante a sessão.
 *
 * Ciclo de vida: a conexão (e o controle de versões aplicadas) nasce e morre com
 * a sessão, de modo que eventos de uma sessão anterior nunca atualizam dados de
 * outra conta. Ao reconectar, as leituras "vivas" são reconciliadas com a API
 * REST, porque eventos emitidos enquanto o socket estava fora se perdem.
 *
 * Sem sessão a conexão continua aberta para os eventos públicos do catálogo — o
 * carrinho de um visitante também reage a mudanças de preço.
 */
export function RealtimeSync(): null {
  const queryClient = useQueryClient()
  const { isReady, user } = useAuth()
  const userId = user?.id ?? null

  useEffect(() => {
    if (!isReady) return

    const applier = createRealtimeApplier(queryClient)
    /** Eventos perdidos durante a queda: reconciliar ao reconectar. */
    let needsReconciliation = false
    let socket: Socket | null = null
    let disposed = false

    const handleConnect = () => {
      if (!needsReconciliation) return
      needsReconciliation = false
      void reconcileLiveQueries(queryClient)
    }

    const handleDisconnect = () => {
      needsReconciliation = true
    }

    const handleNftUpdated = (raw: unknown) => {
      const message = parseRealtimeMessage(raw)
      if (message?.event === 'nft.updated') applier.applyNft(message)
    }

    const handleOrderUpdated = (raw: unknown) => {
      const message = parseRealtimeMessage(raw)
      if (message?.event === 'order.updated') {
        applier.applyOrder(message, userId)
      }
    }

    void (async () => {
      const client = await createRealtimeClient({ token: userId })
      if (disposed) {
        client.disconnect()
        return
      }

      socket = client
      client.on('connect', handleConnect)
      client.on('disconnect', handleDisconnect)
      client.on('nft.updated', handleNftUpdated)
      client.on('order.updated', handleOrderUpdated)
      client.connect()
    })().catch((error: unknown) => {
      // O app continua funcionando sem tempo real: a leitura REST segue valendo.
      console.warn('Não foi possível iniciar o cliente de tempo real', error)
    })

    return () => {
      disposed = true
      applier.reset()
      if (!socket) return
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [isReady, userId, queryClient])

  return null
}
