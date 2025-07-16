'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'

type MercadoPagoButtonProps = {
  items: {
    name: string
    price: number
    quantity?: number
  }[]
  customerId: string
  domainId: string
  onSuccess?: () => void
}

export const MercadoPagoButton = ({ 
  items, 
  customerId, 
  domainId, 
  onSuccess 
}: MercadoPagoButtonProps) => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handlePayment = async () => {
    try {
      setLoading(true)

      // Crear preferencia de pago
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerId,
          domainId,
        }),
      })

      if (!response.ok) {
        throw new Error('Error creando preferencia de pago')
      }

      const data = await response.json()

      // Redirigir a Mercado Pago
      window.location.href = data.init_point

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo procesar el pago. Inténtalo de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Resumen del pago:</h3>
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>{item.name}</span>
            <span>S/ {item.price.toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>S/ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={handlePayment} 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Aceptamos tarjetas, Yape, Plin y otros métodos de pago
      </p>
    </div>
  )
} 