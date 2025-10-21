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
import { useChatSession } from './use-chat-session' // ✅ Importar hook de sesión

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
  
  // ✅ Hook de sesión
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
      // ✅ Mensaje personalizado si hay sesión
      let welcomeMessage = chatbot.chatBot?.welcomeMessage!
      
      if (isAuthenticated && sessionData?.name) {
        welcomeMessage = `¡Hola de nuevo ${sessionData.name}! 👋\n${welcomeMessage}`
        console.log('👤 Usuario identificado:', sessionData.name)
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
      if (!onRealTime?.mode) {
        setOnChats((prev: any) => [
          ...prev,
          {
            role: 'user',
            content: uploaded.uuid,
          },
        ])
      }

      console.log('🟡 RESPONSE FROM UC', uploaded.uuid)
      setOnAiTyping(true)
      
      // ✅ Enviar token de sesión si existe
      const response = await onAiChatBotAssistant(
        currentBotId!,
        onChats,
        'user',
        uploaded.uuid,
        sessionToken || undefined // ✅ Incluir token
      )

      if (response) {
        setOnAiTyping(false)
        
        // ✅ Guardar token si el backend lo envía (verificación segura)
        if ('sessionToken' in response && 'sessionData' in response && response.sessionToken && response.sessionData) {
          const sessionDataToSave = {
            ...response.sessionData,
            expiresAt: response.sessionData.expiresAt instanceof Date 
              ? response.sessionData.expiresAt.toISOString() 
              : response.sessionData.expiresAt
          }
          saveSession(response.sessionToken, sessionDataToSave as any)
          console.log('💾 Nueva sesión guardada (imagen)')
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
      if (!onRealTime?.mode) {
        setOnChats((prev: any) => [
          ...prev,
          {
            role: 'user',
            content: values.content,
          },
        ])
      }

      setOnAiTyping(true)
      
      const response = await onAiChatBotAssistant(
        currentBotId!,
        onChats,
        'user',
        values.content,
        sessionToken || undefined // ✅ Incluir token
      )
      
      if (response) {
        setOnAiTyping(false)
        
        // ✅ Guardar token si el backend lo envía (verificación segura)
        if ('sessionToken' in response && 'sessionData' in response && response.sessionToken && response.sessionData) {
          const sessionDataToSave = {
            ...response.sessionData,
            expiresAt: response.sessionData.expiresAt instanceof Date 
              ? response.sessionData.expiresAt.toISOString() 
              : response.sessionData.expiresAt
          }
          saveSession(response.sessionToken, sessionDataToSave as any)
          console.log('💾 Nueva sesión guardada (texto)')
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

  // ✅ Función para cerrar sesión y limpiar chat
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
    console.log('👋 Sesión cerrada y chat reiniciado')
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
    clearSession: handleLogout, // ✅ Usar versión que limpia el chat
  }
}

/* export const useRealTime = (
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
  const counterRef = useRef(1)

  useEffect(() => {
    pusherClient.subscribe(chatRoom)
    pusherClient.bind('realtime-mode', (data: any) => {
      console.log('✅', data)
      if (counterRef.current !== 1) {
        setChats((prev: any) => [
          ...prev,
          {
            role: data.chat.role,
            content: data.chat.message,
          },
        ])
      }
      counterRef.current += 1
    })
    return () => {
      pusherClient.unbind('realtime-mode')
      pusherClient.unsubscribe(chatRoom)
    }
  }, [])
} */
