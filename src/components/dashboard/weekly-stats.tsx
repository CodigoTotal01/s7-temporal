import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TrendingUp, Users, MessageSquare, Calendar, Zap } from 'lucide-react'

type Props = {
  stats: {
    newCustomers: number
    totalConversations: number
    bookingsScheduled: number
    totalMessages: number
  } | null
}

const WeeklyStats = ({ stats }: Props) => {
  if (!stats) return null

  const statsData = [
    {
      label: 'Nuevos Clientes',
      value: stats.newCustomers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Conversaciones',
      value: stats.totalConversations,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Citas Agendadas',
      value: stats.bookingsScheduled,
      icon: Calendar,
      color: 'text-orange',
      bgColor: 'bg-peach'
    },
    {
      label: 'Mensajes Totales',
      value: stats.totalMessages,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <Card className="border-porcelain shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange to-orange/70 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gravel">Estadísticas de la Semana</h3>
            <p className="text-xs text-ironside">Resumen de los últimos 7 días</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bgColor} rounded-xl p-4 hover:scale-105 transition-transform duration-200`}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className={`${stat.bgColor} rounded-lg p-2`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="w-full">
                  <p className="text-2xl font-bold text-gravel">{stat.value}</p>
                  <p className="text-xs text-ironside mt-1">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default WeeklyStats

