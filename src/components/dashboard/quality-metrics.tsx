'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle2, Target, Star, TrendingUp, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface QualityMetricsProps {
  metrics: {
    fr1_averageResponseTime: {
      averageResponseTime: number
      totalConversations: number
      totalMessages: number
      formattedTime: string
    } | null
    fr2_onTimePercentage: {
      percentage: number
      respondedOnTime: number
      totalMessages: number
      notRespondedOnTime: number
    } | null
    fr3_firstInteractionRate: {
      firstInteractionRate: number
      firstInteractionCount: number
      followUpCount: number
      escalatedCount: number
      unresolvedCount: number
      totalConversations: number
    } | null
    fr4_satisfactionAverage: {
      averageRating: number
      totalRatings: number
      distribution: {
        rating1: number
        rating2: number
        rating3: number
        rating4: number
        rating5: number
      }
      percentages: {
        rating1: number
        rating2: number
        rating3: number
        rating4: number
        rating5: number
      }
    } | null
  } | null
}

const QualityMetrics: React.FC<QualityMetricsProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-ironside">No hay métricas disponibles</p>
      </div>
    )
  }

  const { fr1_averageResponseTime, fr2_onTimePercentage, fr3_firstInteractionRate, fr4_satisfactionAverage } = metrics

  // Determinar color según el nivel de la métrica
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceColorBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100'
    if (percentage >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* Título de la sección */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gravel">Métricas de Calidad de Atención</h2>
          <p className="text-sm text-ironside">Indicadores de rendimiento del chatbot (Fichas de Registro)</p>
        </div>
      </div>

      {/* Grid de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* FR1: Tiempo Promedio de Respuesta */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-ironside">FR1: Tiempo Promedio de Respuesta</CardTitle>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gravel">
              {fr1_averageResponseTime?.formattedTime || '0 segundos'}
            </div>
            <p className="text-xs text-ironside mt-1">
              {fr1_averageResponseTime?.totalMessages || 0} mensajes en {fr1_averageResponseTime?.totalConversations || 0} conversaciones
            </p>
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <span className="text-ironside">
                  Tiempo desde consulta hasta respuesta
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FR2: Mensajes Respondidos Oportunamente */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-ironside">FR2: Respuestas Efectivas</CardTitle>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getPerformanceColor(fr2_onTimePercentage?.percentage || 0)}`}>
              {fr2_onTimePercentage?.percentage.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-ironside mt-1">
              {fr2_onTimePercentage?.respondedOnTime || 0} de {fr2_onTimePercentage?.totalMessages || 0} mensajes
            </p>
            <div className="mt-3">
              <Progress 
                value={fr2_onTimePercentage?.percentage || 0} 
                className="h-2"
              />
            </div>
            <div className="mt-2 text-xs text-ironside">
              Respuestas directas sin dar vueltas
            </div>
          </CardContent>
        </Card>

        {/* FR3: Resolución en Primera Interacción */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-ironside">FR3: Resolución Primera Interacción</CardTitle>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getPerformanceColor(fr3_firstInteractionRate?.firstInteractionRate || 0)}`}>
              {fr3_firstInteractionRate?.firstInteractionRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-ironside mt-1">
              {fr3_firstInteractionRate?.firstInteractionCount || 0} de {fr3_firstInteractionRate?.totalConversations || 0} conversaciones
            </p>
            <div className="mt-3">
              <Progress 
                value={fr3_firstInteractionRate?.firstInteractionRate || 0} 
                className="h-2"
              />
            </div>
            <div className="mt-2 text-xs text-ironside">
              Consultas resueltas sin seguimiento
            </div>
          </CardContent>
        </Card>

        {/* FR4: Satisfacción del Cliente */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-ironside">FR4: Satisfacción del Cliente</CardTitle>
              <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className={`text-3xl font-bold ${getPerformanceColor((fr4_satisfactionAverage?.averageRating || 0) * 20)}`}>
                {fr4_satisfactionAverage?.averageRating.toFixed(1) || 0}
              </div>
              <span className="text-sm text-ironside">/ 5.0</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(fr4_satisfactionAverage?.averageRating || 0)
                      ? 'text-orange-500 fill-orange-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-ironside mt-2">
              {fr4_satisfactionAverage?.totalRatings || 0} calificaciones recibidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalles adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* FR3: Detalle de tipos de resolución */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalle de Resoluciones (FR3)</CardTitle>
            <CardDescription>Distribución por tipo de resolución</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-ironside">Primera Interacción</span>
                  <span className="text-sm font-semibold text-green-600">
                    {fr3_firstInteractionRate?.firstInteractionCount || 0}
                  </span>
                </div>
                <Progress 
                  value={(fr3_firstInteractionRate?.firstInteractionCount || 0) / (fr3_firstInteractionRate?.totalConversations || 1) * 100} 
                  className="h-2 bg-green-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-ironside">Con Seguimiento</span>
                  <span className="text-sm font-semibold text-yellow-600">
                    {fr3_firstInteractionRate?.followUpCount || 0}
                  </span>
                </div>
                <Progress 
                  value={(fr3_firstInteractionRate?.followUpCount || 0) / (fr3_firstInteractionRate?.totalConversations || 1) * 100} 
                  className="h-2 bg-yellow-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-ironside">Escalado a Humano</span>
                  <span className="text-sm font-semibold text-red-600">
                    {fr3_firstInteractionRate?.escalatedCount || 0}
                  </span>
                </div>
                <Progress 
                  value={(fr3_firstInteractionRate?.escalatedCount || 0) / (fr3_firstInteractionRate?.totalConversations || 1) * 100} 
                  className="h-2 bg-red-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-ironside">No Resuelto</span>
                  <span className="text-sm font-semibold text-gray-600">
                    {fr3_firstInteractionRate?.unresolvedCount || 0}
                  </span>
                </div>
                <Progress 
                  value={(fr3_firstInteractionRate?.unresolvedCount || 0) / (fr3_firstInteractionRate?.totalConversations || 1) * 100} 
                  className="h-2 bg-gray-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FR4: Distribución de calificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Satisfacción (FR4)</CardTitle>
            <CardDescription>Porcentaje por nivel de calificación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const key = `rating${rating}` as keyof typeof fr4_satisfactionAverage.distribution
                const count = fr4_satisfactionAverage?.distribution[key] || 0
                const percentage = fr4_satisfactionAverage?.percentages[key] || 0
                
                return (
                  <div key={rating}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gravel">{rating}</span>
                        <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                      </div>
                      <span className="text-sm font-semibold text-gravel">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={`h-2 ${getPerformanceColorBg(rating * 20)}`}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leyenda informativa */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">FR1</h4>
              <p className="text-blue-700 text-xs">Mide la velocidad de respuesta del chatbot</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">FR2</h4>
              <p className="text-blue-700 text-xs">Evalúa la efectividad y pertinencia de las respuestas</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">FR3</h4>
              <p className="text-blue-700 text-xs">Porcentaje de consultas resueltas sin seguimiento</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">FR4</h4>
              <p className="text-blue-700 text-xs">Promedio de calificaciones de clientes (1-5)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QualityMetrics


