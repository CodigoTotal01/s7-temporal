import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import PusherClient from 'pusher-js'
import PusherServer from 'pusher'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const extractUUIDFromString = (url: string) => {
  return url.match(
    /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i
  )
}

export const pusherServer = new PusherServer({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: process.env.NEXT_PUBLIC_PUSHER_APP_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTOR,
  useTLS: true,
})

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTOR,
  }
)

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