'use client'
import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/loader'
import { useToast } from '@/components/ui/use-toast'
import { MERCADOPAGO_CONFIG } from '@/lib/mercadopago-config'

interface MercadoPagoButtonProps {
  preferenceId: string
  onSuccess?: () => void
  onError?: () => void
  amount: number
  disabled?: boolean
}

declare global {
  interface Window {
    Mercadopago: any
  }
}

export const MercadoPagoButton: React.FC<MercadoPagoButtonProps> = ({
  preferenceId,
  onSuccess,
  onError,
  amount,
  disabled = false
}) => {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [sdkLoaded, setSdkLoaded] = React.useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Cargar el SDK de Mercado Pago
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.onload = () => {
      setSdkLoaded(true)
    }
    script.onerror = () => {
      console.error('Error cargando SDK de Mercado Pago')
      toast({
        title: 'Error',
        description: 'No se pudo cargar el sistema de pago',
        variant: 'destructive'
      })
    }
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [toast])

  useEffect(() => {
    if (sdkLoaded && buttonRef.current && preferenceId) {
      try {
        // Inicializar Mercado Pago
        const mp = new window.Mercadopago(MERCADOPAGO_CONFIG.PUBLIC_KEY)
        
        // Crear el botón de pago con diseño oficial
        mp.checkout({
          preference: {
            id: preferenceId
          },
          render: {
            container: buttonRef.current,
            label: 'Pagar con Mercado Pago'
          },
          theme: {
            elementsColor: '#009EE3',
            headerColor: '#009EE3'
          }
        })
      } catch (error) {
        console.error('Error inicializando Mercado Pago:', error)
        toast({
          title: 'Error',
          description: 'No se pudo inicializar el sistema de pago',
          variant: 'destructive'
        })
      }
    }
  }, [sdkLoaded, preferenceId, toast])

  const handleManualPayment = async () => {
    if (!preferenceId) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el formulario de pago',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      // Redirigir directamente a Mercado Pago
      window.location.href = preferenceId
    } catch (error) {
      console.error('Error redirigiendo a Mercado Pago:', error)
      toast({
        title: 'Error',
        description: 'No se pudo procesar el pago',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Botón automático del SDK de Mercado Pago */}
      <div ref={buttonRef} className="w-full" />
      
      {/* Botón manual como fallback con diseño de Mercado Pago */}
      <Button
        onClick={handleManualPayment}
        disabled={disabled || loading || !preferenceId}
        className="w-full bg-[#009EE3] hover:bg-[#0078A3] text-white font-semibold py-4 text-lg rounded-lg shadow-lg transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, #009EE3 0%, #0078A3 100%)',
          border: 'none',
          boxShadow: '0 4px 15px rgba(0, 158, 227, 0.3)'
        }}
      >
        <Loader loading={loading}>
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#009EE3] text-sm font-bold">MP</span>
            </div>
            <span>Pagar S/ {amount.toFixed(2)} con Mercado Pago</span>
          </div>
        </Loader>
      </Button>
      
      {/* Información de métodos de pago con diseño de Mercado Pago */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-[#009EE3] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">MP</span>
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Métodos de pago disponibles</h4>
            <p className="text-sm text-gray-600">Pago seguro y rápido</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xl">💳</span>
            <div>
              <p className="font-medium text-sm">Tarjetas</p>
              <p className="text-xs text-gray-500">Visa, Mastercard</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xl">📱</span>
            <div>
              <p className="font-medium text-sm">Yape & Plin</p>
              <p className="text-xs text-gray-500">Pago móvil</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xl">🏦</span>
            <div>
              <p className="font-medium text-sm">Transferencia</p>
              <p className="text-xs text-gray-500">Bancaria</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xl">💰</span>
            <div>
              <p className="font-medium text-sm">Efectivo</p>
              <p className="text-xs text-gray-500">PagoFácil</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">🔒</span>
            <div>
              <p className="font-medium text-blue-800 text-sm">Pago 100% seguro</p>
              <p className="text-blue-700 text-xs">Protegido por Mercado Pago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 