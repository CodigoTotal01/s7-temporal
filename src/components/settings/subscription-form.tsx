'use client'
import { Loader } from '@/components/loader'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { MercadoPagoSubscriptionCard } from './mercadopago-subscription-card'
import { useToast } from '@/components/ui/use-toast'

type Props = {
  plan: 'STANDARD' | 'PRO' | 'ULTIMATE'
}

const SubscriptionForm = ({ plan }: Props) => {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('STANDARD')
  const { toast } = useToast()

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleSubscription = async () => {
    try {
      setLoading(true)
      
      // Aquí iría la lógica para crear la suscripción con Mercado Pago
      // Por ahora simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Suscripción exitosa',
        description: `Plan ${selectedPlan} activado correctamente`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo procesar la suscripción',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const plans = [
    {
      id: 'STANDARD',
      title: 'STANDARD',
      description: 'Perfecto para comenzar con Corinna AI',
      price: '0',
      features: [
        'Chatbot básico',
        'Hasta 100 conversaciones/mes',
        'Soporte por email',
        'Templates básicos'
      ]
    },
    {
      id: 'PRO',
      title: 'PRO',
      description: 'Ideal para negocios en crecimiento',
      price: '15',
      features: [
        'Chatbot avanzado',
        'Conversaciones ilimitadas',
        'Soporte prioritario',
        'Templates personalizados',
        'Analytics básicos'
      ],
      isPopular: true
    },
    {
      id: 'ULTIMATE',
      title: 'ULTIMATE',
      description: 'Para empresas que necesitan lo máximo',
      price: '35',
      features: [
        'Todo de PRO',
        'Integraciones avanzadas',
        'Soporte 24/7',
        'Analytics completos',
        'API personalizada',
        'White label'
      ]
    }
  ]

  return (
    <Loader loading={loading}>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-[#009EE3] rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">MP</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Planes de Suscripción</h2>
          </div>
          <p className="text-gray-600">Elige el plan que mejor se adapte a tus necesidades</p>
        </div>

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((planItem) => (
            <MercadoPagoSubscriptionCard
              key={planItem.id}
              title={planItem.title}
              description={planItem.description}
              price={planItem.price}
              features={planItem.features}
              isPopular={planItem.isPopular}
              isSelected={selectedPlan === planItem.id}
              onSelect={() => handlePlanSelection(planItem.id)}
            />
          ))}
        </div>

        {/* Información de pago */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-[#009EE3] rounded-full flex items-center justify-center">
              <span className="text-white font-bold">MP</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Pago seguro con Mercado Pago</h4>
              <p className="text-sm text-gray-600 mb-3">
                Tu suscripción será procesada de forma segura por Mercado Pago
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1">
                  <span>💳</span>
                  <span>Tarjetas</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>📱</span>
                  <span>Yape & Plin</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🏦</span>
                  <span>Transferencia</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>💰</span>
                  <span>Efectivo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de confirmación */}
        <div className="text-center">
          <Button
            onClick={handleSubscription}
            disabled={loading}
            className="bg-[#009EE3] hover:bg-[#0078A3] text-white font-semibold py-3 px-8 text-lg rounded-lg shadow-lg transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #009EE3 0%, #0078A3 100%)',
              border: 'none',
              boxShadow: '0 4px 15px rgba(0, 158, 227, 0.3)'
            }}
          >
            <Loader loading={loading}>
              <div className="flex items-center space-x-2">
                <span>💳</span>
                <span>
                  {selectedPlan === 'STANDARD' 
                    ? 'Activar Plan Gratuito' 
                    : `Suscribirse al Plan ${selectedPlan} - S/ ${plans.find(p => p.id === selectedPlan)?.price}`
                  }
                </span>
              </div>
            </Loader>
          </Button>
          
          {selectedPlan !== 'STANDARD' && (
            <p className="text-xs text-gray-500 mt-2">
              Facturación mensual • Cancelar en cualquier momento
            </p>
          )}
        </div>
      </div>
    </Loader>
  )
}

export default SubscriptionForm
