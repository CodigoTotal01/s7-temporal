'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Props = {
  stats: Array<{
    date: string
    count: number
  }>
}

const ConversationChart = ({ stats }: Props) => {
  const maxCount = Math.max(...stats.map((s) => s.count), 1)
  const totalConversations = stats.reduce((acc, curr) => acc + curr.count, 0)

  return (
    <Card className="border-porcelain shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gravel">Conversaciones</h3>
              <p className="text-xs text-ironside">Últimos 7 días</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            {totalConversations} total
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {stats.length > 0 ? (
          <div className="space-y-4">
            {/* Gráfico de barras simple */}
            <div className="flex items-end justify-between gap-2 h-40">
              {stats.map((stat, index) => {
                const heightPercent = maxCount > 0 ? (stat.count / maxCount) * 100 : 0

                return (
                  <div key={index} className="flex flex-col items-center flex-1 gap-2">
                    {/* Barra */}
                    <div className="w-full flex items-end justify-center" style={{ height: '140px' }}>
                      <div className="relative w-full max-w-[60px] flex flex-col items-center justify-end group">
                        {/* Tooltip con el número */}
                        {stat.count > 0 && (
                          <div className="absolute -top-8 bg-gravel text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {stat.count} {stat.count === 1 ? 'conversación' : 'conversaciones'}
                          </div>
                        )}
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all duration-300 cursor-pointer"
                          style={{
                            height: `${heightPercent}%`,
                            minHeight: stat.count > 0 ? '8px' : '2px'
                          }}
                        />
                        {/* Número encima de la barra */}
                        {stat.count > 0 && (
                          <span className="absolute -top-5 text-xs font-semibold text-gravel">
                            {stat.count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Etiqueta del día */}
                    <span className="text-xs text-ironside text-center truncate w-full">
                      {stat.date}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Línea de referencia */}
            <div className="border-t border-porcelain pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ironside">
                  Promedio: {(totalConversations / stats.length).toFixed(1)} por día
                </span>
                <span className="text-gravel font-medium">
                  📊 {stats.filter((s) => s.count > 0).length} días activos
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-blue-300" />
            </div>
            <p className="text-gravel font-medium mb-2">Sin datos disponibles</p>
            <p className="text-ironside text-xs">Los datos aparecerán cuando haya conversaciones</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ConversationChart

