import { Card, CardContent } from '@/components/ui/card'
import { Users, MessageSquare, Calendar, AlertCircle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Props = {
  metrics: {
    totalCustomers: number
    activeConversations: number
    todayAppointments: number
    urgentChats: number
    newCustomersThisWeek: number
  } | null
}

const KPICards = ({ metrics }: Props) => {
  if (!metrics) return null

  const cards = [
    {
      title: 'Total Clientes',
      value: metrics.totalCustomers,
      icon: Users,
      color: 'bg-blue-500',
      iconBg: 'bg-blue-50',
      trend: `+${metrics.newCustomersThisWeek} esta semana`,
      trendUp: true
    },
    {
      title: 'Conversaciones',
      value: metrics.activeConversations,
      icon: MessageSquare,
      color: 'bg-green-500',
      iconBg: 'bg-green-50',
      subtitle: 'Activas',
      trendUp: true
    },
    {
      title: 'Citas Hoy',
      value: metrics.todayAppointments,
      icon: Calendar,
      color: 'bg-orange',
      iconBg: 'bg-peach',
      subtitle: new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
      trendUp: false
    },
    {
      title: 'Urgentes',
      value: metrics.urgentChats,
      icon: AlertCircle,
      color: 'bg-red-500',
      iconBg: 'bg-red-50',
      subtitle: 'Requieren atención',
      urgent: metrics.urgentChats > 0,
      trendUp: false
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={`relative overflow-hidden border-porcelain shadow-sm hover:shadow-md transition-all duration-200 ${card.urgent ? 'ring-2 ring-red-500 animate-pulse' : ''
            }`}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-ironside mb-1">
                  {card.title}
                </p>
                <h3 className="text-3xl font-bold text-gravel mb-2">
                  {card.value}
                </h3>
                {card.trend && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {card.trend}
                  </Badge>
                )}
                {card.subtitle && !card.trend && (
                  <p className="text-xs text-ironside">{card.subtitle}</p>
                )}
              </div>
              <div className={`${card.iconBg} rounded-xl p-3`}>
                <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </CardContent>

          {/* Borde inferior decorativo */}
          <div className={`h-1 ${card.color}`} />
        </Card>
      ))}
    </div>
  )
}

export default KPICards

