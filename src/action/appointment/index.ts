'use server'

import { client } from "@/lib/prisma"

export const onDomainCustomerResponses = async (customerId: string) => {
    try {
        const customerQuestions = await client.customer.findUnique({
            where: {
                id: customerId,
            },
            select: {
                email: true,
                questions: {
                    select: {
                        id: true,
                        question: true,
                        answered: true,
                    },
                },
            },
        })

        if (customerQuestions) {
            return customerQuestions
        }
    } catch (error) {
        console.log(error)
    }
}

export const onGetAllDomainBookings = async (domainId: string) => {
    try {
        const bookings = await client.bookings.findMany({
            where: {
                domainId,
            },
            select: {
                slot: true,
                date: true,
            },
        })

        if (bookings) {
            return bookings
        }
    } catch (error) {
        console.log(error)
    }
}


export const onBookNewAppointment = async (
    domainId: string,
    customerId: string,
    slot: string,
    date: string,
    email: string
) => {
    try {
        const booking = await client.customer.update({
            where: {
                id: customerId,
            },
            data: {
                booking: {
                    create: {
                        domainId,
                        slot,
                        date,
                        email,
                    },
                },
            },
        })

        if (booking) {
            return { status: 200, message: 'Reunión reservada' }
        }
    } catch (error) {
        console.log(error)
    }
}

export const saveAnswers = async (
    questions: [question: string],
    customerId: string
) => {
    try {
        for (const question in questions) {
            await client.customer.update({
                where: { id: customerId },
                data: {
                    questions: {
                        update: {
                            where: {
                                id: question,
                            },
                            data: {
                                answered: questions[question],
                            },
                        },
                    },
                },
            })
        }
        return {
            status: 200,
            messege: 'Respuestas actualizadas',
        }
    } catch (error) {
        console.log(error)
    }
}

export const onGetAllBookingsForCurrentUser = async (clerkId: string) => {
    try {
        const bookings = await client.bookings.findMany({
            where: {
                Customer: {
                    Domain: {
                        User: {
                            clerkId,
                        },
                    },
                },
            },
            select: {
                id: true,
                slot: true,
                createdAt: true,
                date: true,
                email: true,
                domainId: true,
                Customer: {
                    select: {
                        name: true,
                        email: true,
                        Domain: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        })

        if (bookings) {
            return {
                bookings,
            }
        }
        
        // Retornar array vacío si no hay bookings
        return {
            bookings: [],
        }
    } catch (error) {
        console.log('Error getting bookings:', error)
        // Retornar array vacío en caso de error para evitar fallos en build
        return {
            bookings: [],
        }
    }
}

export const onGetAvailableTimeSlotsForDay = async (domainId: string, date: Date) => {
    try {
        // Obtener el día de la semana (0 = Domingo, 1 = Lunes, etc)
        const dayOfWeekNumber = date.getDay()
        
        // Mapear a nuestro enum
        const dayMapping = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
        const dayOfWeek = dayMapping[dayOfWeekNumber]
        
        // Obtener el horario configurado para este día
        const schedule = await client.availabilitySchedule.findUnique({
            where: {
                domainId_dayOfWeek: {
                    domainId,
                    dayOfWeek: dayOfWeek as any,
                },
            },
            select: {
                timeSlots: true,
                isActive: true,
            },
        })
        
        if (schedule && schedule.isActive) {
            return {
                status: 200,
                timeSlots: schedule.timeSlots,
            }
        }
        
        // Si no hay horarios configurados, retornar array vacío
        return {
            status: 200,
            timeSlots: [],
        }
    } catch (error) {
        console.log('Error getting time slots:', error)
        return {
            status: 400,
            timeSlots: [],
        }
    }
}