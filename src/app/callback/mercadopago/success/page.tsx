import { currentUser } from '@clerk/nextjs'
import { client } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function MercadoPagoCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; state?: string; error?: string }
}) {
  const user = await currentUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }

  const { code, state, error } = searchParams

  if (error) {
    console.error('Error en callback de Mercado Pago:', error)
    redirect('/settings?error=mercadopago_connect_failed')
  }

  if (code && state) {
    try {
      // Intercambiar el código por un access token
      const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.MERCADO_PAGO_CLIENT_ID!,
          client_secret: process.env.MERCADO_PAGO_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/callback/mercadopago/success`,
        }),
      })

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        
        // Guardar el access token del usuario conectado
        await client.user.update({
          where: {
            clerkId: state, // El state contiene el ID del usuario
          },
          data: {
            stripeId: tokenData.access_token, // Guardamos el access token real
          },
        })

        redirect('/settings?success=mercadopago_connected')
      } else {
        console.error('Error intercambiando código por token')
        redirect('/settings?error=mercadopago_token_failed')
      }
    } catch (error) {
      console.error('Error en callback:', error)
      redirect('/settings?error=mercadopago_callback_failed')
    }
  }

  // Si no hay código ni error, redirigir a settings
  redirect('/settings')
} 