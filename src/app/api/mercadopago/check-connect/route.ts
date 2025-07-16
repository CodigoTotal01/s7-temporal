import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Verificar si tenemos las credenciales necesarias
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY

    if (!accessToken || !publicKey) {
      return NextResponse.json({
        available: false,
        reason: 'Credenciales no configuradas',
        message: 'Configura MERCADO_PAGO_ACCESS_TOKEN y MERCADO_PAGO_PUBLIC_KEY'
      })
    }

    // Intentar hacer una llamada a la API de Connect
    try {
      const response = await fetch('https://api.mercadopago.com/authorization', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/callback/mercadopago/success`,
          state: 'test',
        }),
      })

      if (response.ok) {
        return NextResponse.json({
          available: true,
          message: 'Mercado Pago Connect está disponible',
          type: 'connect_available'
        })
      } else {
        const errorData = await response.json()
        return NextResponse.json({
          available: false,
          reason: 'API Connect no disponible',
          message: 'Mercado Pago Connect no está disponible con tu cuenta actual',
          error: errorData,
          type: 'connect_not_available'
        })
      }
    } catch (apiError) {
      return NextResponse.json({
        available: false,
        reason: 'Error de API',
        message: 'No se pudo verificar Mercado Pago Connect',
        error: apiError instanceof Error ? apiError.message : 'Error desconocido',
        type: 'api_error'
      })
    }

  } catch (error) {
    console.error('Error verificando Mercado Pago Connect:', error)
    return NextResponse.json({
      available: false,
      reason: 'Error interno',
      message: 'Error verificando disponibilidad',
      type: 'internal_error'
    })
  }
} 