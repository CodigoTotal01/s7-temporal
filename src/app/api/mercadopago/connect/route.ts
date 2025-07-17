export const dynamic = "force-dynamic";
import { client } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { MercadoPagoConfig } from 'mercadopago'

// Configurar Mercado Pago
const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

export async function GET(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse('Usuario no autenticado', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'connect', 'disconnect', o 'status'

    if (action === 'status') {
      // Verificar estado actual de conexión
      const userData = await client.user.findUnique({
        where: {
          clerkId: user.id,
        },
        select: {
          stripeId: true,
        },
      })

      return NextResponse.json({
        connected: !!userData?.stripeId && userData.stripeId !== 'mercadopago-connected',
        message: userData?.stripeId && userData.stripeId !== 'mercadopago-connected'
          ? 'Usuario conectado a Mercado Pago' 
          : 'Usuario no conectado'
      })
    }

    if (action === 'disconnect') {
      // Desconectar Mercado Pago
      await client.user.update({
        where: {
          clerkId: user.id,
        },
        data: {
          stripeId: null, // Removemos la conexión
        },
      })

      return NextResponse.json({
        message: 'Mercado Pago desconectado exitosamente',
        connected: false
      })
    } else {
      // Conectar Mercado Pago (modo simulado)
      // Como no tenemos Mercado Pago Connect, marcamos como conectado simbólicamente
      await client.user.update({
        where: {
          clerkId: user.id,
        },
        data: {
          stripeId: 'mercadopago-connected',
        },
      })

      return NextResponse.json({
        url: 'https://www.mercadopago.com.pe/developers/docs',
        message: 'Mercado Pago configurado exitosamente (modo simulado)',
        connected: true
      })
    }
  } catch (error) {
    console.error('Error con Mercado Pago:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 