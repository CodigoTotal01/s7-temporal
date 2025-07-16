import axios from "axios"
import { useState } from "react"

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