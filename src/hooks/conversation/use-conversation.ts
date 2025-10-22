import { onGetChatMessages, onGetDomainChatRooms, onGetAllDomainChatRooms, onOwnerSendMessage, onViewUnReadMessages, onToggleFavorite, onRealTimeChat } from '@/action/conversation'
import { useChatContext } from '@/context/user-chat-context'
import { getMonthName, pusherClient } from '@/lib/utils'
import { ChatBotMessageSchema, ConversationSearchSchema } from '@/schemas/conversation.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

export const useConversation = () => {
  const { register, watch, setValue } = useForm({
    resolver: zodResolver(ConversationSearchSchema),
    mode: 'onChange',
  })
  const { setLoading: loadMessages, setChats, setChatRoom } = useChatContext()
  const [chatRooms, setChatRooms] = useState<
    {
      chatRoom: {
        id: string
        createdAt: Date
        isFavorite: boolean
        conversationState: string
        lastUserActivityAt: Date
        message: {
          message: string
          createdAt: Date
          seen: boolean
        }[]
      }[]
      email: string | null
    }[]
  >([])
  const [loading, setLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('no leidos')
  
  useEffect(() => {
    const search = watch(async (value) => {
      setLoading(true)
      try {
        const rooms = await onGetAllDomainChatRooms(value.domain)
        if (rooms) {
          setLoading(false)
          setChatRooms((rooms as any).customer)
        }
      } catch (error) {
        console.log(error)
      }
    })
    return () => search.unsubscribe()
  }, [watch])

  const onGetActiveChatMessages = async (id: string) => {
    try {
      loadMessages(true)
      const messages = await onGetChatMessages(id)
      if (messages) {
        setChatRoom(id)
        loadMessages(false)
        setChats(messages.message)
      }
    } catch (error) {
      console.log(error)
      loadMessages(false)
    }
  }

  // Función para filtrar conversaciones según el tab activo
  const getFilteredChatRooms = () => {
    if (!chatRooms.length) return []
    
    return chatRooms.filter((room) => {
      const chatRoom = room.chatRoom[0]
      if (!chatRoom) return false
      
      const lastMessage = chatRoom.message[0]
      const now = new Date()
      const lastActivity = new Date(chatRoom.lastUserActivityAt)
      const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
      
      switch (activeTab) {
        case 'no leidos':
          return !lastMessage?.seen
        case 'todos':
          return true
        case 'expirados':
          return hoursSinceLastActivity > 24 || chatRoom.conversationState === 'EXPIRED'
        case 'favoritos':
          return chatRoom.isFavorite
        default:
          return true
      }
    })
  }

  // Función para cambiar el tab activo
  const changeActiveTab = (tab: string) => {
    setActiveTab(tab)
  }

  // Función para marcar/desmarcar como favorito
  const toggleFavorite = async (chatRoomId: string, isFavorite: boolean) => {
    try {
      const result = await onToggleFavorite(chatRoomId, isFavorite)
      if (result?.status === 200) {
        // Actualizar el estado local
        setChatRooms(prev => 
          prev.map(room => ({
            ...room,
            chatRoom: room.chatRoom.map(chat => 
              chat.id === chatRoomId 
                ? { ...chat, isFavorite }
                : chat
            )
          }))
        )
      }
    } catch (error) {
      console.log('Error al actualizar favorito:', error)
    }
  }

  return {
    register,
    setValue,
    chatRooms: getFilteredChatRooms(),
    loading,
    activeTab,
    onGetActiveChatMessages,
    changeActiveTab,
    toggleFavorite,
  }
}

export const useChatTime = (createdAt: Date, roomId: string) => {
  const { chatRoom } = useChatContext()
  const [messageSentAt, setMessageSentAt] = useState<string>()
  const [urgent, setUrgent] = useState<boolean>(false)

  const onSetMessageRecievedDate = () => {
    const dt = new Date(createdAt)
    const current = new Date()
    const currentDate = current.getDate()
    const hr = dt.getHours()
    const min = dt.getMinutes()
    const date = dt.getDate()
    const month = dt.getMonth()
    const difference = currentDate - date

    if (difference <= 0) {
      setMessageSentAt(`${hr}:${min}${hr > 12 ? 'PM' : 'AM'}`)
      if (current.getHours() - dt.getHours() < 2) {
        setUrgent(true)
      }
    } else {
      setMessageSentAt(`${date} ${getMonthName(month)}`)
    }
  }

  const onSeenChat = async () => {
    if (chatRoom == roomId && urgent) {
      await onViewUnReadMessages(roomId)
      setUrgent(false)
    }
  }

  useEffect(() => {
    onSeenChat()
  }, [chatRoom])

  useEffect(() => {
    onSetMessageRecievedDate()
  }, [])

  return { messageSentAt, urgent, onSeenChat }
}

export const useChatWindow = () => {
  const { chats, loading, setChats, chatRoom } = useChatContext()
  const messageWindowRef = useRef<HTMLDivElement | null>(null)
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(ChatBotMessageSchema),
    mode: 'onChange',
  })
  const onScrollToBottom = () => {
    messageWindowRef.current?.scroll({
      top: messageWindowRef.current.scrollHeight,
      left: 0,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    onScrollToBottom()
  }, [chats, messageWindowRef])

    useEffect(() => {
      if (chatRoom) {
        console.log(`🔗 Dashboard: Suscribiéndose a canal Pusher: ${chatRoom}`)
        
        try {
          pusherClient.subscribe(chatRoom)
          
          pusherClient.bind('realtime-mode', (data: any) => {
            console.log('📨 Dashboard: Mensaje recibido de Pusher:', data)
            
            try {
              // ✅ Verificar estructura de datos y agregar mensaje seguro
              if (data && data.chat) {
                setChats((prev) => [...prev, {
                  id: data.chat.id || Date.now().toString(),
                  role: data.chat.role || 'assistant',
                  message: data.chat.message,
                  createdAt: data.chat.createdAt ? new Date(data.chat.createdAt) : new Date(),
                  seen: data.chat.seen || false
                }])
                console.log(`✅ Dashboard: Mensaje agregado: ${data.chat.message}`)
              } else {
                console.warn('⚠️ Dashboard: Estructura de datos inesperada:', data)
              }
            } catch (error) {
              console.error('❌ Dashboard: Error al procesar mensaje de Pusher:', error)
            }
          })
        } catch (error) {
          console.error('❌ Dashboard: Error al suscribirse a Pusher:', error)
        }
  
        return () => {
          try {
            console.log(`🔌 Dashboard: Desuscribiéndose del canal: ${chatRoom}`)
            pusherClient.unbind('realtime-mode')
            pusherClient.unsubscribe(chatRoom)
          } catch (error) {
            console.error('❌ Dashboard: Error al desuscribirse de Pusher:', error)
          }
        }
      }
    }, [chatRoom, setChats])

  const onHandleSentMessage = handleSubmit(async (values) => {
    try {
      console.log(`📤 Dashboard: Enviando mensaje: "${values.content}"`)
      reset()
      
      const message = await onOwnerSendMessage(
        chatRoom!,
        values.content,
        'assistant'
      )
      
      if (message && message.message && message.message[0]) {
        const newMessage = message.message[0]
        console.log(`✅ Dashboard: Mensaje guardado en BD:`, newMessage)
        
        // ✅ Agregar mensaje al estado local (ya se envía por Pusher automáticamente)
        setChats((prev) => [...prev, { 
          ...newMessage, 
          role: 'assistant' as 'user' | 'assistant' | null
        }])
        
        // ✅ Ya no necesitamos llamar onRealTimeChat porque onOwnerSendMessage ya lo hace
        console.log(`📤 Dashboard: Mensaje enviado exitosamente`)
      } else {
        console.error('❌ Dashboard: Error - mensaje no válido:', message)
      }
    } catch (error) {
      console.error('❌ Dashboard: Error al enviar mensaje:', error)
    }
  })

  return {
    messageWindowRef,
    register,
    onHandleSentMessage,
    chats,
    loading,
    chatRoom,
  }
}
