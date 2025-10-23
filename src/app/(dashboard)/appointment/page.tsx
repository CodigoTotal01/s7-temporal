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
      <div className="w-full h-full overflow-y-auto">
        <div className="w-full p-4 md:p-6">
          {/* Header principal */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-orange" />
              </div>
              <div>
                <h2 className="font-bold text-xl md:text-2xl text-gray-900">Gestión de Citas</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Administra todas tus citas programadas y revisa la agenda del día
                </p>
              </div>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-orange/20 via-orange/40 to-orange/20"></div>
          </div>

          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-orange/10 rounded-full flex items-center justify-center">
                <CalendarDays className="w-8 h-8 text-orange" />
              </div>
              <p className="text-gray-900 text-lg font-medium">Sin citas programadas</p>
              <p className="text-gray-600 text-sm">No hay citas registradas en este momento</p>
            </div>
          </div>
        </div>
      </div>
    )

  const bookingsExistToday = domainBookings.bookings.filter(
    (booking) => booking.date.getDate() === today.getDate()
  )

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="w-full p-4 md:p-6">
        {/* Header principal */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-orange" />
            </div>
            <div>
              <h2 className="font-bold text-xl md:text-2xl text-gray-900">Gestión de Citas</h2>
              <p className="text-sm text-gray-600 mt-1">
                Administra todas tus citas programadas y revisa la agenda del día
              </p>
            </div>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-orange/20 via-orange/40 to-orange/20"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 border border-gray-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-orange" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Todas las Citas</h3>
                  <p className="text-sm text-gray-600">Gestiona todas tus citas programadas</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <AllAppointments bookings={domainBookings?.bookings} />
              </div>
            </div>
          </div>

          <div className="col-span-1">
            <div className="bg-white rounded-xl p-6 border border-gray-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Citas para Hoy</h3>
                  <p className="text-sm text-gray-600">Agenda del día {today.toLocaleDateString('es-ES', {
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
                                <AvatarFallback className="bg-peach text-gravel font-semibold">{(booking.Customer?.name || booking.email)?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gravel truncate">{booking.Customer?.name || 'Sin nombre'}</p>
                                <p className="text-xs text-gray-500 truncate">{booking.email}</p>
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
                  <div className="w-16 h-16 mx-auto bg-orange/10 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-orange" />
                  </div>
                  <p className="text-gray-900 font-medium mb-2">Sin citas para hoy</p>
                  <p className="text-gray-600 text-sm">¡Disfruta de un día tranquilo!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page
