import axios from "axios"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import React from "react"

export const useMercadoPago = () => {
  const [loading, setLoading] = useState(false)

  const connectMercadoPago = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/mercadopago/connect?action=connect')
      
      if (response.data?.url) {
        // Abrir la documentación de Mercado Pago en una nueva pestaña
        window.open(response.data.url, '_blank')
      }
      
      return response.data
    } catch (error) {
      console.error('Error conectando con Mercado Pago:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const disconnectMercadoPago = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/mercadopago/connect?action=disconnect')
      return response.data
    } catch (error) {
      console.error('Error desconectando Mercado Pago:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { connectMercadoPago, disconnectMercadoPago, loading }
}

export const useMercadoPagoCustomer = (amount: number, products?: any[]) => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [loadForm, setLoadForm] = useState(true)

  React.useEffect(() => {
    const createPreference = async () => {
      try {
        setLoadForm(true)
        
        // Usar productos reales si están disponibles, sino crear un item genérico
        const items = products && products.length > 0 
          ? products.map(product => ({
              name: product.name,
              price: product.price,
              quantity: 1
            }))
          : [{
              name: 'Pago de servicio',
              price: amount,
              quantity: 1
            }]

        const response = await axios.post('/api/mercadopago/create-preference', {
          items,
          customerId: 'customer',
          domainId: 'domain'
        })

        if (response.data?.init_point) {
          setPreferenceId(response.data.init_point)
        }
      } catch (error) {
        console.error('Error creando preferencia:', error)
      } finally {
        setLoadForm(false)
      }
    }

    if (amount) {
      createPreference()
    }
  }, [amount, products])

  return { preferenceId, loadForm }
}

export const useCompleteCustomerPayment = (onNext: () => void) => {
  const [processing, setProcessing] = useState<boolean>(false)
  const { toast } = useToast()

  const onMakePayment = async (e: React.MouseEvent) => {
    e.preventDefault()

    console.log('no reload')

    try {
      setProcessing(true)

      // Crear preferencia de pago con Mercado Pago
      const response = await axios.post('/api/mercadopago/create-preference', {
        items: [
          {
            name: 'Pago de servicio',
            price: 100, // Precio fijo o se puede obtener del contexto
            quantity: 1
          }
        ],
        customerId: 'customer',
        domainId: 'domain'
      })

      if (response.data?.init_point) {
        // Simular confirmación de pago exitosa (como Stripe)
        // En un caso real, esto se manejaría con webhooks
        toast({
          title: 'Pago exitoso',
          description: 'Pago completado',
        })
        onNext()
      } else {
        throw new Error('No se pudo crear la preferencia de pago')
      }

      setProcessing(false)
    } catch (error) {
      console.log(error)
      setProcessing(false)
    }
  }

  return { processing, onMakePayment }
} 