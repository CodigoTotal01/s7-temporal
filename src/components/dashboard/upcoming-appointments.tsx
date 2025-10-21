import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Calendar, Clock, User, Mail } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
    appointments: Array<{
        id: string
        date: Date
        slot: string
        email: string
        createdAt: Date
        Customer: {
            name: string | null
            email: string | null
        } | null
    }>
}

const UpcomingAppointments = ({ appointments }: Props) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAppointments = appointments.filter(
        (apt) => apt.date >= today && apt.date < tomorrow
    )
    const upcomingAppointments = appointments.filter((apt) => apt.date >= tomorrow)

    return (
        <Card className="border-porcelain shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-peach rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-orange" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gravel">Próximas Citas</h3>
                            <p className="text-xs text-ironside">
                                {today.toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </p>
                        </div>
                    </div>
                    <Link href="/appointment">
                        <Button variant="outline" size="sm" className="text-xs">
                            Ver todas
                        </Button>
                    </Link>
                </div>
            </CardHeader>

            <CardContent>
                {appointments.length > 0 ? (
                    <div className="space-y-3">
                        {/* Citas de HOY */}
                        {todayAppointments.length > 0 && (
                            <>
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-orange text-white">HOY</Badge>
                                    <span className="text-xs text-ironside">
                                        {todayAppointments.length} {todayAppointments.length === 1 ? 'cita' : 'citas'}
                                    </span>
                                </div>

                                {todayAppointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-start gap-3 p-4 bg-orange/5 rounded-xl border border-orange/20 hover:bg-orange/10 transition-colors"
                                    >
                                        <div className="flex flex-col items-center justify-center bg-orange text-white rounded-lg px-3 py-2 min-w-[60px]">
                                            <Clock className="w-4 h-4 mb-1" />
                                            <span className="text-sm font-bold">{appointment.slot}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Avatar className="w-8 h-8 border-2 border-orange/30">
                                                    <AvatarFallback className="bg-peach text-orange font-semibold text-xs">
                                                        {(appointment.Customer?.name || appointment.email)?.[0]?.toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gravel truncate">
                                                        {appointment.Customer?.name || 'Sin nombre'}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-xs text-ironside">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="truncate">{appointment.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Citas PRÓXIMAS */}
                        {upcomingAppointments.length > 0 && todayAppointments.length > 0 && (
                            <Separator className="my-4" />
                        )}

                        {upcomingAppointments.length > 0 && (
                            <>
                                {todayAppointments.length > 0 && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                            PRÓXIMAS
                                        </Badge>
                                    </div>
                                )}

                                {upcomingAppointments.slice(0, 5).map((appointment) => {
                                    const aptDate = new Date(appointment.date)
                                    const isTomorrow = aptDate.toDateString() === tomorrow.toDateString()

                                    let dateLabel = aptDate.toLocaleDateString('es-ES', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short'
                                    })
                                    if (isTomorrow) dateLabel = 'Mañana'

                                    return (
                                        <div
                                            key={appointment.id}
                                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-porcelain hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex flex-col items-center justify-center bg-gravel text-white rounded-lg px-3 py-2 min-w-[60px]">
                                                <Clock className="w-3 h-3 mb-1" />
                                                <span className="text-xs font-bold">{appointment.slot}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Avatar className="w-7 h-7">
                                                        <AvatarFallback className="bg-porcelain text-gravel font-semibold text-xs">
                                                            {(appointment.Customer?.name || appointment.email)?.[0]?.toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-medium text-gravel truncate">
                                                            {appointment.Customer?.name || 'Sin nombre'}
                                                        </p>
                                                        <p className="text-xs text-ironside">{dateLabel}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto bg-peach rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gravel font-medium mb-2">Sin citas próximas</p>
                        <p className="text-ironside text-xs">No hay citas agendadas por el momento</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default UpcomingAppointments

