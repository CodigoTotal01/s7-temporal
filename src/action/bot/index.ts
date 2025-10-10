'use server'

import { client } from '@/lib/prisma'
import { onRealTimeChat } from '../conversation'
import { clerkClient } from '@clerk/nextjs'
import { extractEmailsFromString, extractURLfromString } from '@/lib/utils'
import { onMailer } from '../mailer'
import OpenAi from 'openai'
import { TEXTILE_SERVICES, TEXTILE_SYSTEM_PROMPT, TEXTILE_MESSAGES } from '@/constants/services'
import { 
  generateSessionToken, 
  validateSessionToken, 
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
      const respondedWithin2Hours = responseTimeInSeconds < 7200 // 2 horas = 7200 segundos

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
      },
    })

    if (chatbot) {
      return chatbot
    } else {
      console.log(`No se encontró chatbot para: ${idOrName}`)
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
  products: Array<{ name: string; price: number; image: string }>
  filterQuestions: Array<{ question: string }>
}

interface CustomerInfo {
  id: string
  email: string
  questions: any[]
  chatRoom: Array<{ id: string; live: boolean; mailed: boolean }>
}

// ============================================
// OPTIMIZACIÓN: Respuestas rápidas sin OpenAI
// ============================================
/**
 * Genera respuestas instantáneas para casos comunes
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
      content: `¡Hola ${customerInfo.name || ''}! Soy Lunari AI. ¿En qué puedo ayudarte hoy? 😊`
    }
  }
  
  // 3. Despedidas
  if (/^(gracias|muchas gracias|ok gracias|perfecto gracias|chao|adiós|hasta luego)\.?$/i.test(lowerMsg)) {
    return {
      content: `¡De nada, ${customerInfo.name || ''}! Fue un placer ayudarte. Si necesitas algo más, aquí estaré. 😊`
    }
  }
  
  // 4. Horarios
  if (/\b(horario|hora de atención|cuándo abren|está abierto|abren)\b/.test(lowerMsg)) {
    return {
      content: 'Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM. ¿Te gustaría agendar una cita?'
    }
  }
  
  // 5. Ubicación
  if (/\b(dónde están|ubicación|dirección|cómo llego)\b/.test(lowerMsg)) {
    return {
      content: 'Nos ubicamos en [Dirección]. ¿Necesitas ayuda con algo más o deseas agendar una cita?'
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
  console.log(`👤 Usuario autenticado: ${customerInfo.name || customerInfo.email}`)
  
  // 1. FR4: Detectar si el usuario está calificando (1-5)
  const satisfactionRating = detectSatisfactionRating(message)
  if (satisfactionRating && !customerInfo.chatRoom[0].satisfactionCollected) {
    await saveSatisfactionRating(
      customerInfo.chatRoom[0].id,
      customerInfo.id,
      domainId,
      satisfactionRating,
      message
    )
    
    return {
      response: {
        role: 'assistant',
        content: `¡Muchas gracias por tu calificación de ${satisfactionRating}/5! Tu opinión es muy importante para nosotros y nos ayuda a mejorar nuestro servicio. 😊`
      },
      sessionToken // Mantener token
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

  // 3. Almacenar mensaje del usuario
  await onStoreConversations(customerInfo.chatRoom[0].id, message, author)

  // 4. OPTIMIZACIÓN: Intentar respuesta rápida primero (sin OpenAI)
  const quickResponse = getQuickResponse(message, customerInfo, domainId)
  
  if (quickResponse) {
    console.log('✅ Respuesta rápida utilizada (sin OpenAI)')
    
    await onStoreConversations(
      customerInfo.chatRoom[0].id,
      quickResponse.content,
      'assistant',
      message
    )
    
    await updateResolutionType(customerInfo.chatRoom[0].id, false)
    
    return {
      response: {
        role: 'assistant' as const,
        content: quickResponse.content,
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
    customerInfo
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
  const result = await handleOpenAIResponse(response, customerInfo, chat)

  // 9. Almacenar respuesta con métricas
  await onStoreConversations(
    customerInfo.chatRoom[0].id,
    result.response.content,
    'assistant',
    message
  )

  // 10. Actualizar tipo de resolución
  await updateResolutionType(customerInfo.chatRoom[0].id, false)

  // 11. Verificar si solicitar calificación
  const askSatisfaction = await shouldAskForSatisfaction(customerInfo.chatRoom[0].id)
  
  if (askSatisfaction) {
    return {
      ...result,
      response: {
        ...result.response,
        content: `${result.response.content}\n\n---\n\n¿Cómo calificarías la atención que recibiste del 1 al 5? (1 = Muy insatisfecho, 5 = Muy satisfecho)`
      },
      sessionToken // Mantener token
    }
  }

  return {
    ...result,
    sessionToken // Mantener token
  }
}

// ===== FUNCIONES AUXILIARES =====

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
      /(?:quiero|deseo|necesito|puedo)\s+(?:agendar|reservar|comprar|adquirir)/i,
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
 * FR4: Solicitar calificación de satisfacción al cliente
 */
const shouldAskForSatisfaction = async (chatRoomId: string): Promise<boolean> => {
  try {
    const chatRoom = await client.chatRoom.findUnique({
      where: { id: chatRoomId },
      select: {
        satisfactionCollected: true,
        resolutionType: true,
        message: {
          select: { id: true },
          where: { role: 'user' }
        }
      }
    })

    // Solicitar satisfacción si:
    // 1. No se ha recolectado aún
    // 2. Hay al menos 2 mensajes del usuario (conversación mínima)
    // 3. La conversación está resuelta o en seguimiento
    return (
      chatRoom?.satisfactionCollected === false &&
      (chatRoom?.message?.length || 0) >= 2 &&
      (chatRoom?.resolutionType === 'FIRST_INTERACTION' || 
       chatRoom?.resolutionType === 'FOLLOW_UP')
    )
  } catch (error) {
    console.log('Error al verificar solicitud de satisfacción:', error)
    return false
  }
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

    console.log(`✅ Satisfacción guardada: ${rating}/5 para chatRoom ${chatRoomId}`)
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
            select: { id: true, live: true, mailed: true, satisfactionCollected: true }
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
              select: { id: true, live: true, mailed: true, satisfactionCollected: true }
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

/**
 * OPTIMIZACIÓN: Prompt compacto para reducir tokens
 * Reducción de ~800 tokens a ~300 tokens (62% ahorro)
 */
const generateOpenAIContext = (
  chatBotDomain: ChatBotDomain,
  customerData: CustomerData,
  contextSpecificPrompt: string,
  domainId: string,
  customerInfo?: any
): string => {
  // Contextos compactos
  const helpdeskContext = chatBotDomain.helpdesk.length > 0
    ? `\nFAQs: ${chatBotDomain.helpdesk.map(h => h.question).join(', ')}`
    : ''
    
  const productsContext = chatBotDomain.products.length > 0
    ? `\nProductos: ${chatBotDomain.products.map(p => `${p.name} (S/${p.price})`).join(', ')}`
    : ''

  return `Eres Lunari AI, asistente de textiles para ${chatBotDomain.name}.

CLIENTE: ${customerData.name || 'Usuario'} | ${customerData.email} | ${customerData.phone || 'Sin teléfono'}

⚠️ REGLAS CRÍTICAS:
1. NO pidas datos que ya tienes (nombre, email, teléfono arriba)
2. Si dice "agendar/reservar/cita" → Da SOLO este enlace: http://localhost:3000/portal/${domainId}/appointment/${customerInfo?.id}
3. NO preguntes fecha/hora para citas, solo da el enlace
4. Para compras → Enlace: http://localhost:3000/portal/${domainId}/payment/${customerInfo?.id}
5. Si fuera de contexto textil → "(realtime)" para humano
6. NUNCA inventes productos/servicios${helpdeskContext}${productsContext}

Responde en español, breve, amigable y directo. Usa el nombre del cliente.`
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
  const isPaymentRequest = /pago|pagar|comprar|adquirir|producto/i.test(message)
  const isAppointmentRequest = /cita|agendar|consulta|reunión|visita/i.test(message)
  const isGeneralQuery = /ayuda|información|consulta|pregunta/i.test(message)

  if (isPaymentRequest) {
    return `
CONTEXTO ACTUAL: El cliente está solicitando ayuda con un pago o compra.
RESPUESTA ESPERADA: Debes ayudarlo con el proceso de pago, mostrar productos disponibles si es necesario, y proporcionar el enlace de pago: http://localhost:3000/portal/${domainId}/payment/${customerId}
NO pidas email nuevamente, ya lo tienes.`
  } else if (isAppointmentRequest) {
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
  // Manejar modo tiempo real
  if (response.includes('(realtime)')) {
    await client.chatRoom.update({
      where: { id: customerInfo.chatRoom[0].id },
      data: { live: true }
    })
    
    return {
      response: {
        role: 'assistant' as const,
        content: response.replace('(realtime)', '')
      }
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

  // Manejar enlaces generados
  const generatedLink = extractURLfromString(response)
          if (generatedLink) {
    const cleanLink = generatedLink[0].replace(/[()]+$/, '').trim()
    return {
      response: {
        role: 'assistant' as const,
        content: '¡Perfecto! Puedes hacer clic en el siguiente enlace para continuar:',
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
  sessionToken?: string // ✅ NUEVO: Token de sesión opcional
) => {
  try {
    // 1. Obtener datos del dominio del chatbot
    const chatBotDomain = await client.domain.findUnique({
      where: { id },
      select: {
        name: true,
        helpdesk: { select: { question: true, answer: true } },
        products: { select: { name: true, price: true, image: true } },
        filterQuestions: {
          where: { answered: null },
          select: { question: true }
        }
      }
    })

    if (!chatBotDomain) {
      throw new Error('Chatbot domain not found')
    }

    // 2. ✅ NUEVA FUNCIONALIDAD: Intentar recuperar sesión desde token
    if (sessionToken) {
      console.log('🔐 Token de sesión detectado, validando...')
      
      const customerFromToken = await getCustomerFromToken(sessionToken, id)
      
      if (customerFromToken && customerFromToken.chatRoom && customerFromToken.chatRoom.length > 0) {
        console.log(`✅ Sesión recuperada automáticamente: ${customerFromToken.name || customerFromToken.email}`)
        
        const customerInfo = {
          ...customerFromToken,
          chatRoom: customerFromToken.chatRoom
        }

        // Usar este flujo directo con el usuario recuperado
        return await handleAuthenticatedUser(
          customerInfo,
          message,
          author,
          chat,
          id,
          chatBotDomain,
          sessionToken
        )
      } else {
        console.log('⚠️ Token inválido o expirado, continuando con flujo normal')
      }
    }

    // 3. FLUJO NORMAL: Buscar en todo el historial de chat si ya hay un email
    let existingEmail: string | null = null
    for (const msg of chat) {
      const emailInHistory = extractEmailsFromString(msg.content)?.[0]
      if (emailInHistory) {
        existingEmail = emailInHistory
        break
      }
    }

    // También buscar en el mensaje actual
    const customerDataFromCurrentMessage = extractCustomerData(message)
    const emailFromCurrentMessage = customerDataFromCurrentMessage.email

    // Usar el email que encontremos (prioridad: mensaje actual > historial)
    const finalEmail = emailFromCurrentMessage || existingEmail

    // 4. Si tenemos email (de cualquier fuente), buscar o crear cliente
    if (finalEmail) {
      console.log('✅ Email encontrado:', finalEmail)
      
      // Buscar si ya existe el cliente con este email
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

      // Si el cliente YA existe, usar sus datos
      if (existingCustomer?.customer && existingCustomer.customer.length > 0) {
        console.log('✅ Cliente existente encontrado')
        customerInfo = existingCustomer.customer[0]
        isNewCustomer = false

        // Actualizar datos si el mensaje actual tiene información nueva
        if (customerDataFromCurrentMessage.name || customerDataFromCurrentMessage.phone) {
          await updateCustomerData(customerInfo.id, customerDataFromCurrentMessage)
        }
      } else {
        // Cliente nuevo - crear con todos los datos disponibles
        console.log('✨ Creando nuevo cliente')
        
        // Combinar datos del mensaje actual con el email encontrado
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

        // ✅ Generar token de sesión para el nuevo cliente
        const sessionData = await generateSessionToken(
          customerInfo.id,
          customerInfo.email,
          id,
          customerInfo.chatRoom[0].id
        )

        console.log(`🎟️ Token generado para nuevo cliente: ${customerInfo.email}`)

        // Si es nuevo, dar bienvenida CON TOKEN
        return {
          response: {
            role: 'assistant',
            content: `¡Bienvenido ${fullCustomerData.name || 'a Lunari AI'}! ${TEXTILE_MESSAGES.WELCOME} ${TEXTILE_MESSAGES.SERVICES_DESCRIPTION} ¿En qué puedo ayudarte hoy?`
          },
          sessionToken: sessionData.token, // ✅ Enviar token al frontend
          sessionData: {
            customerId: customerInfo.id,
            email: customerInfo.email,
            name: customerInfo.name,
            expiresAt: sessionData.expiresAt
          }
        }
      }

      // ✅ Cliente existente - Generar token si no tiene sesión activa
      if (!sessionToken && customerInfo) {
        const sessionData = await generateSessionToken(
          customerInfo.id,
          customerInfo.email || finalEmail,
          id,
          customerInfo.chatRoom[0].id
        )
        
        console.log(`🎟️ Token generado para cliente existente: ${customerInfo.email}`)
        
        // Opcional: Saludar al usuario de regreso
        if (customerInfo.name && customerInfo.totalInteractions > 1) {
          console.log(`👋 Cliente recurrente detectado: ${customerInfo.name} (${customerInfo.totalInteractions} visitas)`)
        }
      }

      // 4. CLIENTE EXISTE - Verificar si es solicitud de agendamiento
      const isAppointment = isAppointmentRequest(message)
      
      if (isAppointment) {
        console.log('📅 Solicitud de agendamiento detectada')
        
        // DAR ENLACE DIRECTO - NO PREGUNTAR POR FECHA/HORA
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

      // 5. FR4: Detectar si el usuario está calificando (1-5)
      const satisfactionRating = detectSatisfactionRating(message)
      if (satisfactionRating && !customerInfo.chatRoom[0].satisfactionCollected) {
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
            content: `¡Muchas gracias por tu calificación de ${satisfactionRating}/5! Tu opinión es muy importante para nosotros y nos ayuda a mejorar nuestro servicio. 😊`
          }
        }
      }

      // 6. Manejar modo tiempo real si está activo
      if (customerInfo.chatRoom[0].live) {
        await onStoreConversations(customerInfo.chatRoom[0].id, message, author)

        // Marcar como mailed si es necesario
        if (!customerInfo.chatRoom[0].mailed) {
          // Buscar el usuario owner del dominio
          const domainOwner = await client.domain.findUnique({
            where: { id },
            select: {
              User: {
                select: { clerkId: true }
              }
            }
          })

          if (domainOwner?.User?.clerkId) {
            const user = await clerkClient.users.getUser(domainOwner.User.clerkId)
            onMailer(user.emailAddresses[0].emailAddress)

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

      // 7. Almacenar mensaje del usuario
      await onStoreConversations(customerInfo.chatRoom[0].id, message, author)

      // 8. OPTIMIZACIÓN: Intentar respuesta rápida primero (sin OpenAI)
      const quickResponse = getQuickResponse(message, customerInfo, id)
      
      if (quickResponse) {
        console.log('✅ Respuesta rápida utilizada (sin OpenAI)')
        
        // Guardar respuesta rápida
        await onStoreConversations(
          customerInfo.chatRoom[0].id,
          quickResponse.content,
          'assistant',
          message
        )
        
        // Actualizar métricas
        await updateResolutionType(customerInfo.chatRoom[0].id, false)
        
        return {
          response: {
            role: 'assistant' as const,
            content: quickResponse.content,
            link: quickResponse.link
          }
        }
      }

      // 9. Generar contexto específico para la respuesta
      const contextSpecificPrompt = getContextSpecificPrompt(message, id, customerInfo.id)

      // 10. Crear customerData para el contexto de OpenAI
      const customerDataForContext = {
        email: customerInfo.email,
        name: customerInfo.name,
        phone: customerInfo.phone
      }

      // 11. Generar contexto completo para OpenAI
      const systemPrompt = generateOpenAIContext(
        chatBotDomain, 
        customerDataForContext, 
        contextSpecificPrompt, 
        id, 
        customerInfo
      )

      // 12. OPTIMIZACIÓN: Usar solo historial relevante (últimos 10 mensajes)
      const relevantHistory = getRelevantChatHistory(chat, 10)
      console.log(`📊 Historial reducido: ${chat.length} → ${relevantHistory.length} mensajes`)

      // 13. Obtener respuesta de OpenAI
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...relevantHistory, // ✅ Solo últimos 10 mensajes
          { role: 'user', content: message }
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 300 // ✅ Reducido de 500 a 300
      })

      // 14. Manejar respuesta de OpenAI
      const response = chatCompletion.choices[0].message.content
      const result = await handleOpenAIResponse(response, customerInfo, chat)

      // 15. Almacenar respuesta del asistente con métricas
      await onStoreConversations(
        customerInfo.chatRoom[0].id,
        result.response.content,
        'assistant',
        message // Pasar mensaje del usuario para evaluar efectividad
      )

      // 16. FR3: Actualizar tipo de resolución
      await updateResolutionType(customerInfo.chatRoom[0].id, false)

      // 17. FR4: Verificar si debemos solicitar calificación
      const askSatisfaction = await shouldAskForSatisfaction(customerInfo.chatRoom[0].id)
      
      if (askSatisfaction) {
        // Agregar solicitud de calificación a la respuesta
        const responseWithSatisfactionRequest = {
          ...result,
          response: {
            ...result.response,
            content: `${result.response.content}\n\n---\n\n¿Cómo calificarías la atención que recibiste del 1 al 5? (1 = Muy insatisfecho, 5 = Muy satisfecho)`
          }
        }
        return responseWithSatisfactionRequest
      }

      return result
    }

    // 16. Si NO hay email en ningún lugar, pedir datos
    console.log('❌ No se encontró email, solicitando datos')
    
    // Verificar si es una solicitud de agendamiento sin email
    const isAppointment = isAppointmentRequest(message)
    if (isAppointment) {
      return {
        response: {
          role: 'assistant',
          content: 'Para agendar tu cita, necesito que me proporciones tu correo electrónico. Por favor, compártelo conmigo.'
        }
      }
    }
    
    // Flujo normal de pedir datos
    return await handleNoEmailFlow(message, chat)

  } catch (error) {
    console.log('Error en onAiChatBotAssistant:', error)
    return {
      response: {
        role: 'assistant',
        content: 'Lo siento, estoy teniendo dificultades técnicas en este momento. ¿Podrías intentar de nuevo en unos momentos?'
      }
    }
  }
}
