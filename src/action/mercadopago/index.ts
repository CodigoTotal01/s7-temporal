'use server'

import { client } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

export const onGetDomainProductsAndConnectedAccountId = async (domainId: string) => {
  try {
    const domain = await client.domain.findUnique({
      where: {
        id: domainId,
      },
      include: {
        User: {
          select: {
            stripeId: true, // Usamos este campo para guardar el ID de Mercado Pago
          },
        },
        products: {
          select: {
            name: true,
            image: true,
            price: true,
          },
        },
      },
    })

    if (domain) {
      const totalAmount = domain.products.reduce((sum, product) => sum + product.price, 0)
      
      return {
        products: domain.products,
        amount: totalAmount,
        mercadopagoId: domain.User?.stripeId || null, // El ID de Mercado Pago está en stripeId
      }
    }
  } catch (error) {
    console.log('Error obteniendo productos y cuenta conectada:', error)
  }
}

export const onCreateCustomerPaymentPreference = async (
  amount: number,
  mercadopagoId: string
) => {
  try {
    // Crear preferencia de pago para el cliente
    const preference = {
      items: [
        {
          id: 'payment-item',
          title: 'Pago de servicio',
          unit_price: amount,
          quantity: 1,
          currency_id: 'PEN',
        }
      ],
      payer: {
        email: 'customer@example.com', // Se actualizará con el email real del cliente
        name: 'Cliente',
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending`,
      },
      auto_return: 'approved',
      external_reference: `payment-${Date.now()}`,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
    }

    const preferenceClient = new Preference(mercadopago)
    const response = await preferenceClient.create({ body: preference })

    if (response) {
      return { 
        preferenceId: response.id,
        initPoint: response.init_point 
      }
    }
  } catch (error) {
    console.log('Error creando preferencia de pago:', error)
  }
}
