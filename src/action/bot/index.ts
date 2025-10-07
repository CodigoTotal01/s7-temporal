'use server'

import { client } from '@/lib/prisma'
import { onRealTimeChat } from '../conversation'
import { clerkClient } from '@clerk/nextjs'
import { extractEmailsFromString, extractURLfromString } from '@/lib/utils'
import { onMailer } from '../mailer'
import OpenAi from 'openai'

const openai = new OpenAi({
  apiKey: process.env.OPEN_AI_KEY,
})

export const onStoreConversations = async (
  id: string,
  message: string,
  role: 'user' | 'assistant'
) => {
  await client.chatRoom.update({
    where: {
      id,
    },
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

// ===== FUNCIONES AUXILIARES =====

/**
 * Extrae información del cliente (email, nombre y teléfono) del mensaje
 */
const extractCustomerData = (message: string): CustomerData => {
  const email = extractEmailsFromString(message)?.[0]
  
  // Extraer nombre
  let name: string | undefined
  // Mejorar el patrón para que se detenga antes de palabras clave
  const namePattern = /(?:me llamo|soy|mi nombre es|llámame)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+(?:mi|correo|email|celular|teléfono|es|@)|\s*$)/i
  const nameMatch = message.match(namePattern)
  if (nameMatch) {
    name = nameMatch[1].trim()
    // Limpiar el nombre de caracteres no deseados
    name = name.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '').trim()
    // Asegurar que no esté vacío y tenga al menos 2 caracteres
    if (name.length < 2) {
      name = undefined
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
                questions: true,
                chatRoom: {
            select: { id: true, live: true, mailed: true }
          }
        }
      }
    }
  })

  if (!existingCustomer?.customer.length) {
          const newCustomer = await client.domain.update({
      where: { id: domainId },
            data: {
              customer: {
                create: {
            email: customerData.email,
            name: customerData.name,
            phone: customerData.phone,
            status: true, // Boolean en lugar de String
            totalInteractions: 1,
            lastActiveAt: new Date(),
            questions: { create: filterQuestions },
            chatRoom: { create: {} }
          }
        }
      }
    })
    return { customer: newCustomer, isNew: true }
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
 * Genera el contexto para OpenAI basado en los datos del dominio
 */
const generateOpenAIContext = (
  chatBotDomain: ChatBotDomain,
  customerData: CustomerData,
  contextSpecificPrompt: string,
  domainId: string
): string => {
        const helpdeskContext = chatBotDomain.helpdesk.length > 0
          ? `\n\nPREGUNTAS FRECUENTES DISPONIBLES:\n${chatBotDomain.helpdesk.map(h => `- ${h.question}`).join('\n')}`
          : ''

        const productsContext = chatBotDomain.products.length > 0
          ? `\n\nPRODUCTOS DISPONIBLES:\n${chatBotDomain.products.map(p => `- ${p.name}: S/ ${p.price}`).join('\n')}`
          : ''

        const filterQuestionsContext = chatBotDomain.filterQuestions.length > 0
          ? `\n\nPREGUNTAS PARA CAPTURAR INFORMACIÓN:\n${chatBotDomain.filterQuestions.map(q => `- ${q.question}`).join('\n')}`
          : ''

  return `Eres **Lunari AI**, un asistente virtual inteligente y profesional. Tu objetivo es proporcionar una experiencia excepcional al cliente.

## CARACTERÍSTICAS PRINCIPALES:
- Eres amigable, profesional y siempre servicial
- Respondes en español de manera natural y conversacional
- Tienes conocimiento completo sobre los productos y servicios de ${chatBotDomain.name}
- Puedes responder preguntas frecuentes, mostrar productos y agendar citas
- Eres proactivo en sugerir soluciones y opciones relevantes

## REGLAS DE INTERACCIÓN:
1. **Personalización**: SIEMPRE usa el nombre del cliente si lo tienes disponible
2. **Contexto**: Mantén coherencia con la conversación anterior
3. **URLs**: NUNCA generes IDs aleatorios, usa los IDs reales del sistema
4. **Confirmación**: Siempre confirma información antes de proceder
5. **Tono**: Adapta el tono según el contexto (formal para pagos, amigable para citas)
6. **INFORMACIÓN REAL**: NUNCA inventes productos, servicios o información que no esté configurada en el sistema

## CAPACIDADES ESPECÍFICAS:
1. **RESPUESTAS A PREGUNTAS FRECUENTES**: Puedes responder consultas sobre servicios, horarios, precios, políticas, etc.
2. **CATÁLOGO DE PRODUCTOS**: Puedes mostrar y describir productos disponibles
3. **AGENDAMIENTO DE CITAS**: Puedes guiar al cliente para reservar citas
4. **CAPTURA DE INFORMACIÓN**: Puedes hacer preguntas específicas para recopilar datos del cliente
5. **REDIRECCIÓN A PAGOS**: Puedes guiar al cliente para realizar compras

## INSTRUCCIONES ESPECÍFICAS:
- Cuando hagas una pregunta de la lista de "PREGUNTAS PARA CAPTURAR INFORMACIÓN", SIEMPRE agrega "(complete)" al final
- Si el cliente quiere agendar una cita, proporciona este enlace: http://localhost:3000/portal/${domainId}/appointment/[CUSTOMER_ID]
- Si el cliente quiere comprar productos, proporciona este enlace: http://localhost:3000/portal/${domainId}/payment/[CUSTOMER_ID]
- Si el cliente hace una pregunta inapropiada o fuera de contexto, responde "Esto está fuera de mi alcance. Déjame conectar con un representante humano para ayudarte mejor." y agrega "(realtime)" al final
- Siempre mantén un tono profesional pero cálido
- Sé proactivo en ofrecer ayuda adicional
- **IMPORTANTE**: NO pidas email si ya lo tienes. El cliente ya proporcionó su email: ${customerData.email}
- **CRÍTICO**: NUNCA inventes productos o servicios. Usa SOLO la información que está configurada en el sistema.

## CONTEXTO DEL DOMINIO:${helpdeskContext}${productsContext}${filterQuestionsContext}

${contextSpecificPrompt}

RECUERDA: Solo agrega "(complete)" cuando hagas preguntas de la lista de "PREGUNTAS PARA CAPTURAR INFORMACIÓN". Para cualquier otra pregunta o respuesta, NO uses este keyword.`
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

¡Hola! Soy Lunari AI, tu asistente virtual.

Para brindarte la mejor atención, necesito algunos datos:

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
¡Hola! Soy Lunari AI, tu asistente virtual.

Para brindarte la mejor atención, necesito algunos datos:

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
  message: string
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

    // 2. Extraer datos del cliente del mensaje
    const customerData = extractCustomerData(message)

    // 3. Si no hay email, manejar flujo de obtención de email
    if (!customerData.email) {
      console.log('No customer email provided')
      return await handleNoEmailFlow(message, chat)
    }

    // 4. Buscar o crear cliente
    const { customer: customerResult, isNew } = await findOrCreateCustomer(
      id,
      customerData,
      chatBotDomain.filterQuestions
    )

    // 5. Si es cliente nuevo, dar bienvenida
    if (isNew) {
      console.log('new customer made')
      return {
        response: {
          role: 'assistant',
          content: `¡Bienvenido ${customerData.name}! Soy Lunari AI, tu asistente virtual. Estoy aquí para ayudarte con cualquier consulta sobre nuestros servicios, productos o para agendar una cita. ¿En qué puedo ayudarte hoy?`
        }
      }
    }

    // Type assertion para manejar los diferentes tipos de retorno
    const customerResultData = customerResult as any
    
    if (!customerResultData.customer || !customerResultData.customer.length) {
      throw new Error('Customer not found')
    }

    const customerInfo = customerResultData.customer[0]

    // 5.5. Actualizar datos del cliente existente si hay información nueva
    if (!isNew) {
      await updateCustomerData(customerInfo.id, customerData)
    }

    // 6. Manejar modo tiempo real si está activo
    if (customerInfo.chatRoom[0].live) {
      await onStoreConversations(customerInfo.chatRoom[0].id, message, author)

      // Enviar notificación por email si no se ha enviado
      if (!customerInfo.chatRoom[0].mailed && customerResultData.User?.clerkId) {
        const user = await clerkClient.users.getUser(customerResultData.User.clerkId)
        onMailer(user.emailAddresses[0].emailAddress)

        await client.chatRoom.update({
          where: { id: customerInfo.chatRoom[0].id },
          data: { mailed: true }
        })
      }

      return {
        live: true,
        chatRoom: customerInfo.chatRoom[0].id
      }
    }

    // 7. Almacenar mensaje del usuario
    await onStoreConversations(customerInfo.chatRoom[0].id, message, author)

    // 8. Generar contexto específico para la respuesta
    const contextSpecificPrompt = getContextSpecificPrompt(message, id, customerInfo.id)

    // 9. Generar contexto completo para OpenAI
    const systemPrompt = generateOpenAIContext(chatBotDomain, customerData, contextSpecificPrompt, id)

    // 10. Obtener respuesta de OpenAI
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...chat,
        { role: 'user', content: message }
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 500
    })

    // 11. Manejar respuesta de OpenAI
    const response = chatCompletion.choices[0].message.content
    const result = await handleOpenAIResponse(response, customerInfo, chat)

    // 12. Almacenar respuesta del asistente
    await onStoreConversations(
      customerInfo.chatRoom[0].id,
      result.response.content,
      'assistant'
    )

    return result

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
