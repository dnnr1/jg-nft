import { io, type Socket } from 'socket.io-client'

export function createRealtimeClient(
  url: string = import.meta.env.VITE_SOCKET_URL,
): Socket {
  return io(url, { autoConnect: false })
}
