import { onAiChatBotAssistant, onGetCurrentChatBot } from '@/action/bot'
import { onUpdateConversationState, onToggleRealtime } from '@/action/conversation'
// ✅ COMENTADO: Pusher Client (plan agotado)
// import { postToParent, pusherClient } from '@/lib/utils'
// ✅ NUEVO: Socket.io Client
import { postToParent, socketClientUtils } from '@/lib/utils'
import {
  ChatBotMessageProps,
  ChatBotMessageSchema,
} from '@/schemas/conversation.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { ConversationState } from '@prisma/client'
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

  // ✅ Estado para el toggle de modo humano
  const [isHumanMode, setIsHumanMode] = useState<boolean>(false)

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
      const userImageId = `user-image-local-${Date.now()}`
      setOnChats((prev: any) => [
        ...prev,
        {
          id: userImageId,
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
      if (response && 'live' in response && response.live && 'chatRoom' in response && response.chatRoom) {
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

        if ('live' in response && response.live && 'chatRoom' in response && response.chatRoom) {
          setOnRealTime((prev) => ({
            ...prev,
            chatroom: response.chatRoom,
            mode: response.live,
          }))
        } else if ('response' in response && response.response) {
          setOnChats((prev: any) => [...prev, response.response])
        }
      }
    }
    reset()

    if (values.content) {
      const userMessageId = `user-local-${Date.now()}`
      setOnChats((prev: any) => [
        ...prev,
        {
          id: userMessageId,
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
      if (response && 'live' in response && response.live && 'chatRoom' in response && response.chatRoom) {
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

        if ('live' in response && response.live && 'chatRoom' in response && response.chatRoom) {
          setOnRealTime((prev) => ({
            ...prev,
            chatroom: response.chatRoom,
            mode: response.live,
          }))
        } else if ('response' in response && response.response) {
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

  const handleToggleHumanMode = async (newIsHumanMode: boolean) => {
    setIsHumanMode(newIsHumanMode)

    // ✅ Actualizar el estado de la conversación y el modo live en la base de datos
    if (onRealTime?.chatroom) {
      try {
        const newState = newIsHumanMode ? ConversationState.ESCALATED : ConversationState.ACTIVE
        const newLiveMode = newIsHumanMode // true para humano, false para bot

        // Actualizar conversationState
        await onUpdateConversationState(onRealTime.chatroom, newState)

        // Actualizar live mode
        await onToggleRealtime(onRealTime.chatroom, newLiveMode)

      } catch (error) {
        console.error('❌ Error al actualizar el estado de la conversación:', error)
      }
    }

    // ✅ Actualizar estado local para mantener sincronización
    if (onRealTime?.chatroom) {
      setOnRealTime(prev => prev ? {
        ...prev,
        mode: newIsHumanMode
      } : undefined)
    }
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
    // ✅ Exportar props del toggle
    isHumanMode,
    onToggleHumanMode: handleToggleHumanMode,
    isToggleDisabled: loading || !onRealTime?.chatroom
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
    // ✅ COMENTADO: Pusher Client (plan agotado)
    // pusherClient.subscribe(chatRoom)
    // pusherClient.bind('realtime-mode', (data: any) => {
    //   const messageId = data.chat.id || Date.now().toString()
    //   setChats((prev: any) => {
    //     const messageExists = prev.some((msg: any) => msg.id === messageId)
    //     if (messageExists) {
    //       return prev
    //     }
    //     return [...prev, {
    //       id: messageId,
    //       role: data.chat.role,
    //       content: data.chat.message,
    //       createdAt: data.chat.createdAt ? new Date(data.chat.createdAt) : new Date(),
    //     }]
    //   })
    // })

    // NUEVO: Socket.io Client
    socketClientUtils.subscribe(chatRoom)
    socketClientUtils.bind('realtime-mode', (data: any) => {
      const messageId = data.chat.id || Date.now().toString()

      setChats((prev: any) => {
        const messageExists = prev.some((msg: any) => msg.id === messageId)
        if (messageExists) {
          return prev
        }

        if (data.chat.role === 'user') {
          const userMessageExists = prev.some((msg: any) =>
            msg.role === 'user' &&
            msg.content === data.chat.message &&
            msg.id?.startsWith('user-local')
          )
          if (userMessageExists) {
            return prev
          }
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
      // ✅ COMENTADO: Pusher Client (plan agotado)
      // pusherClient.unbind('realtime-mode')
      // pusherClient.unsubscribe(chatRoom)

      // ✅ NUEVO: Socket.io Client
      socketClientUtils.unbind('realtime-mode')
      socketClientUtils.unsubscribe(chatRoom)
    }
  }, [chatRoom, setChats])
}

