'use server'

import { client } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs"
import { getQualityMetricsSummary } from "@/action/metrics"

// Obtener información del usuario
export const onGetUserInfo = async () => {
    try {
        const user = await currentUser()
        if (!user) return null

        const userInfo = await client.user.findUnique({
            where: {
                clerkId: user.id
            },
            select: {
                fullname: true,
                type: true
            }
        })

        return userInfo
    } catch (error) {
        console.log('Error en onGetUserInfo:', error)
        return null
    }
}

// Obtener métricas generales del dashboard
export const onGetDashboardMetrics = async () => {
    try {
        const user = await currentUser()
        if (!user) return null

        // Obtener el dominio del usuario
        const userDomain = await client.user.findUnique({
            where: { clerkId: user.id },
            select: {
                domains: {
                    select: { id: true },
                    take: 1
                }
            }
        })

        if (!userDomain?.domains[0]) return null

        const domainId = userDomain.domains[0].id

        // Total de clientes
        const totalCustomers = await client.customer.count({
            where: { domainId }
        })

        // Conversaciones activas (chats con mensajes recientes)
        const activeConversations = await client.chatRoom.count({
            where: {
                Customer: { domainId },
                live: false,
                updatedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
                }
            }
        })

        // Citas de hoy
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todayAppointments = await client.bookings.count({
            where: {
                domainId,
                date: {
                    gte: today,
                    lt: tomorrow
                }
            }
        })

        // Chats en tiempo real (urgentes)
        const urgentChats = await client.chatRoom.count({
            where: {
                Customer: { domainId },
                live: true
            }
        })

        // Nuevos clientes esta semana
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const newCustomersThisWeek = await client.customer.count({
            where: {
                domainId,
                createdAt: {
                    gte: oneWeekAgo
                }
            }
        })

        return {
            totalCustomers,
            activeConversations,
            todayAppointments,
            urgentChats,
            newCustomersThisWeek
        }
    } catch (error) {
        console.log('Error en onGetDashboardMetrics:', error)
        return null
    }
}

// Obtener chats en tiempo real (urgentes)
export const onGetUrgentChats = async () => {
    try {
        const user = await currentUser()
        if (!user) return []

        const userDomain = await client.user.findUnique({
            where: { clerkId: user.id },
            select: {
                domains: {
                    select: { id: true },
                    take: 1
                }
            }
        })

        if (!userDomain?.domains[0]) return []

        const domainId = userDomain.domains[0].id

        const urgentChats = await client.chatRoom.findMany({
            where: {
                Customer: { domainId },
                live: true
            },
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                Customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                message: {
                    select: {
                        message: true,
                        createdAt: true,
                        role: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 5
        })

        return urgentChats
    } catch (error) {
        console.log('Error en onGetUrgentChats:', error)
        return []
    }
}

// Obtener próximas citas
export const onGetUpcomingAppointments = async () => {
    try {
        const user = await currentUser()
        if (!user) return []

        const userDomain = await client.user.findUnique({
            where: { clerkId: user.id },
            select: {
                domains: {
                    select: { id: true },
                    take: 1
                }
            }
        })

        if (!userDomain?.domains[0]) return []

        const domainId = userDomain.domains[0].id

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const appointments = await client.bookings.findMany({
            where: {
                domainId,
                date: {
                    gte: today
                }
            },
            select: {
                id: true,
                date: true,
                slot: true,
                email: true,
                createdAt: true,
                Customer: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: [
                { date: 'asc' },
                { slot: 'asc' }
            ],
            take: 10
        })

        return appointments
    } catch (error) {
        console.log('Error en onGetUpcomingAppointments:', error)
        return []
    }
}

// Obtener actividad reciente
export const onGetRecentActivity = async () => {
    try {
        const user = await currentUser()
        if (!user) return []

        const userDomain = await client.user.findUnique({
            where: { clerkId: user.id },
            select: {
                domains: {
                    select: { id: true },
                    take: 1
                }
            }
        })

        if (!userDomain?.domains[0]) return []

        const domainId = userDomain.domains[0].id

        // Obtener últimas conversaciones
        const recentChats = await client.chatRoom.findMany({
            where: {
                Customer: { domainId }
            },
            select: {
                id: true,
                createdAt: true,
                Customer: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        })

        // Obtener últimas citas
        const recentBookings = await client.bookings.findMany({
            where: {
                domainId
            },
            select: {
                id: true,
                createdAt: true,
                date: true,
                slot: true,
                email: true,
                Customer: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        })

        // Combinar y ordenar por fecha
        const activities = [
            ...recentChats.map(chat => ({
                type: 'conversation' as const,
                date: chat.createdAt,
                customerName: chat.Customer?.name || 'Sin nombre',
                customerEmail: chat.Customer?.email || 'Sin email',
                id: chat.id
            })),
            ...recentBookings.map(booking => ({
                type: 'booking' as const,
                date: booking.createdAt,
                customerName: booking.Customer?.name || 'Sin nombre',
                customerEmail: booking.Customer?.email || booking.email,
                bookingDate: booking.date,
                bookingSlot: booking.slot,
                id: booking.id
            }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10)

        return activities
    } catch (error) {
        console.log('Error en onGetRecentActivity:', error)
        return []
    }
}

// Obtener datos para el gráfico de conversaciones
export const onGetConversationStats = async () => {
    try {
        const user = await currentUser()
        if (!user) return []

        const userDomain = await client.user.findUnique({
            where: { clerkId: user.id },
            select: {
                domains: {
                    select: { id: true },
                    take: 1
                }
            }
        })

        if (!userDomain?.domains[0]) return []

        const domainId = userDomain.domains[0].id

        // Últimos 7 días
        const stats = []
        for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)
            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)

            const count = await client.chatRoom.count({
                where: {
                    Customer: { domainId },
                    createdAt: {
                        gte: date,
                        lt: nextDate
                    }
                }
            })

            stats.push({
                date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                count
            })
        }

        return stats
    } catch (error) {
        console.log('Error en onGetConversationStats:', error)
        return []
    }
}

// Obtener estadísticas de la semana
export const onGetWeeklyStats = async () => {
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

        if (!userDomain?.domains[0]) return null

        const domainId = userDomain.domains[0].id
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

        // Nuevos clientes
        const newCustomers = await client.customer.count({
            where: {
                domainId,
                createdAt: { gte: oneWeekAgo }
            }
        })

        // Total de conversaciones
        const totalConversations = await client.chatRoom.count({
            where: {
                Customer: { domainId },
                createdAt: { gte: oneWeekAgo }
            }
        })

        // Citas agendadas
        const bookingsScheduled = await client.bookings.count({
            where: {
                domainId,
                createdAt: { gte: oneWeekAgo }
            }
        })

        // Total de mensajes
        const totalMessages = await client.chatMessage.count({
            where: {
                ChatRoom: {
                    Customer: { domainId }
                },
                createdAt: { gte: oneWeekAgo }
            }
        })

        return {
            newCustomers,
            totalConversations,
            bookingsScheduled,
            totalMessages
        }
    } catch (error) {
        console.log('Error en onGetWeeklyStats:', error)
        return null
    }
}

// Obtener métricas de calidad para la tesis (FR1, FR2, FR3, FR4)
export const onGetQualityMetrics = async () => {
    try {
        const metrics = await getQualityMetricsSummary()
        return metrics
    } catch (error) {
        console.log('Error en onGetQualityMetrics:', error)
        return null
    }
}

