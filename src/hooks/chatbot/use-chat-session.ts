/**
 * Hook para gestionar sesiones de usuario en el chatbot
 * Maneja tokens JWT, localStorage y reconocimiento automático
 */

import { useState, useEffect } from 'react'

interface SessionData {
  customerId: string
  email: string
  name?: string
  expiresAt: string
}

interface ChatSession {
  token: string | null
  data: SessionData | null
  isAuthenticated: boolean
}

export const useChatSession = () => {
  const [session, setSession] = useState<ChatSession>({
    token: null,
    data: null,
    isAuthenticated: false
  })

  // Cargar sesión desde localStorage al montar
  useEffect(() => {
    loadSession()
  }, [])

  /**
   * Carga la sesión desde localStorage si existe
   */
  const loadSession = () => {
    try {
      const token = localStorage.getItem('lunari_session_token')
      const dataStr = localStorage.getItem('lunari_session_data')

      if (token && dataStr) {
        const data = JSON.parse(dataStr) as SessionData
        
        // Verificar si no ha expirado
        const expiresAt = new Date(data.expiresAt)
        const now = new Date()

        if (expiresAt > now) {
          setSession({
            token,
            data,
            isAuthenticated: true
          })
          console.log('✅ Sesión recuperada:', data.email)
          
          // Calcular días restantes
          const daysRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          console.log(`⏰ Sesión expira en ${daysRemaining} días`)
          
          return true
        } else {
          console.log('⏰ Sesión expirada, limpiando...')
          clearSession()
          return false
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar sesión:', error)
      clearSession()
    }
    return false
  }

  /**
   * Guarda una nueva sesión en localStorage
   */
  const saveSession = (token: string, data: SessionData) => {
    try {
      localStorage.setItem('lunari_session_token', token)
      localStorage.setItem('lunari_session_data', JSON.stringify(data))
      
      setSession({
        token,
        data,
        isAuthenticated: true
      })

      console.log('💾 Sesión guardada:', data.email)
    } catch (error) {
      console.error('❌ Error al guardar sesión:', error)
    }
  }

  /**
   * Limpia la sesión actual
   */
  const clearSession = () => {
    try {
      localStorage.removeItem('lunari_session_token')
      localStorage.removeItem('lunari_session_data')
      
      setSession({
        token: null,
        data: null,
        isAuthenticated: false
      })

      console.log('🗑️ Sesión limpiada')
    } catch (error) {
      console.error('❌ Error al limpiar sesión:', error)
    }
  }

  /**
   * Actualiza la sesión con un nuevo token (refresh)
   */
  const updateSession = (newToken: string) => {
    if (session.data) {
      saveSession(newToken, session.data)
      console.log('🔄 Token actualizado')
    }
  }

  return {
    // Estado
    session,
    token: session.token,
    sessionData: session.data,
    isAuthenticated: session.isAuthenticated,
    
    // Funciones
    saveSession,
    clearSession,
    updateSession,
    loadSession,
  }
}

