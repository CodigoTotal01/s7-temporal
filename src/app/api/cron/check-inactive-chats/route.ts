/**
 * Cron Job: Sistema Proactivo para FR2, FR3, FR4
 * Verifica chats y envía mensajes automáticos para métricas de tesis
 */

import { client } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    console.log('🔍 Sistema Proactivo FR2, FR3, FR4 - Verificando chats...')

    const now = new Date()
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000) // 2 minutos
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutos

    // 1. FR3: Chats donde se dio ayuda hace 2+ minutos y usuario no ha confirmado
    // First find recent help messages, then get their chat rooms
    const recentHelpMessages = await client.chatMessage.findMany({
      where: {
        role: 'assistant',
        createdAt: {
          gte: twoMinutesAgo,
          lt: new Date(twoMinutesAgo.getTime() + 2 * 60 * 1000)
        },
        message: {
          contains: 'enlace'
        }
      },
      select: {
        chatRoomId: true
      }
    })

    const helpChatRoomIds = Array.from(new Set(recentHelpMessages.map(msg => msg.chatRoomId)))

    const chatsWithRecentHelp = await client.chatRoom.findMany({
      where: {
        id: { in: helpChatRoomIds },
        conversationState: 'ACTIVE',
        satisfactionCollected: false,
        lastUserActivityAt: {
          lt: twoMinutesAgo
        }
      },
      select: {
        id: true,
        customerId: true,
        Customer: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    // 2. FR2 + FR4: Chats inactivos por 5+ minutos
    const inactiveChats = await client.chatRoom.findMany({
      where: {
        conversationState: 'ACTIVE',
        lastUserActivityAt: {
          lt: fiveMinutesAgo
        },
        satisfactionCollected: false
      },
      select: {
        id: true,
        customerId: true,
        Customer: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    console.log(`📊 FR3 - Chats con ayuda reciente: ${chatsWithRecentHelp.length}`)
    console.log(`📊 FR2+FR4 - Chats inactivos: ${inactiveChats.length}`)

    let processed = 0

    // 3. FR3: Solicitar confirmación de efectividad después de dar ayuda
    for (const chat of chatsWithRecentHelp) {
      await client.chatRoom.update({
        where: { id: chat.id },
        data: {
          conversationState: 'AWAITING_RATING',
          resolved: true
        }
      })

      await client.chatMessage.create({
        data: {
          chatRoomId: chat.id,
          message: '🤔 ¿Te fue útil la información que te proporcioné? ¿Pudiste resolver tu consulta del 1 al 5? (1 = No me ayudó, 5 = Me ayudó mucho)',
          role: 'assistant'
        }
      })

      console.log(`✅ FR3 - Efectividad solicitada: ${chat.id} (${chat.Customer?.email})`)
      processed++
    }

    // 4. FR2 + FR4: Marcar como IDLE por inactividad (SIN solicitar calificación automática)
    // ✅ NUEVA LÓGICA: NO cambiar automáticamente a AWAITING_RATING
    // Esto evita que se oculten las conversaciones
    for (const chat of inactiveChats) {
      // Evitar duplicados (si ya se procesó en FR3)
      if (chatsWithRecentHelp.find(c => c.id === chat.id)) continue

      // Solo marcar como IDLE, NO como AWAITING_RATING
      await client.chatRoom.update({
        where: { id: chat.id },
        data: {
          conversationState: 'IDLE', // Cambiar a IDLE en lugar de AWAITING_RATING
          resolved: false // NO marcar como resuelto automáticamente
        }
      })

      console.log(`✅ FR2+FR4 - Conversación marcada como IDLE: ${chat.id} (${chat.Customer?.email})`)
      processed++
    }

    return NextResponse.json({
      success: true,
      processed,
      fr3_help: chatsWithRecentHelp.length,
      fr2_fr4_inactive: inactiveChats.length,
      message: `Sistema Proactivo: ${processed} chats procesados para métricas FR2, FR3, FR4`
    })

  } catch (error) {
    console.error('❌ Error en sistema proactivo:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al procesar sistema proactivo FR2, FR3, FR4'
    }, { status: 500 })
  }
}

