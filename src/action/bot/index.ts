'use server'

import { client } from '@/lib/prisma'
import { onRealTimeChat } from '../conversation'
import { clerkClient } from '@clerk/nextjs'
import { extractEmailsFromString, extractURLfromString } from '@/lib/utils'
import { onMailer } from '../mailer'
import OpenAi from 'openai'
import { TEXTILE_MESSAGES } from '@/constants/services'
import {
  generateSessionToken,
  getCustomerFromToken
} from '@/lib/session'

const openai = new OpenAi({
  apiKey: process.env.OPEN_AI_KEY,
})

// ============================================
// OPTIMIZACIÓN: Limitar contexto para reducir tokens
// ============================================
/**
 * Obtiene solo los mensajes relevantes del historial
 * Reduce consumo de tokens en 70-90%
 */
const getRelevantChatHistory = (
  chat: { role: 'user' | 'assistant'; content: string }[],
  maxMessages: number = 10 // Solo últimos 10 mensajes
) => {
  if (chat.length <= maxMessages) {
    return chat
  }

  // Tomar primer mensaje (contexto inicial) + últimos N mensajes
  const firstMessage = chat[0]
  const recentMessages = chat.slice(-maxMessages)

  return [firstMessage, ...recentMessages]
}

export const onStoreConversations = async (
  id: string,
  message: string,
  role: 'user' | 'assistant',
  userMessage?: string
) => {
  // Si es una respuesta del asistente, calcular métricas de tiempo
  if (role === 'assistant') {
    // Obtener el último mensaje del usuario
    const lastUserMessage = await client.chatMessage.findFirst({
      where: {
        chatRoomId: id,
        role: 'user',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
        message: true,
      },
    })

    if (lastUserMessage) {
      const now = new Date()
      const responseTimeInSeconds = Math.floor(
        (now.getTime() - lastUserMessage.createdAt.getTime()) / 1000
      )

      // FR2: Evaluar efectividad de la respuesta
      const isEffective = await isResponseEffective(
        id,
        userMessage || lastUserMessage.message,
        message
      )

      await client.chatRoom.update({
        where: { id },
        data: {
          message: {
            create: {
              message,
              role,
              responseTime: responseTimeInSeconds,
              respondedWithin2Hours: isEffective, // FR2: Ahora significa "respondido efectivamente"
            },
          },
        },
      })

      // Actualizar métricas con efectividad en lugar de solo tiempo
      await updateConversationMetrics(id, responseTimeInSeconds, isEffective)

      return
    }
  }

  // Para mensajes del usuario o si no hay mensaje previo
  await client.chatRoom.update({
    where: { id },
    data: {
      message: {
        create: {
          message,
          role,
        },
      },
    },
  })
}

export const onGetCurrentChatBot = async (idOrName: string) => {
  try {
    // Verificar si es un UUID (ID) o un nombre
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrName)

    const chatbot = await client.domain.findFirst({
      where: isUUID ? {
        id: idOrName,
      } : {
        name: idOrName,
      },
      select: {
        id: true,
        helpdesk: true,
        name: true,
        chatBot: {
          select: {
            id: true,
            welcomeMessage: true,
            icon: true,
            textColor: true,
            background: true,
            helpdesk: true,
          },
        },
        // ✅ AGREGAR INFORMACIÓN DE CHATROOM PARA EL TOGGLE
        customer: {
          select: {
            chatRoom: {
              select: {
                id: true,
                conversationState: true,
                live: true,
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      },
    })

    if (chatbot) {
      return chatbot
    }
  } catch (error) {
    console.log('Error en onGetCurrentChatBot:', error)
  }
}

// ===== TIPOS Y INTERFACES =====
interface CustomerData {
  email?: string
  name?: string
  phone?: string
}

interface ChatBotDomain {
  name: string
  helpdesk: Array<{ question: string; answer: string }>
  products: Array<{
    name: string
    price: number
    image: string
    salePrice?: number | null
    description?: string | null
    color?: string | null
    width?: string | null
    weight?: string | null
    stock: number
    material?: { name: string } | null
    texture?: { name: string } | null
    category?: { name: string } | null
    season?: { name: string } | null
    uses: Array<{ use: { name: string } }>
    features: Array<{ feature: { name: string } }>
  }>
  filterQuestions: Array<{ question: string }>
  categories: Array<{ name: string }>
  materials: Array<{ name: string }>
  textures: Array<{ name: string }>
  seasons: Array<{ name: string }>
  uses: Array<{ name: string }>
  features: Array<{ name: string }>
}

interface CustomerInfo {
  id: string
  email: string
  questions: any[]
  chatRoom: Array<{ id: string; live: boolean; mailed: boolean }>
}

// ============================================
// DETECCIÓN DE ESCALACIÓN A HUMANO
// ============================================
/**
 * ✅ Detecta automáticamente cuando el cliente quiere hablar con un humano
 */
const detectHumanTransferRequest = (message: string): boolean => {
  const humanKeywords = [
    'humano', 'persona', 'agente', 'operador', 'representante',
    'hablar con alguien', 'hablar con una persona', 'hablar con un humano',
    'quiero hablar con', 'necesito hablar con', 'puedo hablar con',
    'pásame con', 'pasame con', 'pásame a', 'pasame a',
    'conectame con', 'conéctame con', 'conecta con', 'conecta me',
    'escalar', 'transferir', 'no me ayuda', 'no entiendo',
    'problema', 'queja', 'reclamo', 'urgente', 'emergencia',
    'supervisor', 'gerente', 'jefe', 'ayuda humana'
  ]

  const lowerMessage = message.toLowerCase()
  return humanKeywords.some(keyword => lowerMessage.includes(keyword))
}

// ============================================
// OPTIMIZACIÓN: Respuestas rápidas sin OpenAI
// ============================================
/**
 * ✅ SIMPLIFICADO: Genera respuestas instantáneas para casos comunes
 * Reduce latencia de 2-5s a 50ms y ahorra tokens
 */
const getQuickResponse = (
  message: string,
  customerInfo: any,
  domainId: string
): { content: string; link?: string } | null => {
  const lowerMsg = message.toLowerCase().trim()

  // 1. Agendamiento de citas
  if (/\b(agendar|cita|reservar|reserva|appointment)\b/.test(lowerMsg)) {
    return {
      content: '¡Perfecto! Aquí tienes el enlace para agendar tu cita:',
      link: `http://localhost:3000/portal/${domainId}/appointment/${customerInfo.id}`
    }
  }

  // 2. Saludos simples
  if (/^(hola|hi|hey|buenos días|buenas tardes|buenas noches|qué tal)\.?$/i.test(lowerMsg)) {
    return {
      content: `¡Hola ${customerInfo.name || ''}! Soy Lunari AI. 😊`
    }
  }

  // 3. Horarios
  if (/\b(horario|hora de atención|cuándo abren|está abierto|abren)\b/.test(lowerMsg)) {
    return {
      content: 'Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM.'
    }
  }

  // 4. Ubicación
  if (/\b(dónde están|ubicación|dirección|cómo llego)\b/.test(lowerMsg)) {
    return {
      content: 'Nos ubicamos en [Dirección].'
    }
  }

  // No hay respuesta rápida
  return null
}

// ============================================
// GESTIÓN DE SESIONES AUTENTICADAS
// ============================================

/**
 * Maneja la conversación de un usuario con sesión válida
 * Este usuario ya está identificado, no necesita proporcionar datos
 */
const handleAuthenticatedUser = async (
  customerInfo: any,
  message: string,
  author: 'user',
  chat: { role: 'user' | 'assistant'; content: string }[],
  domainId: string,
  chatBotDomain: any,
  sessionToken: string
) => {

  // ✅ SOLO PROCESAR TERMINACIÓN SI NO ESTÁ EN MODO HUMANO
  if (!customerInfo.chatRoom[0].live) {
    // ✅ NUEVA LÓGICA: Usar IA para detectar si el usuario quiere terminar
    const shouldEndConversation = await detectConversationEndingWithAI(message, chat)

    if (shouldEndConversation) {
      // Guardar mensaje del usuario
      await onStoreConversations(customerInfo.chatRoom[0].id, message, 'user')

      // Solicitar calificación de forma simple
      const ratingMessage = `¡Perfecto! Me alegra haberte ayudado. 😊

Antes de que te vayas, ¿podrías calificar tu experiencia del 1 al 5?

⭐ 1 = Muy insatisfecho
⭐ 5 = Muy satisfecho

Tu opinión nos ayuda a mejorar.`

      // Guardar solicitud de feedback
      await onStoreConversations(customerInfo.chatRoom[0].id, ratingMessage, 'assistant', message)

      // Marcar como esperando calificación
      await client.chatRoom.update({
        where: { id: customerInfo.chatRoom[0].id },
        data: {
          conversationState: 'AWAITING_RATING',
          resolved: true
        }
      })

      return {
        response: {
          role: 'assistant',
          content: ratingMessage
        },
        sessionToken
      }
    }
  }

  // 0.1 ✅ Actualizar última actividad del usuario
  await updateUserActivity(customerInfo.chatRoom[0].id)

  // 0.2 ✅ Verificar estado de la conversación (SIN crear nuevas conversaciones)
  const conversationState = await handleConversationState(
    customerInfo.chatRoom[0].id,
    customerInfo.id,
    chatBotDomain.chatBot?.welcomeMessage || '¡Hola! ¿En qué puedo ayudarte?'
  )

  // ✅ NUEVA LÓGICA: NO crear nuevas conversaciones, mantener la misma
  // Si la conversación está ENDED, simplemente reactivarla
  if (conversationState.shouldStartNew) {
    // Reactivar la conversación existente en lugar de crear una nueva
    await client.chatRoom.update({
      where: { id: customerInfo.chatRoom[0].id },
      data: {
        conversationState: 'ACTIVE',
        lastUserActivityAt: new Date(),
        resolved: false
      }
    })

    // Si hay mensaje de bienvenida, mostrarlo
    if (conversationState.message) {
      return {
        response: {
          role: 'assistant',
          content: conversationState.message
        },
        sessionToken
      }
    }
  }

  // 1. FR4: Detectar si el usuario está calificando (1-5)
  const satisfactionRating = detectSatisfactionRating(message)
  if (satisfactionRating) {
    // ✅ Guardar mensaje de calificación del usuario
    await onStoreConversations(customerInfo.chatRoom[0].id, message, 'user')

    // ✅ ENVIAR MENSAJE DEL USUARIO INMEDIATAMENTE (ANTES DEL PROCESAMIENTO)
    if (customerInfo.chatRoom[0].live) {
      await onRealTimeChat(
        customerInfo.chatRoom[0].id,
        message,
        `user-${Date.now()}`,
        'user'
      )
    }

    await saveSatisfactionRating(
      customerInfo.chatRoom[0].id,
      customerInfo.id,
      domainId,
      satisfactionRating,
      message
    )

    // ✅ VERIFICAR SI ESTABA ESPERANDO CALIFICACIÓN PARA ESCALAR
    const chatRoom = await client.chatRoom.findUnique({
      where: { id: customerInfo.chatRoom[0].id },
      select: { conversationState: true }
    })

    if (chatRoom?.conversationState === 'AWAITING_RATING') {
      // ✅ ESCALAR A HUMANO DESPUÉS DE LA CALIFICACIÓN
      await client.chatRoom.update({
        where: { id: customerInfo.chatRoom[0].id },
        data: {
          live: true,
          conversationState: 'ESCALATED' as any
        }
      })

      // ✅ ENVIAR EMAIL AL DUEÑO CUANDO SE ESCALA A HUMANO
      try {
        const domainOwner = await client.domain.findFirst({
          where: { id: domainId }, // ✅ Usar el domainId del parámetro
          select: {
            User: {
              select: {
                clerkId: true
              }
            }
          }
        })

        if (domainOwner?.User?.clerkId) {
          const user = await clerkClient.users.getUser(domainOwner.User.clerkId)
          await onMailer(
            user.emailAddresses[0].emailAddress,
            customerInfo.name || 'Cliente',
            customerInfo.email
          )
        }
      } catch (error) {
        console.error('❌ Error enviando email de escalación:', error)
      }

      const transferMessage = `¡Muchas gracias por tu calificación de ${satisfactionRating}/5! 😊

Ahora te estoy conectando con uno de nuestros agentes humanos. Un miembro de nuestro equipo se pondrá en contacto contigo en breve. 👨‍💼`

      await onStoreConversations(customerInfo.chatRoom[0].id, transferMessage, 'assistant', message)

      return {
        response: {
          role: 'assistant',
          content: transferMessage
        },
        live: true,
        chatRoom: customerInfo.chatRoom[0].id,
        sessionToken
      }
    } else {
      // ✅ CALIFICACIÓN NORMAL (terminar conversación)
      await markConversationAsEnded(customerInfo.chatRoom[0].id)

      const thankYouMessage = `¡Muchas gracias por tu calificación de ${satisfactionRating}/5! Tu opinión es muy importante para nosotros y nos ayuda a mejorar nuestro servicio. 😊

¿Tienes alguna otra consulta o necesitas ayuda con algo más?`

      await onStoreConversations(customerInfo.chatRoom[0].id, thankYouMessage, 'assistant', message)

      return {
        response: {
          role: 'assistant',
          content: thankYouMessage
        },
        sessionToken
      }
    }
  }

  // 2. Manejar modo tiempo real si está activo
  if (customerInfo.chatRoom[0].live) {
    await onStoreConversations(customerInfo.chatRoom[0].id, message, author)

    return {
      live: true,
      chatRoom: customerInfo.chatRoom[0].id,
      sessionToken // Mantener token
    }
  }

  // 3. ✅ NUEVO: Preparar mensajes para guardar chat completo
  const messagesToSave: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    responseTime?: number;
    respondedWithin2Hours?: boolean
  }[] = [
      {
        role: 'user' as const,
        content: message,
        timestamp: new Date(),
        responseTime: undefined,
        respondedWithin2Hours: undefined
      }
    ]

  // ✅ 4. DETECCIÓN DE TRANSFERENCIA A HUMANO
  if (detectHumanTransferRequest(message)) {
    console.log(`🚨 Solicitud de transferencia detectada: "${message}"`)

    // Guardar mensaje del usuario
    await client.chatMessage.create({
      data: {
        message,
        role: 'user',
        chatRoomId: customerInfo.chatRoom[0].id,
        responseTime: 0,
        respondedWithin2Hours: true
      }
    })

    // ✅ SOLICITAR CALIFICACIÓN ANTES DE ESCALAR
    const transferMessage = `Te comunicarás con un humano en breve. 😊

Antes de transferirte, ¿podrías calificar mi ayuda del 1 al 5?

⭐ 1 = Muy insatisfecho
⭐ 5 = Muy satisfecho

Tu opinión me ayuda a mejorar.`

    // Guardar mensaje de transferencia
    await client.chatMessage.create({
      data: {
        message: transferMessage,
        role: 'assistant',
        chatRoomId: customerInfo.chatRoom[0].id,
        responseTime: 0,
        respondedWithin2Hours: true
      }
    })

    // ✅ ENVIAR EMAIL AL DUEÑO INMEDIATAMENTE CUANDO CLIENTE PIDE HUMANO
    try {
      const domainOwner = await client.domain.findFirst({
        where: { id: domainId }, // ✅ Usar el domainId del parámetro
        select: {
          User: {
            select: {
              clerkId: true
            }
          }
        }
      })
      console.log("🚀 ~ domainOwner:", domainOwner)

      if (domainOwner?.User?.clerkId) {
        const user = await clerkClient.users.getUser(domainOwner.User.clerkId)
        console.log("🚀 ~ user:", user)
        await onMailer(
          user.emailAddresses[0].emailAddress,
          customerInfo.name || 'Cliente',
          customerInfo.email
        )
      }
    } catch (error) {
      console.error('❌ Error enviando email de solicitud de humano:', error)
    }

    // Marcar como esperando calificación antes de escalar
    await client.chatRoom.update({
      where: { id: customerInfo.chatRoom[0].id },
      data: {
        conversationState: 'AWAITING_RATING' as any // ✅ Esperar calificación antes de escalar
      }
    })

    console.log(`🚨 SOLICITUD DE CALIFICACIÓN ANTES DE ESCALAR: Chat ${customerInfo.chatRoom[0].id} - Cliente: ${customerInfo.email}`)

    return {
      response: {
        role: 'assistant' as const,
        content: transferMessage
      },
      sessionToken
    }
  }

  // 5. OPTIMIZACIÓN: Intentar respuesta rápida primero (sin OpenAI)
  const quickResponse = getQuickResponse(message, customerInfo, domainId)

  if (quickResponse) {
    console.log('✅ Respuesta rápida utilizada (sin OpenAI)')

    // ✅ SIMPLIFICADO: Agregar pregunta de ayuda
    const finalQuickContent = addHelpOffer(quickResponse.content)

    // Agregar respuesta rápida a los mensajes
    messagesToSave.push({
      role: 'assistant' as const,
      content: finalQuickContent,
      timestamp: new Date(),
      responseTime: 0, // Respuesta instantánea
      respondedWithin2Hours: true // Siempre efectiva
    })

    // ✅ NUEVO: Guardar chat completo
    await saveCompleteChatSession(
      customerInfo.id,
      customerInfo.chatRoom[0].id,
      domainId,
      messagesToSave
    )

    await updateResolutionType(customerInfo.chatRoom[0].id, false)

    return {
      response: {
        role: 'assistant' as const,
        content: finalQuickContent,
        link: quickResponse.link
      },
      sessionToken // Mantener token
    }
  }

  // 5. Generar contexto para OpenAI
  const contextSpecificPrompt = getContextSpecificPrompt(message, domainId, customerInfo.id)

  const customerDataForContext = {
    email: customerInfo.email,
    name: customerInfo.name,
    phone: customerInfo.phone
  }

  const systemPrompt = generateOpenAIContext(
    chatBotDomain,
    customerDataForContext,
    contextSpecificPrompt,
    domainId,
    customerInfo,
    message
  )

  // 6. Usar solo historial relevante (últimos 10 mensajes)
  const relevantHistory = getRelevantChatHistory(chat, 10)

  // 7. Obtener respuesta de OpenAI
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      ...relevantHistory,
      { role: 'user', content: message }
    ],
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 300
  })

  // 8. Manejar respuesta
  const response = chatCompletion.choices[0].message.content

  // ✅ Validar que la respuesta no sea null
  if (!response) {
    throw new Error('OpenAI no retornó una respuesta válida')
  }

  const result = await handleOpenAIResponse(response, customerInfo, chat)

  // ✅ SIMPLIFICADO: Agregar "¿Hay algo más en que te pueda ayudar?" a todas las respuestas
  const finalContent = addHelpOffer(result.response.content)

  // 9. ✅ NUEVO: Agregar respuesta de OpenAI a los mensajes
  messagesToSave.push({
    role: 'assistant' as const,
    content: finalContent,
    timestamp: new Date(),
    responseTime: Math.floor((Date.now() - messagesToSave[0].timestamp.getTime()) / 1000),
    respondedWithin2Hours: true // Respuesta inmediata
  })

  // 10. ✅ NUEVO: Guardar chat completo con respuesta de OpenAI
  await saveCompleteChatSession(
    customerInfo.id,
    customerInfo.chatRoom[0].id,
    domainId,
    messagesToSave
  )

  // 10. Actualizar tipo de resolución
  await updateResolutionType(customerInfo.chatRoom[0].id, false)

  return {
    ...result,
    response: {
      ...result.response,
      content: finalContent
    },
    sessionToken // Mantener token
  }
}

// ============================================
// GESTIÓN DE CICLO DE VIDA DE CONVERSACIONES
// ============================================

/**
 * Detecta si el usuario ha estado inactivo y debe finalizar la conversación
 * Inactividad = 5 minutos sin responder
 */
const checkUserInactivity = async (chatRoomId: string): Promise<boolean> => {
  try {
    const chatRoom = await client.chatRoom.findUnique({
      where: { id: chatRoomId },
      select: {
        lastUserActivityAt: true,
        conversationState: true
      }
    })

    if (!chatRoom) return false

    const now = new Date()
    const lastActivity = new Date(chatRoom.lastUserActivityAt)
    const minutesInactive = (now.getTime() - lastActivity.getTime()) / (1000 * 60)

    // Si lleva más de 5 minutos inactivo y está ACTIVE
    if (minutesInactive > 5 && chatRoom.conversationState === 'ACTIVE') {
      return true
    }

    return false
  } catch (error) {
    return false
  }
}

/**
 * Finaliza la conversación actual y solicita calificación
 */
const endConversation = async (chatRoomId: string, customerId: string): Promise<string | null> => {
  try {
    // Actualizar estado a AWAITING_RATING
    await client.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        conversationState: 'AWAITING_RATING',
        resolved: true,
      }
    })


    return '¿Cómo calificarías la atención que recibiste del 1 al 5? (1 = Muy insatisfecho, 5 = Muy satisfecho)'
  } catch (error) {
    return null
  }
}

/**
 * Marca la conversación como temporalmente inactiva (NO como ENDED permanente)
 * Esto permite que se reactive cuando el usuario vuelva a escribir
 */
const markConversationAsEnded = async (chatRoomId: string): Promise<void> => {
  try {
    await client.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        conversationState: 'IDLE', // Cambiar a IDLE en lugar de ENDED
        conversationEndedAt: new Date(),
        resolved: true
      }
    })
  } catch (error) {
    console.log('Error al marcar conversación como inactiva:', error)
  }
}

/**
 * Inicia una nueva conversación (después de una que terminó)
 * Mantiene el mismo cliente pero crea nueva sesión de chat
 */
const startNewConversation = async (
  customerId: string,
  domainId: string,
  welcomeMessage: string
): Promise<{ chatRoomId: string; welcomeMessage: string }> => {
  try {
    // Obtener el número de conversaciones previas
    const previousConversations = await client.chatRoom.count({
      where: {
        customerId,
        conversationState: 'ENDED'
      }
    })

    // Crear nuevo chatRoom para nueva conversación
    const newChatRoom = await client.chatRoom.create({
      data: {
        customerId,
        conversationState: 'ACTIVE',
        conversationNumber: previousConversations + 1,
        lastUserActivityAt: new Date(),
      }
    })

    return {
      chatRoomId: newChatRoom.id,
      welcomeMessage: `¡Hola de nuevo! 👋 ${welcomeMessage}`
    }
  } catch (error) {
    console.log('Error al iniciar nueva conversación:', error)
    throw error
  }
}

/**
 * Actualiza la última actividad del usuario
 */
const updateUserActivity = async (chatRoomId: string): Promise<void> => {
  try {
    await client.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        lastUserActivityAt: new Date()
      }
    })
  } catch (error) {
    console.log('Error al actualizar actividad:', error)
  }
}

/**
 * Verifica el estado de la conversación y decide qué hacer
 */
const handleConversationState = async (
  chatRoomId: string,
  customerId: string,
  welcomeMessage: string
): Promise<{ shouldStartNew: boolean; newChatRoomId?: string; message?: string }> => {
  try {
    const chatRoom = await client.chatRoom.findUnique({
      where: { id: chatRoomId },
      select: {
        conversationState: true,
        lastUserActivityAt: true,
        satisfactionCollected: true,
      }
    })

    if (!chatRoom) {
      return { shouldStartNew: false }
    }

    // ✅ NUEVA LÓGICA: Si la conversación está ENDED, reactivarla (NO crear nueva)
    if (chatRoom.conversationState === 'ENDED') {
      return {
        shouldStartNew: true,
        message: `¡Hola de nuevo! 👋 ${welcomeMessage}`
      }
    }

    // Si está IDLE y no ha calificado, solicitar calificación
    if (chatRoom.conversationState === 'IDLE' && !chatRoom.satisfactionCollected) {
      const ratingMessage = await endConversation(chatRoomId, customerId)
      return {
        shouldStartNew: false,
        message: ratingMessage || undefined
      }
    }

    return { shouldStartNew: false }
  } catch (error) {
    console.log('Error al manejar estado de conversación:', error)
    return { shouldStartNew: false }
  }
}

// ===== FUNCIONES AUXILIARES =====

/**
 * ✅ NUEVA FUNCIÓN: Guardar chat completo por sesión de cliente
 * Reemplaza el guardado fragmentado por uno completo y organizado
 */
const saveCompleteChatSession = async (
  customerId: string,
  chatRoomId: string,
  domainId: string,
  newMessages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    responseTime?: number;
    respondedWithin2Hours?: boolean
  }[]
) => {
  try {
    // 1. Obtener mensajes existentes del chat
    const existingMessages = await client.chatMessage.findMany({
      where: { chatRoomId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        message: true,
        role: true,
        createdAt: true,
        responseTime: true,
        respondedWithin2Hours: true
      }
    })

    // 2. Combinar mensajes existentes con los nuevos
    const allMessages = [
      ...existingMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.message,
        timestamp: msg.createdAt,
        responseTime: msg.responseTime,
        respondedWithin2Hours: msg.respondedWithin2Hours
      })),
      ...newMessages
    ]

    // 3. Eliminar mensajes duplicados (por si se guardó parcialmente)
    const uniqueMessages = allMessages.filter((msg, index, self) =>
      index === self.findIndex(m =>
        m.content === msg.content &&
        m.role === msg.role &&
        Math.abs(m.timestamp.getTime() - msg.timestamp.getTime()) < 1000 // 1 segundo de tolerancia
      )
    )

    // 4. Actualizar el chatRoom con el estado completo
    await client.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        updatedAt: new Date(),
        // Marcar como activo si hay mensajes recientes
        live: uniqueMessages.length > 0 ? false : false // No activar automáticamente
      }
    })

    // 5. Guardar mensajes nuevos (evitar duplicados)
    for (const newMsg of newMessages) {
      // Verificar si ya existe
      const exists = await client.chatMessage.findFirst({
        where: {
          chatRoomId,
          message: newMsg.content,
          role: newMsg.role,
          createdAt: {
            gte: new Date(newMsg.timestamp.getTime() - 5000), // 5 segundos de tolerancia
            lte: new Date(newMsg.timestamp.getTime() + 5000)
          }
        }
      })

      if (!exists) {
        await client.chatMessage.create({
          data: {
            chatRoomId,
            message: newMsg.content,
            role: newMsg.role,
            responseTime: newMsg.responseTime,
            respondedWithin2Hours: newMsg.respondedWithin2Hours,
            createdAt: newMsg.timestamp
          }
        })
      }
    }

    return uniqueMessages

  } catch (error) {
    console.error('❌ Error al guardar chat completo:', error)
    throw error
  }
}

/**
 * FR1 y FR2: Actualizar o crear métricas de conversación
 */
const updateConversationMetrics = async (
  chatRoomId: string,
  responseTime: number,
  respondedWithin2Hours: boolean
) => {
  try {
    // Obtener el domainId del chatRoom
    const chatRoom = await client.chatRoom.findUnique({
      where: { id: chatRoomId },
      select: {
        Customer: {
          select: { domainId: true }
        }
      }
    })

    if (!chatRoom?.Customer?.domainId) return

    const domainId = chatRoom.Customer.domainId

    // Buscar si ya existe un registro de métricas para este chatRoom
    const existingMetrics = await client.conversationMetrics.findFirst({
      where: { chatRoomId }
    })

    if (existingMetrics) {
      // Actualizar métricas existentes
      const newMessagesCount = existingMetrics.messagesCount + 1
      const newTotalResponseTime = existingMetrics.totalResponseTime + responseTime
      const newAverageResponseTime = Math.floor(newTotalResponseTime / newMessagesCount)
      const newMessagesRespondedOnTime = respondedWithin2Hours
        ? existingMetrics.messagesRespondedOnTime + 1
        : existingMetrics.messagesRespondedOnTime
      const newTotalMessagesReceived = existingMetrics.totalMessagesReceived + 1
      const newPercentageOnTime = (newMessagesRespondedOnTime / newTotalMessagesReceived) * 100

      await client.conversationMetrics.update({
        where: { id: existingMetrics.id },
        data: {
          averageResponseTime: newAverageResponseTime,
          totalResponseTime: newTotalResponseTime,
          messagesCount: newMessagesCount,
          messagesRespondedOnTime: newMessagesRespondedOnTime,
          totalMessagesReceived: newTotalMessagesReceived,
          percentageOnTime: newPercentageOnTime,
        }
      })
    } else {
      // Crear nuevo registro de métricas
      const percentageOnTime = respondedWithin2Hours ? 100 : 0

      await client.conversationMetrics.create({
        data: {
          chatRoomId,
          domainId,
          averageResponseTime: responseTime,
          totalResponseTime: responseTime,
          messagesCount: 1,
          messagesRespondedOnTime: respondedWithin2Hours ? 1 : 0,
          totalMessagesReceived: 1,
          percentageOnTime,
        }
      })
    }
  } catch (error) {
    console.log('Error al actualizar métricas de conversación:', error)
  }
}

/**
 * FR3: Detectar y marcar el tipo de resolución de la conversación
 */
const updateResolutionType = async (chatRoomId: string, isNewConversation: boolean) => {
  try {
    // Contar los mensajes del usuario en esta conversación
    const userMessagesCount = await client.chatMessage.count({
      where: {
        chatRoomId,
        role: 'user'
      }
    })

    // Verificar si el chat pasó a modo live (escalado a humano)
    const chatRoom = await client.chatRoom.findUnique({
      where: { id: chatRoomId },
      select: { live: true }
    })

    let resolutionType: 'FIRST_INTERACTION' | 'FOLLOW_UP' | 'ESCALATED' | 'UNRESOLVED' = 'UNRESOLVED'
    let resolvedInFirstInteraction: boolean | null = null

    if (chatRoom?.live) {
      // Si está en modo live, fue escalado
      resolutionType = 'ESCALATED'
      resolvedInFirstInteraction = false
    } else if (userMessagesCount === 1) {
      // Si solo hay un mensaje del usuario, puede ser resolución en primera interacción
      resolutionType = 'FIRST_INTERACTION'
      resolvedInFirstInteraction = true
    } else if (userMessagesCount > 1) {
      // Si hay más de un mensaje, es seguimiento
      resolutionType = 'FOLLOW_UP'
      resolvedInFirstInteraction = false
    }

    await client.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        resolutionType,
        resolvedInFirstInteraction,
      }
    })
  } catch (error) {
    console.log('Error al actualizar tipo de resolución:', error)
  }
}

/**
 * FR2: Detectar si una respuesta fue efectiva (oportuna) - no dio vueltas
 * Una respuesta es efectiva si:
 * 1. Es directa (no pide información redundante)
 * 2. Resuelve en ≤2 turnos
 * 3. No hace preguntas cuando ya tiene la información
 */
const isResponseEffective = async (
  chatRoomId: string,
  userMessage: string,
  botResponse: string
): Promise<boolean> => {
  try {
    // Contar turnos de conversación (pares user-assistant)
    const messagesCount = await client.chatMessage.count({
      where: { chatRoomId }
    })
    const turnsCount = Math.ceil(messagesCount / 2)

    // Criterio 1: Si es el primer o segundo turno y el bot no pide info redundante → Efectivo
    if (turnsCount <= 2) {
      // Verificar que el bot no esté pidiendo información que ya tiene
      const redundantPatterns = [
        /cuál es tu (correo|email|nombre)/i,
        /podrías darme tu (correo|email|nombre)/i,
        /necesito tu (correo|email|nombre)/i,
      ]

      const isRedundant = redundantPatterns.some(pattern => pattern.test(botResponse))

      if (!isRedundant) {
        return true // Respuesta efectiva
      }
    }

    // Criterio 2: Si el usuario pide una acción específica y el bot la ejecuta → Efectivo
    const actionRequests = [
      /(?:quiero|deseo|necesito|puedo)\s+(?:agendar|reservar)/i,
      /(?:dame|muestra|enséñame)\s+(?:productos|servicios|precios)/i,
    ]

    const requestsAction = actionRequests.some(pattern => pattern.test(userMessage))
    const providesLink = /http/.test(botResponse)

    if (requestsAction && providesLink) {
      return true // Respondió directamente con enlace
    }

    // Criterio 3: Si es más de 3 turnos → Probablemente dio vueltas
    if (turnsCount > 3) {
      return false
    }

    // Por defecto, considerar efectivo si cumple condiciones básicas
    return turnsCount <= 2

  } catch (error) {
    console.log('Error al evaluar efectividad de respuesta:', error)
    return false
  }
}

/**
 * ✅ NUEVA FUNCIÓN: Usa IA para detectar si el usuario quiere terminar la conversación
 */
const detectConversationEndingWithAI = async (
  message: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<boolean> => {
  try {
    const systemPrompt = `Eres un analizador de conversaciones. Tu trabajo es determinar si el usuario quiere TERMINAR la conversación.

ANALIZA el mensaje del usuario y el contexto de la conversación para determinar si:
1. El usuario está diciendo EXPLÍCITAMENTE que NO necesita más ayuda
2. El usuario se está DESPIDIENDO claramente
3. El usuario está SATISFECHO y quiere terminar EXPLÍCITAMENTE
4. El usuario está AGRADECIENDO y cerrando la conversación EXPLÍCITAMENTE

IMPORTANTE: Solo marca como terminación si hay señales CLARAS de despedida o satisfacción. 
Las respuestas a preguntas específicas (materiales, productos, etc.) NO son terminación.

RESPUESTA SOLO: "SI" si el usuario quiere terminar, "NO" si quiere continuar.

EJEMPLOS DE TERMINACIÓN:
- "no, gracias" → SI  
- "ya está, gracias" → SI
- "perfecto, eso es todo" → SI
- "adiós" → SI
- "hasta luego" → SI
- "gracias, ya no necesito más" → SI
- "eso es todo" → SI
- "listo, gracias" → SI

EJEMPLOS DE NO TERMINACIÓN:
- "lino" → NO (respuesta a pregunta sobre material)
- "algodón" → NO (respuesta a pregunta sobre material)
- "quiero más información" → NO
- "tengo otra pregunta" → NO
- "necesito ayuda con..." → NO
- "sí" → NO (respuesta afirmativa)
- "no" → NO (respuesta negativa a pregunta específica)`

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-5), // Últimos 5 mensajes para contexto
        { role: 'user', content: message }
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.1, // Baja temperatura para respuestas consistentes
      max_tokens: 10 // Solo necesitamos "SI" o "NO"
    })

    const response = chatCompletion.choices[0].message.content?.trim().toUpperCase()
    return response === 'SI'

  } catch (error) {
    console.log('Error en detectConversationEndingWithAI:', error)
    return false // ✅ Retornar false en caso de error
  }
}

/**
 * ✅ NUEVA FUNCIÓN: Agrega "¿Hay algo más en que te pueda ayudar?" a las respuestas
 */
const addHelpOffer = (content: string): string => {
  // No agregar si ya tiene la pregunta o si es una solicitud de calificación
  if (content.includes('algo más en que') ||
    content.includes('califica') ||
    content.includes('⭐') ||
    content.includes('calificación') ||
    content.includes('calificar') ||
    content.includes('estrella') ||
    content.includes('rating') ||
    content.includes('Muchas gracias por tu calificación')) {
    return content
  }

  return `${content}\n\n¿Hay algo más en que te pueda ayudar?`
}

/**
 * FR4: Detectar si el cliente está calificando la atención (1-5)
 */
const detectSatisfactionRating = (message: string): number | null => {
  // Patrones para detectar calificación
  const ratingPatterns = [
    /(?:califico|calificar|puntuación|nota|rating|estrella).*?([1-5])/i,
    /^([1-5])$/,
    /([1-5])\s*(?:estrella|star)/i,
  ]

  for (const pattern of ratingPatterns) {
    const match = message.match(pattern)
    if (match) {
      const rating = parseInt(match[1])
      if (rating >= 1 && rating <= 5) {
        return rating
      }
    }
  }

  return null
}

/**
 * FR4: Guardar la calificación de satisfacción del cliente
 */
const saveSatisfactionRating = async (
  chatRoomId: string,
  customerId: string,
  domainId: string,
  rating: number,
  comment?: string
) => {
  try {
    // Guardar en CustomerSatisfaction
    await client.customerSatisfaction.create({
      data: {
        chatRoomId,
        customerId,
        domainId,
        rating,
        comment,
      }
    })

    // Actualizar ChatRoom
    await client.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        satisfactionRating: rating,
        satisfactionCollected: true,
        resolved: true,
        conversationEndedAt: new Date(),
      }
    })

  } catch (error) {
    console.log('Error al guardar satisfacción:', error)
  }
}

/**
 * Extrae información del cliente (email, nombre y teléfono) del mensaje
 * OPTIMIZADO: Maneja nombres compuestos correctamente
 */
const extractCustomerData = (message: string): CustomerData => {
  const email = extractEmailsFromString(message)?.[0]

  // Extraer nombre - MEJORADO para nombres compuestos
  let name: string | undefined

  // Patrón 1: Capturar nombres después de "me llamo", "soy", etc.
  const namePatterns = [
    // "Me llamo Juan Pérez" - captura hasta coma, punto, o palabras clave
    /(?:me llamo|soy|mi nombre es|llámame)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,5})(?=\s*[,.]|\s+(?:mi|y|correo|email|cel|teléfono|telefono)|$)/i,

    // "Soy María García López, mi correo..."
    /(?:me llamo|soy|mi nombre es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,5})(?=\s*,)/i,

    // Nombre al inicio del mensaje: "Juan Pérez, correo..."
    /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,5})(?=\s*[,.]|\s+(?:mi|correo|email))/i
  ]

  for (const pattern of namePatterns) {
    const match = message.match(pattern)
    if (match) {
      name = match[1].trim()

      // Validar que sea un nombre válido (no una palabra clave)
      const invalidNames = ['correo', 'email', 'celular', 'telefono', 'teléfono', 'cita', 'hola']
      if (!invalidNames.some(invalid => name?.toLowerCase().includes(invalid))) {
        // Limpiar y validar
        name = name.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '').trim()

        // Debe tener al menos 2 caracteres y máximo 60
        if (name.length >= 2 && name.length <= 60) {
          break // Nombre válido encontrado
        }
      }
      name = undefined // Resetear si no es válido
    }
  }

  // Fallback: Si no se encontró con patrones, buscar nombre entre comillas
  if (!name) {
    const quotedName = message.match(/["']([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+)["']/i)
    if (quotedName && quotedName[1].length >= 2 && quotedName[1].length <= 60) {
      name = quotedName[1].trim()
    }
  }

  // Extraer teléfono/celular (patrones peruanos)
  let phone: string | undefined
  // Buscar específicamente después de palabras clave de teléfono
  const phoneKeywordsPattern = /(?:celular|teléfono|teléfono|phone|móvil)\s*(?:es\s*)?(?:es\s*)?(?:\+?51\s?)?(9\d{8})/i
  const phoneKeywordsMatch = message.match(phoneKeywordsPattern)

  if (phoneKeywordsMatch) {
    phone = phoneKeywordsMatch[1]
  } else {
    // Patrón general para números de celular peruanos
    const phonePattern = /(?:\+?51\s?)?(9\d{8})/g
    const phoneMatch = message.match(phonePattern)
    if (phoneMatch) {
      phone = phoneMatch[0].replace(/\s/g, '').replace(/\+51/, '')
    }
  }

  return { email, name, phone }
}

/**
 * Busca o crea un cliente en la base de datos
 * CORREGIDO: Retorna estructura correcta
 */
const findOrCreateCustomer = async (domainId: string, customerData: CustomerData, filterQuestions: any[]) => {
  const existingCustomer = await client.domain.findUnique({
    where: { id: domainId },
    select: {
      User: { select: { clerkId: true } },
      name: true,
      customer: {
        where: { email: { startsWith: customerData.email } },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          questions: true,
          chatRoom: {
            select: {
              id: true,
              live: true,
              mailed: true,
              satisfactionCollected: true,
              conversationState: true,
              lastUserActivityAt: true,
              conversationNumber: true
            }
          }
        }
      }
    }
  })

  if (!existingCustomer?.customer.length) {
    // Crear nuevo cliente
    await client.domain.update({
      where: { id: domainId },
      data: {
        customer: {
          create: {
            email: customerData.email,
            name: customerData.name,
            phone: customerData.phone,
            status: true,
            totalInteractions: 1,
            lastActiveAt: new Date(),
            questions: { create: filterQuestions },
            chatRoom: { create: {} }
          }
        }
      }
    })

    // ✅ CORREGIDO: Buscar el cliente recién creado con la estructura correcta
    const createdCustomer = await client.domain.findUnique({
      where: { id: domainId },
      select: {
        User: { select: { clerkId: true } },
        name: true,
        customer: {
          where: { email: { startsWith: customerData.email } },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            questions: true,
            chatRoom: {
              select: {
                id: true,
                live: true,
                mailed: true,
                satisfactionCollected: true,
                conversationState: true,
                lastUserActivityAt: true,
                conversationNumber: true
              }
            }
          }
        }
      }
    })

    return { customer: createdCustomer, isNew: true }
  }

  return { customer: existingCustomer, isNew: false }
}

/**
 * Actualiza los datos del cliente existente si se detecta información nueva
 */
const updateCustomerData = async (customerId: string, customerData: CustomerData) => {
  const updateData: any = {
    lastActiveAt: new Date(),
    totalInteractions: { increment: 1 }
  }

  // Solo actualizar si hay datos nuevos
  if (customerData.name) updateData.name = customerData.name
  if (customerData.phone) updateData.phone = customerData.phone

  await client.customer.update({
    where: { id: customerId },
    data: updateData
  })
}

// ============================================
// SISTEMA INTELIGENTE DE PRODUCTOS
// ============================================

/**
 * Detecta las preferencias del cliente en su mensaje
 * Busca menciones de materiales, categorías, texturas, temporadas, usos y características
 */
const detectProductPreferences = (
  message: string,
  chatBotDomain: ChatBotDomain
): {
  materials: string[]
  categories: string[]
  textures: string[]
  seasons: string[]
  uses: string[]
  features: string[]
  colors: string[]
  hasPreferences: boolean
} => {
  const lowerMsg = message.toLowerCase()

  const preferences = {
    materials: [] as string[],
    categories: [] as string[],
    textures: [] as string[],
    seasons: [] as string[],
    uses: [] as string[],
    features: [] as string[],
    colors: [] as string[],
    hasPreferences: false
  }

  // Detectar materiales mencionados
  chatBotDomain.materials.forEach(mat => {
    if (lowerMsg.includes(mat.name.toLowerCase())) {
      preferences.materials.push(mat.name)
      preferences.hasPreferences = true
    }
  })

  // Detectar categorías mencionadas
  chatBotDomain.categories.forEach(cat => {
    if (lowerMsg.includes(cat.name.toLowerCase())) {
      preferences.categories.push(cat.name)
      preferences.hasPreferences = true
    }
  })

  // Detectar texturas mencionadas
  chatBotDomain.textures.forEach(tex => {
    if (lowerMsg.includes(tex.name.toLowerCase())) {
      preferences.textures.push(tex.name)
      preferences.hasPreferences = true
    }
  })

  // Detectar temporadas mencionadas
  chatBotDomain.seasons.forEach(season => {
    if (lowerMsg.includes(season.name.toLowerCase())) {
      preferences.seasons.push(season.name)
      preferences.hasPreferences = true
    }
  })

  // Detectar usos mencionados
  chatBotDomain.uses.forEach(use => {
    if (lowerMsg.includes(use.name.toLowerCase())) {
      preferences.uses.push(use.name)
      preferences.hasPreferences = true
    }
  })

  // Detectar características mencionadas
  chatBotDomain.features.forEach(feat => {
    if (lowerMsg.includes(feat.name.toLowerCase())) {
      preferences.features.push(feat.name)
      preferences.hasPreferences = true
    }
  })

  // Detectar colores comunes mencionados
  const commonColors = [
    'rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco', 'gris', 'rosa',
    'morado', 'naranja', 'marrón', 'beige', 'celeste', 'turquesa', 'violeta'
  ]

  commonColors.forEach(color => {
    if (lowerMsg.includes(color)) {
      preferences.colors.push(color)
      preferences.hasPreferences = true
    }
  })

  return preferences
}

/**
 * Filtra productos según las preferencias detectadas
 */
const filterProductsByPreferences = (
  products: ChatBotDomain['products'],
  preferences: ReturnType<typeof detectProductPreferences>
): ChatBotDomain['products'] => {
  if (!preferences.hasPreferences) {
    return products // Si no hay preferencias, devolver todos
  }

  return products.filter(product => {
    let matches = false

    // Filtrar por material
    if (preferences.materials.length > 0 && product.material) {
      if (preferences.materials.some(mat =>
        product.material?.name.toLowerCase().includes(mat.toLowerCase())
      )) {
        matches = true
      }
    }

    // Filtrar por categoría
    if (preferences.categories.length > 0 && product.category) {
      if (preferences.categories.some(cat =>
        product.category?.name.toLowerCase().includes(cat.toLowerCase())
      )) {
        matches = true
      }
    }

    // Filtrar por textura
    if (preferences.textures.length > 0 && product.texture) {
      if (preferences.textures.some(tex =>
        product.texture?.name.toLowerCase().includes(tex.toLowerCase())
      )) {
        matches = true
      }
    }

    // Filtrar por temporada
    if (preferences.seasons.length > 0 && product.season) {
      if (preferences.seasons.some(season =>
        product.season?.name.toLowerCase().includes(season.toLowerCase())
      )) {
        matches = true
      }
    }

    // Filtrar por uso
    if (preferences.uses.length > 0 && product.uses.length > 0) {
      if (preferences.uses.some(use =>
        product.uses.some(pUse =>
          pUse.use.name.toLowerCase().includes(use.toLowerCase())
        )
      )) {
        matches = true
      }
    }

    // Filtrar por características
    if (preferences.features.length > 0 && product.features.length > 0) {
      if (preferences.features.some(feat =>
        product.features.some(pFeat =>
          pFeat.feature.name.toLowerCase().includes(feat.toLowerCase())
        )
      )) {
        matches = true
      }
    }

    // Filtrar por color
    if (preferences.colors.length > 0 && product.color) {
      if (preferences.colors.some(color =>
        product.color?.toLowerCase().includes(color.toLowerCase())
      )) {
        matches = true
      }
    }

    return matches
  })
}

/**
 * Genera contexto inteligente de productos:
 * - Si el cliente menciona preferencias específicas, filtra y muestra solo productos relevantes
 * - Si no hay preferencias, sugiere hacer preguntas antes de mostrar todos los productos
 */
const generateProductsContext = (
  chatBotDomain: ChatBotDomain,
  message: string
): string => {
  if (chatBotDomain.products.length === 0) {
    return '\n⚠️ NO hay productos disponibles en este momento.'
  }

  // Detectar si el cliente pregunta por productos
  const lowerMsg = message.toLowerCase()
  const asksForProducts = /\b(productos?|telas?|textiles?|catálogo|que\s+tienen|que\s+venden|muestrame|muéstrame|ver\s+productos)\b/i.test(lowerMsg)

  // Detectar preferencias en el mensaje
  const preferences = detectProductPreferences(message, chatBotDomain)

  // Si hay preferencias detectadas, filtrar productos
  if (preferences.hasPreferences) {
    const filteredProducts = filterProductsByPreferences(chatBotDomain.products, preferences)

    if (filteredProducts.length === 0) {
      return `\n❌ No encontramos productos que coincidan exactamente con: ${[...preferences.materials, ...preferences.categories, ...preferences.textures,
      ...preferences.seasons, ...preferences.uses, ...preferences.features,
      ...preferences.colors].join(', ')
        }. Tenemos ${chatBotDomain.products.length} productos disponibles en total.`
    }

    // Mostrar productos filtrados con información detallada
    const productDetails = filteredProducts.slice(0, 5).map(p => {
      const details: string[] = [`${p.name} - S/${p.salePrice || p.price}`]

      if (p.material) details.push(`Material: ${p.material.name}`)
      if (p.texture) details.push(`Textura: ${p.texture.name}`)
      if (p.category) details.push(`Categoría: ${p.category.name}`)
      if (p.color) details.push(`Color: ${p.color}`)
      if (p.width) details.push(`Ancho: ${p.width}`)
      if (p.weight) details.push(`Gramaje: ${p.weight}`)
      if (p.description) details.push(`${p.description}`)

      const uses = p.uses.map(u => u.use.name).join(', ')
      if (uses) details.push(`Usos: ${uses}`)

      const features = p.features.map(f => f.feature.name).join(', ')
      if (features) details.push(`Características: ${features}`)

      return details.join(' | ')
    }).join('\n')

    return `\n✅ Productos que coinciden con tu búsqueda (${filteredProducts.length} encontrados):\n${productDetails}${filteredProducts.length > 5 ? `\n... y ${filteredProducts.length - 5} productos más` : ''
      }`
  }

  // Si pregunta por productos pero no da preferencias, sugerir hacer preguntas
  if (asksForProducts) {
    const suggestions: string[] = []

    if (chatBotDomain.materials.length > 0) {
      suggestions.push(`Materiales disponibles: ${chatBotDomain.materials.map(m => m.name).join(', ')}`)
    }
    if (chatBotDomain.categories.length > 0) {
      suggestions.push(`Categorías: ${chatBotDomain.categories.map(c => c.name).join(', ')}`)
    }
    if (chatBotDomain.textures.length > 0) {
      suggestions.push(`Texturas: ${chatBotDomain.textures.map(t => t.name).join(', ')}`)
    }
    if (chatBotDomain.uses.length > 0) {
      suggestions.push(`Usos: ${chatBotDomain.uses.map(u => u.name).join(', ')}`)
    }

    return `\n📋 Tenemos ${chatBotDomain.products.length} productos textiles disponibles.

IMPORTANTE: Para ayudarte mejor, pregunta al cliente sobre sus preferencias:
${suggestions.length > 0 ? suggestions.join('\n') : ''}

Ejemplo: "¿Qué tipo de material/tela estás buscando?" o "¿Para qué uso necesitas la tela?"`
  }

  // Si no pregunta por productos, solo dar contexto básico
  return `\n📦 Tenemos ${chatBotDomain.products.length} productos textiles. Pregunta al cliente qué busca antes de listarlos todos.`
}

/**
 * OPTIMIZACIÓN: Prompt compacto para reducir tokens
 * Reducción de ~800 tokens a ~300 tokens (62% ahorro)
 */
const generateOpenAIContext = (
  chatBotDomain: ChatBotDomain,
  customerData: CustomerData,
  contextSpecificPrompt: string,
  domainId: string,
  customerInfo: any,
  message: string
): string => {
  // Contextos compactos
  const helpdeskContext = chatBotDomain.helpdesk.length > 0
    ? `\nFAQs: ${chatBotDomain.helpdesk.map(h => h.question).join(', ')}`
    : ''

  // ✅ NUEVO: Usar sistema inteligente de productos
  const productsContext = generateProductsContext(chatBotDomain, message)

  return `Eres Lunari AI, asistente virtual especializado en textiles para ${chatBotDomain.name}.

CLIENTE: ${customerData.name || 'Usuario'} | ${customerData.email} | ${customerData.phone || 'Sin teléfono'}

⚠️ REGLAS CRÍTICAS - PROHIBIDO INVENTAR INFORMACIÓN:
1. SOLO usa los productos y datos proporcionados arriba en el contexto
2. NUNCA inventes productos, materiales, características o servicios que no están en el contexto
3. Si no tienes la información exacta, di "No tengo esa información específica"
4. NO pidas datos del cliente que ya aparecen arriba (nombre, email, teléfono)
5. Si dice "agendar/reservar/cita" → Da SOLO este enlace: http://localhost:3000/portal/${domainId}/appointment/${customerInfo?.id}
6. NO preguntes fecha/hora para citas, solo da el enlace
7. Si la consulta es fuera de contexto textil, no puedes ayudar, o el cliente solicita hablar con un humano → Responde con "(realtime)" para escalar a humano
   Palabras clave para escalación: "humano", "persona", "agente", "operador", "hablar con alguien", "no me ayuda", "quiero hablar con", "escalar"
${helpdeskContext}${productsContext}
9. NO preguntes "¿Hay algo más en que pueda ayudarte?" - esto se agrega automáticamente

🎯 ESTRATEGIA PARA RECOMENDAR PRODUCTOS:
- Si el cliente pregunta por productos SIN especificar qué busca, NO le des una lista completa
- En su lugar, haz preguntas inteligentes para conocer sus necesidades:
  * "¿Qué tipo de material o tela estás buscando?" (si hay materiales disponibles en el contexto)
  * "¿Para qué uso necesitas la tela?" (si hay usos disponibles en el contexto)
  * "¿Qué textura prefieres?" (si hay texturas disponibles en el contexto)
  * "¿Qué categoría te interesa?" (si hay categorías disponibles en el contexto)
- Una vez que el cliente mencione sus preferencias (material, uso, categoría, color, etc.), muestra SOLO los productos del contexto que coincidan
- Si el cliente menciona algo que NO está en tu contexto de productos, indícale qué opciones SÍ tienes disponibles

Responde en español, breve, amigable y directo. Usa el nombre del cliente. Sé útil pero NUNCA inventes información.`
}

/**
 * Verifica si el mensaje es una solicitud de agendamiento de cita
 */
const isAppointmentRequest = (message: string): boolean => {
  const appointmentKeywords = ['reservar cita', 'agendar cita', 'generar cita', 'quiero cita', 'necesito cita', 'cita']
  return appointmentKeywords.some(keyword =>
    message.toLowerCase().includes(keyword.toLowerCase())
  )
}

/**
 * Determina el contexto específico basado en el tipo de solicitud
 */
const getContextSpecificPrompt = (message: string, domainId: string, customerId: string): string => {
  const isAppointmentRequest = /cita|agendar|consulta|reunión|visita/i.test(message)
  const isGeneralQuery = /ayuda|información|consulta|pregunta/i.test(message)

  if (isAppointmentRequest) {
    return `
CONTEXTO ACTUAL: El cliente está solicitando agendar una cita o consulta.
RESPUESTA ESPERADA: Debes ayudarlo con el proceso de agendamiento y proporcionar el enlace de citas: http://localhost:3000/portal/${domainId}/appointment/${customerId}
NO pidas email nuevamente, ya lo tienes.`
  } else if (isGeneralQuery) {
    return `
CONTEXTO ACTUAL: El cliente está haciendo una consulta general.
RESPUESTA ESPERADA: Responde su consulta de manera útil y ofrece ayuda adicional.
NO pidas email nuevamente, ya lo tienes.`
  }

  return ''
}

/**
 * Maneja la respuesta de OpenAI y ejecuta acciones específicas
 */
const handleOpenAIResponse = async (
  response: string,
  customerInfo: CustomerInfo,
  chatHistory: any[]
) => {
  // ✅ Manejar modo tiempo real (escalado a humano)
  if (response.includes('(realtime)')) {
    await client.chatRoom.update({
      where: { id: customerInfo.chatRoom[0].id },
      data: {
        live: true,
        conversationState: 'ESCALATED' as any // ✅ Marcar como escalado as any // ✅ Marcar como escalado
      }
    })

    // ✅ Notificar al equipo humano sobre la escalación
    console.log(`🚨 ESCALACIÓN A HUMANO: Chat ${customerInfo.chatRoom[0].id} - Cliente: ${customerInfo.email}`)

    return {
      response: {
        role: 'assistant' as const,
        content: response.replace('(realtime)', '')
      },
      live: true, // ✅ Indicar que está en modo live
      chatRoom: customerInfo.chatRoom[0].id // ✅ ID del chatRoom para Pusher
    }
  }

  // Manejar preguntas completadas
  if (chatHistory[chatHistory.length - 1]?.content.includes('(complete)')) {
    const firstUnansweredQuestion = await client.customerResponses.findFirst({
      where: {
        customerId: customerInfo.id,
        answered: null
      },
      select: { id: true },
      orderBy: { question: 'asc' }
    })

    if (firstUnansweredQuestion) {
      await client.customerResponses.update({
        where: { id: firstUnansweredQuestion.id },
        data: { answered: chatHistory[chatHistory.length - 1].content }
      })
    }
  }

  // Manejar enlaces generados - CORREGIDO: Mantener contenido original
  const generatedLink = extractURLfromString(response)
  if (generatedLink) {
    const cleanLink = generatedLink[0].replace(/[()]+$/, '').trim()
    return {
      response: {
        role: 'assistant' as const,
        content: response, // ✅ CORREGIDO: Mantener el contenido completo original
        link: cleanLink
      }
    }
  }

  // Respuesta normal
  return {
    response: {
      role: 'assistant' as const,
      content: response
    }
  }
}

/**
 * Maneja el flujo cuando no hay email del cliente
 */
const handleNoEmailFlow = async (message: string, chatHistory: any[]) => {
  // Extraer datos disponibles del mensaje actual
  const extractedData = extractCustomerData(message)

  // Determinar qué información ya tenemos
  const hasName = !!extractedData.name
  const hasEmail = !!extractedData.email
  const hasPhone = !!extractedData.phone

  // Crear prompt dinámico basado en lo que ya sabemos
  let systemPrompt = `Eres **Lunari AI**, un asistente virtual profesional y amigable. Tu objetivo es obtener la información necesaria del cliente de manera natural y conversacional.

## INFORMACIÓN ACTUAL DEL CLIENTE:
${hasName ? `- Nombre: ${extractedData.name}` : '- Nombre: No disponible'}
${hasEmail ? `- Email: ${extractedData.email}` : '- Email: No disponible'}
${hasPhone ? `- Teléfono: ${extractedData.phone}` : '- Teléfono: No disponible'}

## INSTRUCCIONES CRÍTICAS PARA EL FORMATO:
- Da una bienvenida cálida y profesional: "¡Hola! Soy Lunari AI, tu asistente virtual."
- SIEMPRE da un salto de línea después del saludo
- Luego escribe: "Para brindarte la mejor atención, necesito algunos datos:"
- SIEMPRE da otro salto de línea después de esta frase
- Enumera SOLO los datos que faltan, numerados del 1 al 3 máximo
- CADA PREGUNTA debe estar en una línea separada
- Los únicos datos a pedir son: nombre, correo electrónico, número de celular
- Si ya tienes el nombre, úsalo en la conversación
- Mantén un tono amigable y profesional
- No pidas otros datos, solo estos 3 específicos

## FORMATO OBLIGATORIO:
Debes responder EXACTAMENTE en este formato:

         ${TEXTILE_MESSAGES.WELCOME}

         Para brindarte la mejor atención especializada en textiles, necesito algunos datos:

         1. ¿Cómo te llamas?
         2. ¿Cuál es tu correo electrónico?
         3. ¿Tu número de celular?

         Cada número debe estar en una línea separada. NO pongas todo en una sola línea.

## FLUJO DE INFORMACIÓN:
1. **Si no tienes nombre**: Pide el nombre primero
2. **Si no tienes email**: Solicita el email explicando que es para brindar mejor servicio
3. **Si no tienes teléfono**: Puedes solicitar el teléfono para contacto adicional (opcional)

## EJEMPLOS DE RESPUESTAS:

### Si no tienes nada:
"¡Hola! Soy Lunari AI, tu asistente virtual.

Para brindarte la mejor atención, necesito algunos datos:

1. ¿Cómo te llamas?
2. ¿Cuál es tu correo electrónico?  
3. ¿Tu número de celular?"

### Si ya tienes nombre pero no email:
"¡Hola ${extractedData.name}! Soy Lunari AI.

Para brindarte la mejor atención, necesito algunos datos:

1. ¿Cuál es tu correo electrónico?
2. ¿Tu número de celular?"

### Si ya tienes nombre y email pero no teléfono:
"¡Perfecto ${extractedData.name}! Ya tengo tu email (${extractedData.email}).

Para completar tu perfil, necesito:

1. ¿Tu número de celular?"

## TONO:
- Amigable pero profesional
- Empático con las necesidades del usuario
- Claro en las instrucciones
- Personalizado usando la información disponible

RECUERDA: Sé natural, amigable y profesional. Solo pide la información que realmente necesitas.

         IMPORTANTE: Cuando pidas los datos, usa EXACTAMENTE este formato con saltos de línea:
         ${TEXTILE_MESSAGES.WELCOME}

         Para brindarte la mejor atención especializada en textiles, necesito algunos datos:

         1. ¿Cómo te llamas?
         2. ¿Cuál es tu correo electrónico?
         3. ¿Tu número de celular?

         NO pongas todo en una sola línea. Cada pregunta debe estar en su propia línea.`

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: message }
    ],
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 300
  })

  return {
    response: {
      role: 'assistant' as const,
      content: chatCompletion.choices[0].message.content
    }
  }
}

// ===== FUNCIÓN PRINCIPAL REFACTORIZADA =====
export const onAiChatBotAssistant = async (
  id: string,
  chat: { role: 'user' | 'assistant'; content: string }[],
  author: 'user',
  message: string,
  sessionToken?: string
) => {
  try {
    const chatBotDomain = await client.domain.findUnique({
      where: { id },
      select: {
        name: true,
        helpdesk: { select: { question: true, answer: true } },
        products: {
          where: { active: true }, // Solo productos activos
          select: {
            name: true,
            price: true,
            image: true,
            salePrice: true,
            description: true,
            color: true,
            width: true,
            weight: true,
            stock: true,
            material: { select: { name: true } },
            texture: { select: { name: true } },
            category: { select: { name: true } },
            season: { select: { name: true } },
            uses: {
              select: {
                use: { select: { name: true } }
              }
            },
            features: {
              select: {
                feature: { select: { name: true } }
              }
            }
          }
        },
        filterQuestions: {
          where: { answered: null },
          select: { question: true }
        },
        // Obtener catálogos disponibles para hacer preguntas inteligentes
        categories: {
          where: { active: true },
          select: { name: true }
        },
        materials: {
          where: { active: true },
          select: { name: true }
        },
        textures: {
          where: { active: true },
          select: { name: true }
        },
        seasons: {
          where: { active: true },
          select: { name: true }
        },
        uses: {
          where: { active: true },
          select: { name: true }
        },
        features: {
          where: { active: true },
          select: { name: true }
        }
      }
    })

    if (!chatBotDomain) {
      throw new Error('Chatbot domain not found')
    }

    // ✅ NUEVA LÓGICA: Usar IA para detectar si el usuario quiere terminar
    const shouldEndConversation = await detectConversationEndingWithAI(message, chat)

    if (sessionToken) {
      const customerFromToken = await getCustomerFromToken(sessionToken, id)

      if (customerFromToken && customerFromToken.chatRoom && customerFromToken.chatRoom.length > 0) {
        const customerInfo = {
          ...customerFromToken,
          chatRoom: customerFromToken.chatRoom
        }

        return await handleAuthenticatedUser(
          customerInfo,
          message,
          author,
          chat,
          id, // ✅ Pasar el domainId
          chatBotDomain,
          sessionToken
        )
      }
    }

    let existingEmail: string | null = null
    for (const msg of chat) {
      const emailInHistory = extractEmailsFromString(msg.content)?.[0]
      if (emailInHistory) {
        existingEmail = emailInHistory
        break
      }
    }

    const customerDataFromCurrentMessage = extractCustomerData(message)
    const emailFromCurrentMessage = customerDataFromCurrentMessage.email
    const finalEmail = emailFromCurrentMessage || existingEmail

    if (finalEmail) {
      const existingCustomer = await client.domain.findUnique({
        where: { id },
        select: {
          name: true,
          customer: {
            where: {
              email: {
                contains: finalEmail,
                mode: 'insensitive'
              }
            },
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              questions: true,
              chatRoom: {
                select: {
                  id: true,
                  live: true,
                  mailed: true,
                  satisfactionCollected: true
                }
              }
            }
          }
        }
      })

      let customerInfo: any = null
      let isNewCustomer = false

      if (existingCustomer?.customer && existingCustomer.customer.length > 0) {
        customerInfo = existingCustomer.customer[0]
        isNewCustomer = false

        const onlyProvidedEmail = finalEmail && !customerDataFromCurrentMessage.name && !customerDataFromCurrentMessage.phone

        if (onlyProvidedEmail) {
          const sessionData = await generateSessionToken(
            customerInfo.id,
            customerInfo.email || finalEmail,
            id,
            customerInfo.chatRoom[0].id
          )

          await onStoreConversations(customerInfo.chatRoom[0].id, message, 'user')

          // ✅ ENVIAR MENSAJE DEL USUARIO INMEDIATAMENTE (ANTES DEL PROCESAMIENTO)
          if (customerInfo.chatRoom[0].live) {
            await onRealTimeChat(
              customerInfo.chatRoom[0].id,
              message,
              `user-${Date.now()}`,
              'user'
            )
          }

          const welcomeBackMessage = customerInfo.name
            ? `¡Hola de nuevo ${customerInfo.name}! 😊 Me alegra verte otra vez. ¿En qué puedo ayudarte hoy?`
            : `¡Hola de nuevo! 😊 Reconozco tu correo ${customerInfo.email}. ¿En qué puedo ayudarte?`

          await onStoreConversations(customerInfo.chatRoom[0].id, welcomeBackMessage, 'assistant', message)

          return {
            response: {
              role: 'assistant',
              content: welcomeBackMessage
            },
            sessionToken: sessionData.token,
            sessionData: {
              customerId: customerInfo.id,
              email: customerInfo.email,
              name: customerInfo.name,
              expiresAt: sessionData.expiresAt
            }
          }
        }

        if (customerDataFromCurrentMessage.name || customerDataFromCurrentMessage.phone) {
          await updateCustomerData(customerInfo.id, customerDataFromCurrentMessage)
        }
      } else {
        const fullCustomerData = {
          email: finalEmail,
          name: customerDataFromCurrentMessage.name,
          phone: customerDataFromCurrentMessage.phone
        }

        const newCustomerResult = await findOrCreateCustomer(
          id,
          fullCustomerData,
          chatBotDomain.filterQuestions
        )

        const customerResultData = newCustomerResult.customer as any
        customerInfo = customerResultData.customer[0]
        isNewCustomer = true

        const sessionData = await generateSessionToken(
          customerInfo.id,
          customerInfo.email,
          id,
          customerInfo.chatRoom[0].id
        )

        return {
          response: {
            role: 'assistant',
            content: `¡Bienvenido ${fullCustomerData.name || 'a Lunari AI'}! ${TEXTILE_MESSAGES.WELCOME} ${TEXTILE_MESSAGES.SERVICES_DESCRIPTION} ¿En qué puedo ayudarte hoy?`
          },
          sessionToken: sessionData.token,
          sessionData: {
            customerId: customerInfo.id,
            email: customerInfo.email,
            name: customerInfo.name,
            expiresAt: sessionData.expiresAt
          }
        }
      }

      if (!sessionToken && customerInfo) {
        await generateSessionToken(
          customerInfo.id,
          customerInfo.email || finalEmail,
          id,
          customerInfo.chatRoom[0].id
        )
      }

      // ✅ PRIORIDAD: Detectar si el usuario quiere terminar usando IA
      if (customerInfo && customerInfo.chatRoom && customerInfo.chatRoom[0]) {
        if (shouldEndConversation) {
          await onStoreConversations(customerInfo.chatRoom[0].id, message, author)

          const ratingMessage = `¡Perfecto! Me alegra haberte ayudado. 😊

                                  Antes de que te vayas, ¿podrías calificar tu experiencia del 1 al 5?

                                  ⭐ 1 = Muy insatisfecho
                                  ⭐ 5 = Muy satisfecho

                                  Tu opinión nos ayuda a mejorar.`

          await onStoreConversations(customerInfo.chatRoom[0].id, ratingMessage, 'assistant', message)

          await client.chatRoom.update({
            where: { id: customerInfo.chatRoom[0].id },
            data: {
              conversationState: 'AWAITING_RATING',
              resolved: true
            }
          })

          return {
            response: {
              role: 'assistant',
              content: ratingMessage
            }
          }
        }
      }

      const isAppointment = isAppointmentRequest(message)
      if (isAppointment) {
        await onStoreConversations(customerInfo.chatRoom[0].id, message, author)
        await onStoreConversations(
          customerInfo.chatRoom[0].id,
          `¡Perfecto! Aquí tienes el enlace para agendar tu cita: http://localhost:3000/portal/${id}/appointment/${customerInfo.id}`,
          'assistant',
          message
        )

        await updateResolutionType(customerInfo.chatRoom[0].id, false)

        return {
          response: {
            role: 'assistant',
            content: `¡Perfecto! Aquí tienes el enlace para agendar tu cita:`,
            link: `http://localhost:3000/portal/${id}/appointment/${customerInfo.id}`
          }
        }
      }

      const satisfactionRating = detectSatisfactionRating(message)
      if (satisfactionRating) {
        await saveSatisfactionRating(
          customerInfo.chatRoom[0].id,
          customerInfo.id,
          id,
          satisfactionRating,
          message
        )

        return {
          response: {
            role: 'assistant',
            content: `¡Muchas gracias por tu calificación de ${satisfactionRating}/5! Tu opinión es muy importante para nosotros y nos ayuda a mejorar nuestro servicio. 😊

¿Tienes alguna otra consulta o necesitas ayuda con algo más?`
          }
        }
      }

      if (customerInfo.chatRoom[0].live) {
        await onStoreConversations(customerInfo.chatRoom[0].id, message, author)

        // ✅ ENVIAR MENSAJE DEL USUARIO INMEDIATAMENTE (ANTES DEL PROCESAMIENTO)
        await onRealTimeChat(
          customerInfo.chatRoom[0].id,
          message,
          `user-${Date.now()}`, // ID temporal para el mensaje del usuario
          'user'
        )

        if (!customerInfo.chatRoom[0].mailed) {
          const domainOwner = await client.domain.findUnique({
            where: { id },
            select: {
              User: {
                select: {
                  clerkId: true
                }
              }
            }
          })

          if (domainOwner?.User?.clerkId) {
            const user = await clerkClient.users.getUser(domainOwner.User.clerkId)
            await onMailer(
              user.emailAddresses[0].emailAddress,
              customerInfo.name || 'Cliente',
              customerInfo.email
            )

            await client.chatRoom.update({
              where: { id: customerInfo.chatRoom[0].id },
              data: { mailed: true }
            })
          }
        }

        return {
          live: true,
          chatRoom: customerInfo.chatRoom[0].id
        }
      }

      await onStoreConversations(customerInfo.chatRoom[0].id, message, author)

      const quickResponse = getQuickResponse(message, customerInfo, id)
      if (quickResponse) {
        const finalQuickContentMain = addHelpOffer(quickResponse.content)

        await onStoreConversations(
          customerInfo.chatRoom[0].id,
          finalQuickContentMain,
          'assistant',
          message
        )

        await updateResolutionType(customerInfo.chatRoom[0].id, false)

        return {
          response: {
            role: 'assistant' as const,
            content: finalQuickContentMain,
            link: quickResponse.link
          }
        }
      }

      const contextSpecificPrompt = getContextSpecificPrompt(message, id, customerInfo.id)
      const customerDataForContext = {
        email: customerInfo.email,
        name: customerInfo.name,
        phone: customerInfo.phone
      }

      const systemPrompt = generateOpenAIContext(
        chatBotDomain,
        customerDataForContext,
        contextSpecificPrompt,
        id,
        customerInfo,
        message
      )

      const relevantHistory = getRelevantChatHistory(chat, 10)

      const chatCompletion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...relevantHistory,
          { role: 'user', content: message }
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 800
      })

      const response = chatCompletion.choices[0].message.content

      // ✅ Validar que la respuesta no sea null
      if (!response) {
        throw new Error('OpenAI no retornó una respuesta válida')
      }

      const result = await handleOpenAIResponse(response, customerInfo, chat)
      const finalContentMain = addHelpOffer(result.response.content)

      const messagesToSave = [
        {
          role: 'user' as const,
          content: message,
          timestamp: new Date()
        },
        {
          role: 'assistant' as const,
          content: finalContentMain,
          timestamp: new Date(),
          responseTime: 0,
          respondedWithin2Hours: true
        }
      ]

      await saveCompleteChatSession(
        customerInfo.id,
        customerInfo.chatRoom[0].id,
        id,
        messagesToSave
      )

      await updateResolutionType(customerInfo.chatRoom[0].id, false)

      return {
        ...result,
        response: {
          ...result.response,
          content: finalContentMain
        }
      }
    }

    const isAppointment = isAppointmentRequest(message)
    if (isAppointment) {
      return {
        response: {
          role: 'assistant',
          content: 'Para agendar tu cita, necesito que me proporciones tu correo electrónico. Por favor, compártelo conmigo.'
        }
      }
    }

    // ✅ VERIFICAR SI PIDE HABLAR CON HUMANO SIN ESTAR AUTENTICADO
    if (detectHumanTransferRequest(message)) {
      return {
        response: {
          role: 'assistant',
          content: `Para conectarte con un humano, necesito algunos datos primero:

1. ¿Cómo te llamas?
2. ¿Cuál es tu correo electrónico?
3. ¿Tu número de celular?

Una vez que proporciones esta información, te conectaré inmediatamente con nuestro equipo humano.`
        }
      }
    }

    return await handleNoEmailFlow(message, chat)

  } catch (error) {
    return {
      response: {
        role: 'assistant',
        content: 'Lo siento, estoy teniendo dificultades técnicas en este momento. ¿Podrías intentar de nuevo en unos momentos?'
      }
    }
  }
}

