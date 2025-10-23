import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
// ✅ COMENTADO: Pusher (plan agotado)
// import PusherClient from 'pusher-js'
// import PusherServer from 'pusher'
// ✅ NUEVO: Socket.io
import { io, Socket } from 'socket.io-client'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const extractUUIDFromString = (url: string) => {
  return url.match(
    /[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}/i
  )
}

// ✅ COMENTADO: Pusher Server (plan agotado)
// export const pusherServer = new PusherServer({
//   appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
//   key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
//   secret: process.env.NEXT_PUBLIC_PUSHER_APP_SECRET,
//   cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTOR,
//   useTLS: true,
// })

// ✅ COMENTADO: Pusher Client (plan agotado)
// export const pusherClient = new PusherClient(
//   process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
//   {
//     cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTOR,
//   }
// )

// ✅ NUEVO: Socket.io Client
let socketClient: Socket | null = null

export const getSocketClient = () => {
  if (!socketClient) {
    // ✅ Conectar al servidor Socket.io externo
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

    socketClient = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })

    // ✅ Eventos de conexión para debugging
    socketClient.on('connect', () => {
      console.log('📡 Socket.io Client: Conectado al servidor')
    })

    socketClient.on('disconnect', () => {
      console.log('📡 Socket.io Client: Desconectado del servidor')
    })

    socketClient.on('connect_error', (error) => {
      console.error('📡 Socket.io Client: Error de conexión:', error)
    })
  }
  return socketClient
}

// ✅ NUEVO: Socket.io Server (para server actions)
export const socketServer = {
  // Simular el comportamiento de pusherServer.trigger
  trigger: async (channel: string, event: string, data: any) => {
    try {
      // ✅ Enviar mensaje al servidor Socket.io externo
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
      const response = await fetch(`${socketUrl}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: channel,
          event: event,
          data: data
        })
      })

      if (response.ok) {
        console.log(`📡 Socket.io Server: Mensaje enviado a canal ${channel}, evento ${event}`)
        return { success: true, message: 'Mensaje enviado via Socket.io' }
      } else {
        console.log(`📡 Socket.io Server: Fallback - solo logueando mensaje`)
        return { success: true, message: 'Mensaje logueado (servidor no disponible)' }
      }
    } catch (error) {
      console.log(`📡 Socket.io Server: Error al enviar mensaje:`, error)
      console.log(`📡 Socket.io Server: Fallback - solo logueando mensaje`)
      return { success: true, message: 'Mensaje logueado (error de conexión)' }
    }
  }
}

// ✅ NUEVO: Funciones de utilidad para Socket.io
export const socketClientUtils = {
  subscribe: (channel: string) => {
    const socket = getSocketClient()
    socket.emit('join-room', channel)
  },

  unsubscribe: (channel: string) => {
    const socket = getSocketClient()
    socket.emit('leave-room', channel)
  },

  bind: (event: string, callback: (data: any) => void) => {
    const socket = getSocketClient()
    socket.on(event, callback)
  },

  unbind: (event: string) => {
    const socket = getSocketClient()
    socket.off(event)
  }
}

export const postToParent = (message: string) => {
  window.parent.postMessage(message, '*')
}

export const extractURLfromString = (url: string) => {
  // Regex mejorado que excluye paréntesis, comillas y otros caracteres no deseados al final
  const urlMatch = url.match(/https?:\/\/[^\s"<>()]+/)
  if (urlMatch) {
    // Limpiar cualquier carácter no deseado al final
    return [urlMatch[0].replace(/[()]+$/, '')]
  }
  return null
}

export const extractEmailsFromString = (text: string) => {
  return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi)
}

export const getMonthName = (month: number) => {
  return month == 1
    ? 'Jan'
    : month == 2
      ? 'Feb'
      : month == 3
        ? 'Mar'
        : month == 4
          ? 'Apr'
          : month == 5
            ? 'May'
            : month == 6
              ? 'Jun'
              : month == 7
                ? 'Jul'
                : month == 8
                  ? 'Aug'
                  : month == 9
                    ? 'Sep'
                    : month == 10
                      ? 'Oct'
                      : month == 11
                        ? 'Nov'
                        : month == 12 && 'Dec'
}

// NUEVO: Función para validar si una imagen existe
export const validateImageUrl = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.error('Error validating image URL:', imageUrl, error)
    return false
  }
}