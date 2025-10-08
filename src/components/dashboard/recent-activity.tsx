import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Activity, MessageSquare, Calendar, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

type ActivityItem = {
  type: 'conversation' | 'booking'
  date: Date
  customerName: string
  customerEmail: string
  id: string
  bookingDate?: Date
  bookingSlot?: string
}

type Props = {
  activities: ActivityItem[]
}

const RecentActivity = ({ activities }: Props) => {
  return (
    <Card className="border-porcelain shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gravel">Actividad Reciente</h3>
            <p className="text-xs text-ironside">Últimas acciones en tu negocio</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                {/* Icono */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'conversation'
                      ? 'bg-blue-50'
                      : 'bg-green-50'
                  }`}
                >
                  {activity.type === 'conversation' ? (
                    <MessageSquare
                      className={`w-5 h-5 ${
                        activity.type === 'conversation'
                          ? 'text-blue-500'
                          : 'text-green-500'
                      }`}
                    />
                  ) : (
                    <Calendar className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gravel">
                        {activity.type === 'conversation'
                          ? 'Nueva conversación'
                          : 'Cita agendada'}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-ironside flex-shrink-0" />
                        <p className="text-xs text-ironside truncate">
                          {activity.customerName}
                        </p>
                      </div>
                      {activity.type === 'booking' && activity.bookingDate && (
                        <p className="text-xs text-gravel mt-1">
                          📅 {activity.bookingDate.toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short'
                          })}{' '}
                          • {activity.bookingSlot}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-ironside whitespace-nowrap">
                      {formatDistanceToNow(activity.date, {
                        addSuffix: true,
                        locale: es
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-purple-300" />
            </div>
            <p className="text-gravel font-medium mb-2">Sin actividad reciente</p>
            <p className="text-ironside text-xs">La actividad aparecerá aquí</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivity

