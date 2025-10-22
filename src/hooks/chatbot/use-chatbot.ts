import { onAiChatBotAssistant, onGetCurrentChatBot } from '@/action/bot'
import { postToParent, pusherClient } from '@/lib/utils'
import {
  ChatBotMessageProps,
  ChatBotMessageSchema,
} from '@/schemas/conversation.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { UploadClient } from '@uploadcare/upload-client'
import { useForm } from 'react-hook-form'
import { useChatSession } from './use-chat-session'

const upload = new UploadClient({
  publicKey: process.env.NEXT_PUBLIC_UPLOAD_CARE_PUBLIC_KEY as string,
})

export const useChatBot = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatBotMessageProps>({
    resolver: zodResolver(ChatBotMessageSchema),
  })

  const {
    token: sessionToken,
    sessionData,
    isAuthenticated,
    saveSession,
    clearSession
  } = useChatSession()

  const [currentBot, setCurrentBot] = useState<
    | {
      name: string
      chatBot: {
        id: string
        icon: string | null
        welcomeMessage: string | null
        background: string | null
        textColor: string | null
        helpdesk: boolean
      } | null
      helpdesk: {
        id: string
        question: string
        answer: string
        domainId: string | null
      }[]
    }
    | undefined
  >()
  const messageWindowRef = useRef<HTMLDivElement | null>(null)
  const [botOpened, setBotOpened] = useState<boolean>(false)
  const onOpenChatBot = () => setBotOpened((prev) => !prev)
  const [loading, setLoading] = useState<boolean>(true)
  const [onChats, setOnChats] = useState<
    { role: 'user' | 'assistant'; content: string; link?: string }[]
  >([])
  const [onAiTyping, setOnAiTyping] = useState<boolean>(false)
  const [currentBotId, setCurrentBotId] = useState<string>()
  const [onRealTime, setOnRealTime] = useState<
    { chatroom: string; mode: boolean } | undefined
  >(undefined)

  const onScrollToBottom = () => {
    messageWindowRef.current?.scroll({
      top: messageWindowRef.current.scrollHeight,
      left: 0,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    onScrollToBottom()
  }, [onChats, messageWindowRef])

  useEffect(() => {
    postToParent(
      JSON.stringify({
        width: botOpened ? 550 : 80,
        height: botOpened ? 800 : 80,
      })
    )
  }, [botOpened])

  let limitRequest = 0

  const onGetDomainChatBot = async (idOrName: string) => {
    setCurrentBotId(idOrName)
    const chatbot = await onGetCurrentChatBot(idOrName)
    if (chatbot) {
      let welcomeMessage = chatbot.chatBot?.welcomeMessage!

      if (isAuthenticated && sessionData?.name) {
        welcomeMessage = `¡Hola de nuevo ${sessionData.name}! 👋\n${welcomeMessage}`
      }

      setOnChats((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: welcomeMessage,
        },
      ])
      setCurrentBot(chatbot)
      setLoading(false)
    } else {
      console.error('No se pudo encontrar el chatbot para:', idOrName)
    }
  }

  useEffect(() => {
    window.addEventListener('message', (e) => {
      const botid = e.data
      if (limitRequest < 1 && typeof botid == 'string') {
        onGetDomainChatBot(botid)
        limitRequest++
      }
    })
  }, [])

  const onStartChatting = handleSubmit(async (values) => {
    if (values.image && values.image.length) {
      const uploaded = await upload.uploadFile(values.image[0])
      setOnChats((prev: any) => [
        ...prev,
        {
          role: 'user',
          content: uploaded.uuid,
        },
      ])

      if (!onRealTime?.mode) {
        setOnAiTyping(true)
      }

      console.log('142')

      const response = await onAiChatBotAssistant(currentBotId!, onChats, 'user', uploaded.uuid, sessionToken || undefined)

      // ENVIAR IMAGEN DEL CLIENTE A PUSHER SI ESTÁ EN MODO LIVE
      if (response?.live && response?.chatRoom) {
        try {
          const { onRealTimeChat } = await import('@/action/conversation')
          await onRealTimeChat(
            response.chatRoom,
            uploaded.uuid,
            `user-${Date.now()}`,
            'user'
          )
        } catch (error) {
          console.error(`❌ Chatbot: Error al enviar imagen a Pusher:`, error)
        }
      }

      if (response) {
        if (!onRealTime?.mode) {
          setOnAiTyping(false)
        }

        if ('sessionToken' in response && 'sessionData' in response && response.sessionToken && response.sessionData) {
          const sessionDataToSave = {
            ...response.sessionData,
            expiresAt: response.sessionData.expiresAt instanceof Date
              ? response.sessionData.expiresAt.toISOString()
              : response.sessionData.expiresAt
          }
          saveSession(response.sessionToken, sessionDataToSave as any)
        }

        if (response.live) {
          setOnRealTime((prev) => ({
            ...prev,
            chatroom: response.chatRoom,
            mode: response.live,
          }))
        } else {
          setOnChats((prev: any) => [...prev, response.response])
        }
      }
    }
    reset()

    if (values.content) {
      setOnChats((prev: any) => [
        ...prev,
        {
          role: 'user',
          content: values.content,
        },
      ])

      if (!onRealTime?.mode) {
        setOnAiTyping(true)
      }

      console.log('187')
      const response = await onAiChatBotAssistant(currentBotId!, onChats, 'user', values.content, sessionToken || undefined)

      // ENVIAR MENSAJE DEL CLIENTE A PUSHER SI ESTÁ EN MODO LIVE
      if (response?.live && response?.chatRoom) {
        try {
          const { onRealTimeChat } = await import('@/action/conversation')
          await onRealTimeChat(
            response.chatRoom,
            values.content,
            `user-${Date.now()}`,
            'user'
          )
        } catch (error) {
          console.error(`❌ Chatbot: Error al enviar a Pusher:`, error)
        }
      }

      if (response) {
        if (!onRealTime?.mode) {
          setOnAiTyping(false)
        }

        if ('sessionToken' in response && 'sessionData' in response && response.sessionToken && response.sessionData) {
          const sessionDataToSave = {
            ...response.sessionData,
            expiresAt: response.sessionData.expiresAt instanceof Date
              ? response.sessionData.expiresAt.toISOString()
              : response.sessionData.expiresAt
          }
          saveSession(response.sessionToken, sessionDataToSave as any)
        }

        if (response.live) {
          setOnRealTime((prev) => ({
            ...prev,
            chatroom: response.chatRoom,
            mode: response.live,
          }))
        } else {
          setOnChats((prev: any) => [...prev, response.response])
        }
      }
    }
  })

  const handleLogout = () => {
    clearSession()
    setOnChats([
      {
        role: 'assistant',
        content: currentBot?.chatBot?.welcomeMessage || '¡Hola! ¿En qué puedo ayudarte?'
      },
      {
        role: 'assistant',
        content: `👋 Has cerrado sesión correctamente.
          📧      **Para volver a iniciar sesión:** Simplemente escribe tu correo electrónico y te reconoceremos automáticamente.
                  Ejemplo: "tunombre@email.com"`
      }
    ])
  }

  return {
    botOpened,
    onOpenChatBot,
    onStartChatting,
    onChats,
    register,
    onAiTyping,
    messageWindowRef,
    currentBot,
    loading,
    setOnChats,
    onRealTime,
    errors,
    // ✅ Exportar datos de sesión
    sessionData,
    isAuthenticated,
    clearSession: handleLogout, // Usar versión que limpia el chat
  }
}

export const useRealTime = (
  chatRoom: string,
  setChats: React.Dispatch<
    React.SetStateAction<
      {
        role: 'user' | 'assistant'
        content: string
        link?: string | undefined
      }[]
    >
  >
) => {
  useEffect(() => {
    pusherClient.subscribe(chatRoom)

    pusherClient.bind('realtime-mode', (data: any) => {

      const messageId = data.chat.id || Date.now().toString()

      setChats((prev: any) => {
        const messageExists = prev.some((msg: any) => msg.id === messageId)
        if (messageExists) {
          return prev
        }

        return [...prev, {
          id: messageId,
          role: data.chat.role,
          content: data.chat.message,
          createdAt: data.chat.createdAt ? new Date(data.chat.createdAt) : new Date(),
        }]
      })

    })

    return () => {
      pusherClient.unbind('realtime-mode')
      pusherClient.unsubscribe(chatRoom)
    }
  }, [chatRoom, setChats])
}
