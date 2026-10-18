import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import { formatEth, parseEth } from '@/lib/eth'

import { hasAccount } from './account-store'
import { readCart } from './cart-store'
import { readNft, readNfts, updateNft } from './nft-store'
import { subscribeRealtime } from './realtime-bus'
import { claimScenario, hasScenario, scenarioDelayMs } from './scenarios'

/**
 * Servidor Socket.IO simulado.
 *
 * O transporte é interceptado pelo MSW (`ws.link`) e a codificação de quadros
 * do Socket.IO é feita por `@mswjs/socket.io-binding`, de modo que o app fala
 * com um cliente `socket.io-client` de verdade — não há atalho por callbacks
 * internos. Limitações do ambiente simulado:
 *
 * - apenas o transporte WebSocket é simulado; o cliente é configurado com
 *   `transports: ['websocket']` porque o upgrade a partir de `polling` não é
 *   interceptado;
 * - não há namespaces, salas, reconexão com sessão retomada nem acknowledgements;
 * - a entrega é "melhor esforço": eventos emitidos sem cliente conectado são
 *   perdidos e o cliente reconcilia por REST ao reconectar.
 */
/**
 * Endereço do servidor simulado. É o mesmo `VITE_SOCKET_URL` usado pelo cliente,
 * então o handler casa mesmo que o ambiente aponte para outra porta.
 */
const viteEnv = import.meta.env as
  | Record<string, string | undefined>
  | undefined

const SOCKET_ORIGIN = new URL(
  viteEnv?.VITE_SOCKET_URL ?? 'http://localhost:3000',
).host

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * O MSW retira o prefixo `/socket.io` do caminho antes de casar o handler
 * (conveniência para Socket.IO, ver `WebSocketHandler.parse`), então o padrão é
 * a origem — `ws://host` ou `ws://host/`. A query do handshake (que carrega o
 * token da sessão) é descartada na comparação, mas continua acessível em
 * `connection.client.url` dentro do handler.
 */
const SOCKET_LINK = new RegExp(`^wss?://${escapeRegExp(SOCKET_ORIGIN)}(/|$)`)

/** Fator aplicado ao preço no cenário `nft-price-change`. */
const PRICE_CHANGE_FACTOR = 1.15

/** Token da sessão simulada trafega na query do handshake (`?token=<id>`). */
function sessionIdOf(url: URL): string | null {
  const token = url.searchParams.get('token')
  return token && hasAccount(token) ? token : null
}

/**
 * Aplica o cenário de catálogo escolhido por ambiente. Alvo: o primeiro item do
 * carrinho (o que o usuário está revisando) ou, sem carrinho, o primeiro item
 * do catálogo.
 */
function applyNftScenario(): void {
  const wantsPriceChange = hasScenario('nft-price-change')
  const wantsSoldOut = hasScenario('nft-sold-out')
  if (!wantsPriceChange && !wantsSoldOut) return

  const target =
    readCart().items[0]?.id ?? readNfts()[0]?.id ?? readNft('')?.id ?? null
  if (!target) return

  // O efeito vale uma vez por sessão de mocks: reconexões do cliente não
  // reaplicam a alta de preço sobre o valor já corrigido.
  if (!claimScenario(wantsSoldOut ? 'nft-sold-out' : 'nft-price-change')) return

  if (wantsSoldOut) {
    updateNft(target, { available: 0 })
    return
  }

  const current = readNft(target)
  if (!current) return
  updateNft(target, {
    price: formatEth(
      Math.round(parseEth(current.price) * PRICE_CHANGE_FACTOR),
      { maxDecimals: 2, minDecimals: 2 },
    ),
  })
}

export const socketHandlers = [
  ws.link(SOCKET_LINK).addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const sessionId = sessionIdOf(connection.client.url)

    // Repassa ao cliente apenas o que a sessão pode ver: eventos públicos
    // sempre, eventos privados só quando o dono é a mesma sessão.
    const unsubscribe = subscribeRealtime((message) => {
      if (message.event === 'order.updated' && message.ownerId !== sessionId) {
        return
      }
      io.client.emit(message.event, message)
    })

    const timer =
      hasScenario('nft-price-change') || hasScenario('nft-sold-out')
        ? setTimeout(applyNftScenario, scenarioDelayMs())
        : null

    // Ciclo de vida: ao fechar, a assinatura e os timers pendentes morrem com a
    // conexão — a mesma limpeza que o cliente faz ao trocar de sessão.
    connection.client.addEventListener('close', () => {
      unsubscribe()
      if (timer) clearTimeout(timer)
    })
  }),
]
