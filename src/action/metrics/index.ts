'use server'

import { client } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs"

/**
 * Obtener el domainId del usuario autenticado
 */
const getUserDomainId = async (): Promise<string | null> => {
  try {
    const user = await currentUser()
    if (!user) return null

    const userDomain = await client.user.findUnique({
      where: { clerkId: user.id },
      select: {
        domains: {
          select: { id: true },
          take: 1
        }
      }
    })

    return userDomain?.domains[0]?.id || null
  } catch (error) {
    console.log('Error al obtener domainId:', error)
    return null
  }
}

/**
 * FR1: Obtener tiempo promedio de respuesta al cliente
 * Calcula el tiempo promedio en segundos desde que el usuario envía un mensaje
 * hasta que recibe la respuesta del asistente
 */
export const getAverageResponseTime = async (dateRange?: { from: Date; to: Date }) => {
  try {
    const domainId = await getUserDomainId()
    if (!domainId) return null

    const whereClause: any = {
      domainId,
    }

    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      }
    }

    // Obtener todas las métricas del dominio
    const metrics = await client.conversationMetrics.findMany({
      where: whereClause,
      select: {
        averageResponseTime: true,
        messagesCount: true,
        totalResponseTime: true,
      }
    })

    if (metrics.length === 0) {
      return {
        averageResponseTime: 0,
        totalConversations: 0,
        totalMessages: 0,
        formattedTime: '0 segundos',
      }
    }

    // Calcular el promedio ponderado considerando todos los mensajes
    const totalMessages = metrics.reduce((sum, m) => sum + m.messagesCount, 0)
    const totalTime = metrics.reduce((sum, m) => sum + m.totalResponseTime, 0)
    const averageResponseTime = totalMessages > 0 ? Math.floor(totalTime / totalMessages) : 0

    // Formatear el tiempo de manera legible
    const formatTime = (seconds: number): string => {
      if (seconds < 60) return `${seconds} segundos`
      if (seconds < 3600) return `${Math.floor(seconds / 60)} minutos`
      return `${(seconds / 3600).toFixed(1)} horas`
    }

    return {
      averageResponseTime, // En segundos
      totalConversations: metrics.length,
      totalMessages,
      formattedTime: formatTime(averageResponseTime),
    }
  } catch (error) {
    console.log('Error en getAverageResponseTime:', error)
    return null
  }
}

/**
 * FR2: Obtener porcentaje de mensajes respondidos oportunamente
 * "Oportunamente" significa que la respuesta fue efectiva (directa, sin dar vueltas)
 * basándose en criterios de calidad conversacional
 */
export const getOnTimeResponsePercentage = async (dateRange?: { from: Date; to: Date }) => {
  try {
    const domainId = await getUserDomainId()
    if (!domainId) return null

    const whereClause: any = {
      domainId,
    }

    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      }
    }

    // Obtener métricas agregadas
    const metrics = await client.conversationMetrics.findMany({
      where: whereClause,
      select: {
        messagesRespondedOnTime: true,
        totalMessagesReceived: true,
      }
    })

    if (metrics.length === 0) {
      return {
        percentage: 0,
        respondedOnTime: 0,
        totalMessages: 0,
        notRespondedOnTime: 0,
      }
    }

    const totalRespondedOnTime = metrics.reduce((sum, m) => sum + m.messagesRespondedOnTime, 0)
    const totalMessages = metrics.reduce((sum, m) => sum + m.totalMessagesReceived, 0)
    const percentage = totalMessages > 0 ? (totalRespondedOnTime / totalMessages) * 100 : 0

    return {
      percentage: Math.round(percentage * 100) / 100, // 2 decimales
      respondedOnTime: totalRespondedOnTime,
      totalMessages,
      notRespondedOnTime: totalMessages - totalRespondedOnTime,
    }
  } catch (error) {
    console.log('Error en getOnTimeResponsePercentage:', error)
    return null
  }
}

/**
 * FR3: Obtener nivel de resolución en la primera interacción
 * Calcula qué porcentaje de conversaciones se resolvieron en el primer intercambio
 * vs las que requirieron seguimiento o fueron escaladas a humano
 */
export const getFirstInteractionResolutionRate = async (dateRange?: { from: Date; to: Date }) => {
  try {
    const domainId = await getUserDomainId()
    if (!domainId) return null

    const whereClause: any = {
      Customer: { domainId },
    }

    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      }
    }

    // Obtener todas las conversaciones con su tipo de resolución
    const chatRooms = await client.chatRoom.findMany({
      where: whereClause,
      select: {
        resolutionType: true,
        resolvedInFirstInteraction: true,
      }
    })

    if (chatRooms.length === 0) {
      return {
        firstInteractionRate: 0,
        firstInteractionCount: 0,
        followUpCount: 0,
        escalatedCount: 0,
        unresolvedCount: 0,
        totalConversations: 0,
      }
    }

    const firstInteractionCount = chatRooms.filter(
      c => c.resolutionType === 'FIRST_INTERACTION'
    ).length

    const followUpCount = chatRooms.filter(
      c => c.resolutionType === 'FOLLOW_UP'
    ).length

    const escalatedCount = chatRooms.filter(
      c => c.resolutionType === 'ESCALATED'
    ).length

    const unresolvedCount = chatRooms.filter(
      c => c.resolutionType === 'UNRESOLVED'
    ).length

    const totalConversations = chatRooms.length
    const firstInteractionRate = (firstInteractionCount / totalConversations) * 100

    return {
      firstInteractionRate: Math.round(firstInteractionRate * 100) / 100,
      firstInteractionCount,
      followUpCount,
      escalatedCount,
      unresolvedCount,
      totalConversations,
    }
  } catch (error) {
    console.log('Error en getFirstInteractionResolutionRate:', error)
    return null
  }
}

/**
 * FR4: Obtener nivel de satisfacción del cliente
 * Calcula el promedio de calificaciones (1-5) y la distribución de calificaciones
 */
export const getCustomerSatisfactionAverage = async (dateRange?: { from: Date; to: Date }) => {
  try {
    const domainId = await getUserDomainId()
    if (!domainId) return null

    const whereClause: any = {
      domainId,
    }

    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      }
    }

    // Obtener todas las calificaciones
    const satisfactionRecords = await client.customerSatisfaction.findMany({
      where: whereClause,
      select: {
        rating: true,
      }
    })

    if (satisfactionRecords.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        distribution: {
          rating1: 0,
          rating2: 0,
          rating3: 0,
          rating4: 0,
          rating5: 0,
        },
        percentages: {
          rating1: 0,
          rating2: 0,
          rating3: 0,
          rating4: 0,
          rating5: 0,
        }
      }
    }

    // Calcular promedio
    const totalRatings = satisfactionRecords.length
    const sumRatings = satisfactionRecords.reduce((sum, r) => sum + r.rating, 0)
    const averageRating = sumRatings / totalRatings

    // Calcular distribución
    const distribution = {
      rating1: satisfactionRecords.filter(r => r.rating === 1).length,
      rating2: satisfactionRecords.filter(r => r.rating === 2).length,
      rating3: satisfactionRecords.filter(r => r.rating === 3).length,
      rating4: satisfactionRecords.filter(r => r.rating === 4).length,
      rating5: satisfactionRecords.filter(r => r.rating === 5).length,
    }

    // Calcular porcentajes
    const percentages = {
      rating1: Math.round((distribution.rating1 / totalRatings) * 100),
      rating2: Math.round((distribution.rating2 / totalRatings) * 100),
      rating3: Math.round((distribution.rating3 / totalRatings) * 100),
      rating4: Math.round((distribution.rating4 / totalRatings) * 100),
      rating5: Math.round((distribution.rating5 / totalRatings) * 100),
    }

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalRatings,
      distribution,
      percentages,
    }
  } catch (error) {
    console.log('Error en getCustomerSatisfactionAverage:', error)
    return null
  }
}

/**
 * Obtener todas las métricas de calidad consolidadas
 * Esta función es útil para el dashboard principal
 */
export const getQualityMetricsSummary = async (dateRange?: { from: Date; to: Date }) => {
  try {
    const [
      avgResponseTime,
      onTimePercentage,
      firstInteractionRate,
      satisfactionAverage
    ] = await Promise.all([
      getAverageResponseTime(dateRange),
      getOnTimeResponsePercentage(dateRange),
      getFirstInteractionResolutionRate(dateRange),
      getCustomerSatisfactionAverage(dateRange),
    ])

    return {
      fr1_averageResponseTime: avgResponseTime,
      fr2_onTimePercentage: onTimePercentage,
      fr3_firstInteractionRate: firstInteractionRate,
      fr4_satisfactionAverage: satisfactionAverage,
    }
  } catch (error) {
    console.log('Error en getQualityMetricsSummary:', error)
    return null
  }
}

/**
 * Obtener datos históricos para gráficos (últimos 7 días)
 */
export const getQualityMetricsHistory = async () => {
  try {
    const domainId = await getUserDomainId()
    if (!domainId) return []

    const history = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayMetrics = await getQualityMetricsSummary({
        from: date,
        to: nextDate
      })

      history.push({
        date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        fullDate: date,
        metrics: dayMetrics
      })
    }

    return history
  } catch (error) {
    console.log('Error en getQualityMetricsHistory:', error)
    return []
  }
}


