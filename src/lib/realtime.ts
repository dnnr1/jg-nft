import type { Socket } from 'socket.io-client'

export interface RealtimeClientOptions {
  /** URL do servidor simulado; padrão `VITE_SOCKET_URL`. */
  url?: string
  /** Token da sessão simulada, enviado no handshake (`?token=<userId>`). */
  token?: string | null
}

/**
 * Cria o cliente Socket.IO da aplicação.
 *
 * É assíncrono de propósito: o `socket.io-client` precisa ser importado **depois**
 * que o MSW aplicou o patch no `WebSocket` global. O `engine.io-client` guarda
 * `const WebSocketCtor = globalThis.WebSocket` no topo do módulo, então uma
 * importação estática capturaria o `WebSocket` nativo antes do mock e o app
 * falaria com o servidor de verdade. Por isso a importação é dinâmica (e
 * `import type` acima não conta: ele é apagado na compilação).
 *
 * Limitações do ambiente simulado (ver `ARCHITECTURE.md`):
 * - o MSW intercepta apenas o transporte WebSocket, então o transporte é fixado
 *   em `websocket` (o upgrade a partir de `polling` não é simulado);
 * - a autenticação viaja na query do handshake, porque o pacote `CONNECT` do
 *   Socket.IO não passa pelo decodificador de eventos do binding;
 * - não há namespaces, salas nem acknowledgements.
 */
export async function createRealtimeClient(
  options: RealtimeClientOptions = {},
): Promise<Socket> {
  const { io } = await import('socket.io-client')
  const url = options.url ?? import.meta.env.VITE_SOCKET_URL
  const token = options.token ?? null

  return io(url, {
    autoConnect: false,
    transports: ['websocket'],
    query: token ? { token } : {},
    /** Falha de handshake sem mock ativo não deve travar a reconexão. */
    timeout: 5_000,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4_000,
  })
}
