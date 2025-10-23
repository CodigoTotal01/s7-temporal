import React from 'react'
import { currentUser } from '@clerk/nextjs'
import {
  onGetDashboardMetrics,
  onGetUrgentChats,
  onGetUpcomingAppointments,
  onGetRecentActivity,
  onGetConversationStats,
  onGetWeeklyStats,
  onGetUserInfo,
  onGetQualityMetrics
} from '@/action/dashboard'
import KPICards from '@/components/dashboard/kpi-cards'
import UrgentChats from '@/components/dashboard/urgent-chats'
import UpcomingAppointments from '@/components/dashboard/upcoming-appointments'
import RecentActivity from '@/components/dashboard/recent-activity'
import ConversationChart from '@/components/dashboard/conversation-chart'
import WeeklyStats from '@/components/dashboard/weekly-stats'
import QualityMetrics from '@/components/dashboard/quality-metrics'
import { Sparkles } from 'lucide-react'

// Forzar SSR para evitar error en build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {}

const DashboardPage = async (props: Props) => {
  const user = await currentUser()

  if (!user) return null

  // Obtener todos los datos en paralelo
  const [userInfo, metrics, urgentChats, appointments, activities, conversationStats, weeklyStats, qualityMetrics] =
    await Promise.all([
      onGetUserInfo(),
      onGetDashboardMetrics(),
      onGetUrgentChats(),
      onGetUpcomingAppointments(),
      onGetRecentActivity(),
      onGetConversationStats(),
      onGetWeeklyStats(),
      onGetQualityMetrics()
    ])

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange to-orange/70 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gravel">
                ¡Bienvenido, {userInfo?.fullname || 'Usuario'}!
              </h1>
              <p className="text-ironside text-sm">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards metrics={metrics} />

        {/* Chats Urgentes y Próximas Citas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UrgentChats urgentChats={urgentChats} />
          <UpcomingAppointments appointments={appointments} />
        </div>

        {/* Gráfico de Conversaciones y Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversationChart stats={conversationStats} />
          <RecentActivity activities={activities} />
        </div>

        {/* Estadísticas de la Semana */}
        <WeeklyStats stats={weeklyStats} />

        {/* Métricas de Calidad - Fichas de Registro para Tesis */}
        {/* <QualityMetrics metrics={qualityMetrics} /> */}
      </div>
    </div>
  )
}

export default DashboardPage 