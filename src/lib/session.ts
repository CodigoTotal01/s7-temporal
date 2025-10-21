/**
 * Sistema de Gestión de Sesiones con JWT
 * Permite reconocimiento automático de usuarios sin login obligatorio
 */

import jwt from 'jsonwebtoken'
import { client } from '@/lib/prisma'

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface SessionData {
  customerId: string
  email: string
  name?: string
  phone?: string
  domainId: string
  chatRoomId: string
}

export interface SessionToken {
  token: string
  expiresAt: Date
  sessionData: SessionData
}

// ============================================
// CONFIGURACIÓN
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'lunari-ai-secret-key-change-in-production'
const TOKEN_EXPIRATION = '30d' // 30 días

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Genera un token JWT para el usuario identificado
 * Este token se envía al frontend para almacenar en localStorage
 */
export const generateSessionToken = async (
  customerId: string,
  email: string,
  domainId: string,
  chatRoomId: string
): Promise<SessionToken> => {
  try {
    // Obtener datos completos del cliente
    const customer = await client.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      }
    })

    if (!customer) {
      throw new Error('Customer not found')
    }

    // Datos que se incluyen en el token
    const payload: SessionData = {
      customerId: customer.id,
      email: customer.email || email,
      name: customer.name || undefined,
      phone: customer.phone || undefined,
      domainId,
      chatRoomId,
    }

    // Generar token JWT
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION,
      issuer: 'lunari-ai',
      subject: customer.id,
    })

    // Calcular fecha de expiración
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 días

    console.log(`🔐 Token generado para: ${customer.email} (ID: ${customer.id})`)

    return {
      token,
      expiresAt,
      sessionData: payload,
    }
  } catch (error) {
    console.error('Error al generar token de sesión:', error)
    throw error
  }
}

/**
 * Valida un token JWT y retorna los datos de sesión
 * Se llama al inicio de cada conversación si existe token
 */
export const validateSessionToken = async (
  token: string
): Promise<SessionData | null> => {
  try {
    // Verificar y decodificar token
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'lunari-ai',
    }) as SessionData

    // Verificar que el cliente aún existe en BD
    const customer = await client.customer.findUnique({
      where: { id: decoded.customerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
      }
    })

    if (!customer || !customer.status) {
      console.log('❌ Token válido pero cliente no existe o inactivo')
      return null
    }

    console.log(`✅ Sesión válida para: ${customer.email}`)

    // Retornar datos actualizados de la BD
    return {
      customerId: customer.id,
      email: customer.email || decoded.email,
      name: customer.name || decoded.name,
      phone: customer.phone || decoded.phone,
      domainId: decoded.domainId,
      chatRoomId: decoded.chatRoomId,
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('⏰ Token expirado')
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('❌ Token inválido')
    } else {
      console.error('Error al validar token:', error)
    }
    return null
  }
}

/**
 * Recupera los datos completos del cliente desde el token
 * Incluye chatRoom e historial si es necesario
 */
export const getCustomerFromToken = async (
  token: string,
  domainId: string
): Promise<any | null> => {
  try {
    // Validar token
    const sessionData = await validateSessionToken(token)
    if (!sessionData) {
      return null
    }

    // Obtener datos completos del cliente
    const customer = await client.customer.findUnique({
      where: { id: sessionData.customerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        totalInteractions: true,
        lastActiveAt: true,
        chatRoom: {
          where: {
            Customer: {
              domainId: domainId
            }
          },
          select: {
            id: true,
            live: true,
            mailed: true,
            satisfactionCollected: true,
            resolutionType: true,
            satisfactionRating: true,
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!customer) {
      return null
    }

    console.log(`📊 Cliente recuperado: ${customer.name || customer.email} (${customer.totalInteractions} interacciones)`)

    return customer
  } catch (error) {
    console.error('Error al recuperar cliente desde token:', error)
    return null
  }
}

/**
 * Refresca un token existente si está por expirar
 * Se llama automáticamente si el token tiene menos de 7 días de vida
 */
export const refreshTokenIfNeeded = async (
  token: string
): Promise<SessionToken | null> => {
  try {
    const decoded = jwt.decode(token) as any
    
    if (!decoded || !decoded.exp) {
      return null
    }

    // Verificar si expira en menos de 7 días
    const expirationDate = new Date(decoded.exp * 1000)
    const daysUntilExpiration = (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)

    if (daysUntilExpiration > 7) {
      console.log('🔄 Token aún válido, no requiere refresh')
      return null // No necesita refresh
    }

    console.log(`🔄 Token próximo a expirar (${daysUntilExpiration.toFixed(1)} días), refrescando...`)

    // Validar token actual
    const sessionData = await validateSessionToken(token)
    if (!sessionData) {
      return null
    }

    // Generar nuevo token
    const newToken = await generateSessionToken(
      sessionData.customerId,
      sessionData.email,
      sessionData.domainId,
      sessionData.chatRoomId
    )

    return newToken
  } catch (error) {
    console.error('Error al refrescar token:', error)
    return null
  }
}

/**
 * Invalida un token (logout)
 * Nota: JWT no puede ser realmente invalidado sin una blacklist,
 * pero podemos marcar al usuario como inactivo en BD
 */
export const invalidateSession = async (customerId: string): Promise<void> => {
  try {
    // En una implementación completa, aquí se agregaría el token a una blacklist
    // Por ahora, solo registramos el evento
    console.log(`🚪 Sesión invalidada para cliente: ${customerId}`)
    
    // Opcional: Actualizar última actividad
    await client.customer.update({
      where: { id: customerId },
      data: {
        lastActiveAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error al invalidar sesión:', error)
  }
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Verifica si un token está próximo a expirar
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) return true

    const expirationDate = new Date(decoded.exp * 1000)
    const daysUntilExpiration = (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)

    return daysUntilExpiration <= 7
  } catch {
    return true
  }
}

/**
 * Extrae el email desde un token sin validarlo
 * Útil para logging/debugging
 */
export const getEmailFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token) as SessionData
    return decoded?.email || null
  } catch {
    return null
  }
}

