'use client'

import React from 'react'
import { User, LogOut } from 'lucide-react'

interface SessionIndicatorProps {
  sessionData: {
    customerId: string
    email: string
    name?: string
    expiresAt: string
  } | null
  isAuthenticated: boolean
  onClearSession?: () => void
}

/**
 * Componente que muestra el estado de la sesión del usuario
 * Indica visualmente cuando el usuario está identificado
 */
const SessionIndicator: React.FC<SessionIndicatorProps> = ({
  sessionData,
  isAuthenticated,
  onClearSession
}) => {
  if (!isAuthenticated || !sessionData) {
    return null
  }

  const displayName = sessionData.name || sessionData.email

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
      {/* Usuario identificado - MÁS ESPACIOSO */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-3 h-3 text-white" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-xs font-semibold text-green-900 truncate">
            {displayName}
          </span>
          <span className="text-[10px] text-green-600">
            Sesión activa
          </span>
        </div>
      </div>

      {/* Botón de logout - MÁS VISIBLE */}
      {onClearSession && (
        <button
          onClick={onClearSession}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-green-700 hover:text-green-900 hover:bg-green-100 rounded-md transition-colors flex-shrink-0"
          title="Cerrar sesión"
        >
          <LogOut className="w-3 h-3" />
          <span>Salir</span>
        </button>
      )}
    </div>
  )
}

export default SessionIndicator

