import { onGetAllBookingsForCurrentUser } from '@/action/appointment'
import AllAppointments from '@/components/appointment/all-appointments'
import { Section } from '@/components/section-label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock, Building2, User } from 'lucide-react'
import { currentUser } from '@clerk/nextjs'
import React from 'react'

// Forzar SSR para evitar error en build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {}

const Page = async (props: Props) => {
  const user = await currentUser()

  if (!user) return null
  const domainBookings = await onGetAllBookingsForCurrentUser(user.id)
  const today = new Date()

  if (!domainBookings)
    return (
      <div className="w-full flex justify-center items-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-peach rounded-full flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gravel text-lg font-medium">Sin citas programadas</p>
          <p className="text-ironside text-xs">No hay citas registradas en este momento</p>
        </div>
      </div>
    )

  const bookingsExistToday = domainBookings.bookings.filter(
    (booking) => booking.date.getDate() === today.getDate()
  )

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 gap-8 p-6">
        <div className="lg:col-span-2 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border border-porcelain">
            <CardHeader className="pb-6 px-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-peach rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gravel">Todas las Citas</h2>
                  <p className="text-ironside text-xs">Gestiona todas tus citas programadas</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6">
              <AllAppointments bookings={domainBookings?.bookings} />
            </CardContent>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-porcelain p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-peach rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gravel">Citas para Hoy</h3>
                <p className="text-ironside text-xs">Agenda del día {today.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>

            {bookingsExistToday.length ? (
              <div className="space-y-4">
                {bookingsExistToday.map((booking) => (
                  <Card
                    key={booking.id}
                    className="rounded-xl overflow-hidden border border-porcelain shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="w-4/12 bg-orange py-6 flex flex-col justify-center items-center text-white">
                          <Clock className="w-4 h-4 mb-1" />
                          <span className="text-lg font-bold">{booking.slot}</span>
                          <span className="text-xs opacity-90 mt-1">Hora</span>
                        </div>

                        <div className="flex flex-col flex-1">
                          <div className="flex justify-between w-full p-4 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange rounded-full"></div>
                              <p className="text-xs text-ironside">
                                Creado {booking.createdAt.getHours().toString().padStart(2, '0')}:{booking.createdAt.getMinutes().toString().padStart(2, '0')}
                                {booking.createdAt.getHours() > 12 ? 'PM' : 'AM'}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs bg-peach text-gravel border-orange">
                              <Building2 className="w-3 h-3 mr-1" />{booking.Customer?.Domain?.name}
                            </Badge>
                          </div>

                          <Separator orientation="horizontal" className="mx-4" />

                          <div className="w-full flex items-center p-4 pt-3 gap-3">
                            <Avatar className="w-10 h-10 border-2 rounded-2">
                              <AvatarFallback className="bg-peach text-gravel font-semibold">{booking.email[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gravel truncate">{booking.email}</p>
                              <p className="text-xs text-ironside flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Cliente
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-peach rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gravel font-medium mb-2">Sin citas para hoy</p>
                <p className="text-ironside text-xs">¡Disfruta de un día tranquilo!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
