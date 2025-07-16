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

// Función para determinar el tipo de negocio basado en los productos
const determineBusinessType = (productNames: string[]): string => {
  if (productNames.length === 0) return 'servicios generales'
  
  const text = productNames.join(' ').toLowerCase()
  
  // Detectar diferentes tipos de negocios
  if (/manta|textil|tela|ropa|vestido|camisa|pantalón|falda/i.test(text)) {
    return 'textilería y mantas'
  }
  if (/zapato|calzado|tenis|bota|sandalia/i.test(text)) {
    return 'calzado'
  }
  if (/mueble|silla|mesa|cama|sofá|estante/i.test(text)) {
    return 'mueblería'
  }
  if (/electrónic|celular|computador|laptop|tablet|televisor/i.test(text)) {
    return 'tecnología y electrónicos'
  }
  if (/alimento|comida|bebida|snack|golosina/i.test(text)) {
    return 'alimentos y bebidas'
  }
  if (/cosmético|perfume|crema|maquillaje|jabón/i.test(text)) {
    return 'cosméticos y belleza'
  }
  if (/herramient|martillo|destornillador|taladro|sierra/i.test(text)) {
    return 'herramientas y ferretería'
  }
  if (/juguete|peluche|juego|entretenimiento/i.test(text)) {
    return 'juguetes y entretenimiento'
  }
  if (/libro|revista|papelería|útiles/i.test(text)) {
    return 'libros y papelería'
  }
  if (/deport|ejercicio|gimnasio|fútbol|básquet/i.test(text)) {
    return 'artículos deportivos'
  }
  if (/jardín|planta|maceta|flor|semilla/i.test(text)) {
    return 'jardinería y plantas'
  }
  if (/automotriz|auto|carro|moto|bicicleta/i.test(text)) {
    return 'artículos automotrices'
  }
  if (/mascota|perro|gato|veterinaria/i.test(text)) {
    return 'productos para mascotas'
  }
  if (/bebé|niño|infantil|pañal|leche/i.test(text)) {
    return 'productos infantiles'
  }
  if (/construcción|cemento|ladrillo|pintura/i.test(text)) {
    return 'materiales de construcción'
  }
  if (/farmacia|medicamento|vitamina|suplemento/i.test(text)) {
    return 'farmacia y salud'
  }
  
  // Si no coincide con categorías específicas, intentar identificar por palabras clave
  const categories = [
    'ropa', 'calzado', 'accesorios', 'hogar', 'tecnología', 'alimentos', 
    'belleza', 'herramientas', 'juguetes', 'libros', 'deportes', 'jardín',
    'automotriz', 'mascotas', 'infantil', 'construcción', 'salud'
  ]
  
  for (const category of categories) {
    if (text.includes(category)) {
      return `${category} y productos relacionados`
    }
  }
  
  return 'productos diversos'
}

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

let customerEmail: string | undefined
let customerName: string | undefined
let conversationContext: string | undefined

export const onAiChatBotAssistant = async (
  id: string,
  chat: { role: 'user' | 'assistant'; content: string }[],
  author: 'user',
  message: string
) => {
  try {
    const chatBotDomain = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        helpdesk: {
          select: {
            question: true,
            answer: true,
          },
        },
        products: {
          select: {
            name: true,
            price: true,
            image: true,
          },
        },
        filterQuestions: {
          where: {
            answered: null,
          },
          select: {
            question: true,
          },
        },
      },
    })
    
    if (chatBotDomain) {
      const extractedEmail = extractEmailsFromString(message)
      if (extractedEmail) {
        customerEmail = extractedEmail[0]
      }

      // Extraer nombre del cliente si no lo tenemos
      if (!customerName && !customerEmail) {
        // Buscar patrones de nombre en el mensaje
        const namePattern = /(?:me llamo|soy|mi nombre es|llámame)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)/i
        const match = message.match(namePattern)
        if (match) {
          customerName = match[1].trim()
        }
      }

      // Determinar el contexto de la conversación
      const isPaymentRequest = /pago|pagar|comprar|adquirir|producto/i.test(message)
      const isAppointmentRequest = /cita|agendar|consulta|reunión|visita/i.test(message)
      const isGeneralQuery = /ayuda|información|consulta|pregunta/i.test(message)

      if (customerEmail) {
        const checkCustomer = await client.domain.findUnique({
          where: {
            id,
          },
          select: {
            User: {
              select: {
                clerkId: true,
              },
            },
            name: true,
            customer: {
              where: {
                email: {
                  startsWith: customerEmail,
                },
              },
              select: {
                id: true,
                email: true,
                questions: true,
                chatRoom: {
                  select: {
                    id: true,
                    live: true,
                    mailed: true,
                  },
                },
              },
            },
          },
        })
        
        if (checkCustomer && !checkCustomer.customer.length) {
          const newCustomer = await client.domain.update({
            where: {
              id,
            },
            data: {
              customer: {
                create: {
                  email: customerEmail,
                  questions: {
                    create: chatBotDomain.filterQuestions,
                  },
                  chatRoom: {
                    create: {},
                  },
                },
              },
            },
          })
          if (newCustomer) {
            console.log('new customer made')
            const response = {
              role: 'assistant',
              content: `¡Bienvenido ${customerEmail.split('@')[0]}! Soy Lunari AI, tu asistente virtual. Estoy aquí para ayudarte con cualquier consulta sobre nuestros servicios, productos o para agendar una cita. ¿En qué puedo ayudarte hoy?`,
            }
            return { response }
          }
        }
        
        if (checkCustomer && checkCustomer.customer[0].chatRoom[0].live) {
          await onStoreConversations(
            checkCustomer?.customer[0].chatRoom[0].id!,
            message,
            author
          )

          if (!checkCustomer.customer[0].chatRoom[0].mailed) {
            const user = await clerkClient.users.getUser(
              checkCustomer.User?.clerkId!
            )

            onMailer(user.emailAddresses[0].emailAddress)

            const mailed = await client.chatRoom.update({
              where: {
                id: checkCustomer.customer[0].chatRoom[0].id,
              },
              data: {
                mailed: true,
              },
            })

            if (mailed) {
              return {
                live: true,
                chatRoom: checkCustomer.customer[0].chatRoom[0].id,
              }
            }
          }
          return {
            live: true,
            chatRoom: checkCustomer.customer[0].chatRoom[0].id,
          }
        }

        await onStoreConversations(
          checkCustomer?.customer[0].chatRoom[0].id!,
          message,
          author
        )

        // Crear contexto dinámico basado en los datos del dominio
        const helpdeskContext = chatBotDomain.helpdesk.length > 0 
          ? `\n\nPREGUNTAS FRECUENTES DISPONIBLES:\n${chatBotDomain.helpdesk.map(h => `- ${h.question}`).join('\n')}`
          : ''

        const productsContext = chatBotDomain.products.length > 0
          ? `\n\nPRODUCTOS DISPONIBLES:\n${chatBotDomain.products.map(p => `- ${p.name}: S/ ${p.price}`).join('\n')}`
          : ''

        const filterQuestionsContext = chatBotDomain.filterQuestions.length > 0
          ? `\n\nPREGUNTAS PARA CAPTURAR INFORMACIÓN:\n${chatBotDomain.filterQuestions.map(q => `- ${q.question}`).join('\n')}`
          : ''

        // Detectar si está preguntando por productos específicamente - MEJORADO
        const isProductQuery = /productos?|qué tienes|catálogo|que venden|que ofrecen|qué productos|tienen productos|disponibles/i.test(message)

        // Determinar el contexto específico para la respuesta
        let contextSpecificPrompt = ''
        if (isPaymentRequest) {
          contextSpecificPrompt = `
CONTEXTO ACTUAL: El cliente está solicitando ayuda con un pago o compra.
RESPUESTA ESPERADA: Debes ayudarlo con el proceso de pago, mostrar productos disponibles si es necesario, y proporcionar el enlace de pago.
NO pidas email nuevamente, ya lo tienes.`
        } else if (isAppointmentRequest) {
          contextSpecificPrompt = `
CONTEXTO ACTUAL: El cliente está solicitando agendar una cita o consulta.
RESPUESTA ESPERADA: Debes ayudarlo con el proceso de agendamiento y proporcionar el enlace de citas.
NO pidas email nuevamente, ya lo tienes.`
        } else if (isGeneralQuery) {
          contextSpecificPrompt = `
CONTEXTO ACTUAL: El cliente está haciendo una consulta general.
RESPUESTA ESPERADA: Responde su consulta de manera útil y ofrece ayuda adicional.
NO pidas email nuevamente, ya lo tienes.`
        } else if (isProductQuery) {
          // Determinar el tipo de negocio basado en los productos
          const productNames = chatBotDomain.products.map(p => p.name.toLowerCase())
          const businessType = determineBusinessType(productNames)
          
          contextSpecificPrompt = `
CONTEXTO ACTUAL: El cliente está preguntando específicamente por los productos disponibles.
ESTRATEGIA DE RESPUESTA OBLIGATORIA: 
1. PRIMERO: Identifica y menciona el tipo de negocio (${businessType})
2. SEGUNDO: Haz preguntas específicas para entender qué busca el cliente
3. TERCERO: Recomienda productos específicos basados en sus respuestas
4. NO listes todos los productos de una vez
5. NO pidas email nuevamente, ya lo tienes: ${customerEmail}
6. NO inventes productos que no existen
7. Usa SOLO la información real de los productos configurados
8. NO des respuestas genéricas como "amplia variedad de productos"

TIPO DE NEGOCIO IDENTIFICADO: ${businessType}
TOTAL DE PRODUCTOS DISPONIBLES: ${chatBotDomain.products.length} productos

EJEMPLO DE CONVERSACIÓN OBLIGATORIO:
- "Nos especializamos en [TIPO DE NEGOCIO]. ¿Qué tipo de [CATEGORÍA] estás buscando específicamente?"
- "Perfecto, para [CATEGORÍA ESPECÍFICA] te recomiendo: [PRODUCTOS RELEVANTES]"

PRODUCTOS CONFIGURADOS EN EL SISTEMA:${productsContext}

IMPORTANTE: SI no hay productos configurados, di claramente: "Actualmente no tenemos productos configurados en nuestro catálogo, pero puedes contactarnos para más información sobre nuestros servicios."`
        }

        const chatCompletion = await openai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `Eres **Lunari AI**, un asistente virtual inteligente y profesional. Tu objetivo es proporcionar una experiencia excepcional al cliente.

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
- Si el cliente quiere agendar una cita, proporciona este enlace: http://localhost:3000/portal/${id}/appointment/${checkCustomer?.customer[0].id}
- Si el cliente quiere comprar productos, proporciona este enlace: http://localhost:3000/portal/${id}/payment/${checkCustomer?.customer[0].id}
- Si el cliente hace una pregunta inapropiada o fuera de contexto, responde "Esto está fuera de mi alcance. Déjame conectar con un representante humano para ayudarte mejor." y agrega "(realtime)" al final
- Siempre mantén un tono profesional pero cálido
- Sé proactivo en ofrecer ayuda adicional
- **IMPORTANTE**: NO pidas email si ya lo tienes. El cliente ya proporcionó su email: ${customerEmail}
- **CRÍTICO**: NUNCA inventes productos o servicios. Usa SOLO la información que está configurada en el sistema.

## FLUJOS DE CONVERSACIÓN:

### Para Citas:
1. Confirmar qué tipo de cita necesita
2. Preguntar fecha y hora preferida
3. Proporcionar enlace de agendamiento
4. Explicar el proceso

### Para Pagos:
1. Confirmar qué servicio necesita pagar
2. Verificar el monto si está disponible
3. Proporcionar enlace de pago
4. Explicar el proceso

### Para Consultas:
1. Escuchar la consulta
2. Responder de manera clara y útil
3. Ofrecer ayuda adicional si es necesario

### Para Productos:
1. Si hay productos configurados: 
   - Identifica el tipo de negocio
   - Haz preguntas específicas para entender qué busca el cliente
   - Recomienda productos relevantes basados en sus respuestas
   - NO listes todos los productos de una vez
2. Si no hay productos: Informa que no hay productos configurados actualmente
3. NO inventar productos que no existen
4. Mantén la conversación fluida y eficiente en tokens

## CONTEXTO DEL DOMINIO:${helpdeskContext}${productsContext}${filterQuestionsContext}

## EJEMPLOS DE RESPUESTAS:

### Saludo con nombre:
"¡Hola ${customerName || customerEmail?.split('@')[0] || 'cliente'}! Soy Lunari AI. ¿En qué puedo ayudarte hoy?"

### Para citas:
"${customerName || customerEmail?.split('@')[0] || 'Cliente'}, te ayudo a programar tu cita. ¿Qué tipo de consulta necesitas?"

### Para pagos:
"${customerName || customerEmail?.split('@')[0] || 'Cliente'}, entiendo que necesitas hacer un pago. ¿Qué servicio específico necesitas pagar?"

### Para productos (SI hay productos):
"${customerName || customerEmail?.split('@')[0] || 'Cliente'}, nos especializamos en [TIPO DE NEGOCIO]. ¿Qué tipo de [CATEGORÍA] estás buscando específicamente?"

### Para productos (SI NO hay productos):
"${customerName || customerEmail?.split('@')[0] || 'Cliente'}, actualmente no tenemos productos configurados en nuestro catálogo, pero puedes contactarnos para más información sobre nuestros servicios."

### Para recomendaciones de productos:
"Perfecto, para [CATEGORÍA ESPECÍFICA] te recomiendo: [PRODUCTOS RELEVANTES CON PRECIOS]"

### Generando enlace:
"${customerName || customerEmail?.split('@')[0] || 'Cliente'}, perfecto. Aquí tienes el enlace para completar tu [CITA/PAGO]. En este enlace podrás completar tus datos y finalizar el proceso."

${contextSpecificPrompt}

RECUERDA: Solo agrega "(complete)" cuando hagas preguntas de la lista de "PREGUNTAS PARA CAPTURAR INFORMACIÓN". Para cualquier otra pregunta o respuesta, NO uses este keyword.`,
            },
            ...chat,
            {
              role: 'user',
              content: message,
            },
          ],
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 500,
        })

        if (chatCompletion.choices[0].message.content?.includes('(realtime)')) {
          const realtime = await client.chatRoom.update({
            where: {
              id: checkCustomer?.customer[0].chatRoom[0].id,
            },
            data: {
              live: true,
            },
          })

          if (realtime) {
            const response = {
              role: 'assistant',
              content: chatCompletion.choices[0].message.content.replace(
                '(realtime)',
                ''
              ),
            }

            await onStoreConversations(
              checkCustomer?.customer[0].chatRoom[0].id!,
              response.content,
              'assistant'
            )

            return { response }
          }
        }
        
        if (chat[chat.length - 1]?.content.includes('(complete)')) {
          const firstUnansweredQuestion =
            await client.customerResponses.findFirst({
              where: {
                customerId: checkCustomer?.customer[0].id,
                answered: null,
              },
              select: {
                id: true,
              },
              orderBy: {
                question: 'asc',
              },
            })
          if (firstUnansweredQuestion) {
            await client.customerResponses.update({
              where: {
                id: firstUnansweredQuestion.id,
              },
              data: {
                answered: message,
              },
            })
          }
        }

        if (chatCompletion) {
          const generatedLink = extractURLfromString(
            chatCompletion.choices[0].message.content as string
          )

          if (generatedLink) {
            const link = generatedLink[0]
            // Limpiar la URL de cualquier carácter no deseado
            const cleanLink = link.replace(/[()]+$/, '').trim()
            
            const response = {
              role: 'assistant',
              content: `¡Perfecto! Puedes hacer clic en el siguiente enlace para continuar:`,
              link: cleanLink,
            }

            await onStoreConversations(
              checkCustomer?.customer[0].chatRoom[0].id!,
              `${response.content} ${response.link}`,
              'assistant'
            )

            return { response }
          }

          const response = {
            role: 'assistant',
            content: chatCompletion.choices[0].message.content,
          }

          await onStoreConversations(
            checkCustomer?.customer[0].chatRoom[0].id!,
            `${response.content}`,
            'assistant'
          )

          return { response }
        }
      }
      
      // Si no hay email del cliente, guiar para obtenerlo
      console.log('No customer email provided')
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Eres **Lunari AI**, un asistente virtual profesional y amigable. Tu objetivo principal en este momento es obtener el email del cliente de manera natural y conversacional.

## INSTRUCCIONES:
- Da una bienvenida cálida y profesional
- Si no tienes el nombre del cliente, pídelo primero
- Explica brevemente cómo puedes ayudar (consultas, productos, citas)
- Solicita el email del cliente de manera natural, explicando que es para brindarle un mejor servicio
- Mantén un tono amigable y profesional
- No seas insistente, sino servicial

## EJEMPLO DE ENFOQUE:
"¡Hola! Soy Lunari AI, tu asistente virtual. ¿Cómo te llamas? Estoy aquí para ayudarte con consultas sobre nuestros servicios, mostrar nuestros productos o agendar una cita. Para brindarte la mejor atención personalizada, ¿podrías compartir tu dirección de email?"

## TONO:
- Amigable pero profesional
- Empático con las necesidades del usuario
- Claro en las instrucciones
- Útil en las respuestas
- Personalizado usando el nombre del usuario

RECUERDA: Sé natural, amigable y profesional.`,
          },
          ...chat,
          {
            role: 'user',
            content: message,
          },
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 300,
      })

      if (chatCompletion) {
        const response = {
          role: 'assistant',
          content: chatCompletion.choices[0].message.content,
        }

        return { response }
      }
    }
  } catch (error) {
    console.log('Error en onAiChatBotAssistant:', error)
    return {
      role: 'assistant',
      content: 'Lo siento, estoy teniendo dificultades técnicas en este momento. ¿Podrías intentar de nuevo en unos momentos?',
    }
  }
}
