'use client'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Star } from 'lucide-react'

interface MercadoPagoSubscriptionCardProps {
  title: string
  description: string
  price: string
  features: string[]
  isPopular?: boolean
  isSelected?: boolean
  onSelect: () => void
  disabled?: boolean
}

export const MercadoPagoSubscriptionCard: React.FC<MercadoPagoSubscriptionCardProps> = ({
  title,
  description,
  price,
  features,
  isPopular = false,
  isSelected = false,
  onSelect,
  disabled = false
}) => {
  return (
    <Card 
      className={`relative transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-[#009EE3] bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg' 
          : 'border-gray-200 hover:border-[#009EE3] hover:shadow-md'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={!disabled ? onSelect : undefined}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Star className="w-4 h-4" />
            <span>Más Popular</span>
          </div>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isSelected ? 'bg-[#009EE3]' : 'bg-gray-100'
          }`}>
            <span className={`text-sm font-bold ${
              isSelected ? 'text-white' : 'text-gray-600'
            }`}>MP</span>
          </div>
          <CardTitle className={`text-xl font-bold ${
            isSelected ? 'text-[#009EE3]' : 'text-gray-800'
          }`}>
            {title}
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Precio */}
        <div className="text-center">
          <div className="flex items-baseline justify-center space-x-1">
            <span className="text-3xl font-bold text-[#009EE3]">S/</span>
            <span className="text-4xl font-bold text-[#009EE3]">{price}</span>
            {price !== '0' && <span className="text-gray-500">/mes</span>}
          </div>
          {price === '0' && (
            <p className="text-sm text-green-600 font-medium mt-1">¡Gratis para siempre!</p>
          )}
        </div>

        {/* Características */}
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle2 className={`w-5 h-5 mt-0.5 ${
                isSelected ? 'text-[#009EE3]' : 'text-green-500'
              }`} />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* Botón */}
        <Button
          className={`w-full ${
            isSelected 
              ? 'bg-[#009EE3] hover:bg-[#0078A3] text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
          } transition-all duration-200`}
          disabled={disabled}
        >
          {isSelected ? 'Plan Seleccionado' : 'Seleccionar Plan'}
        </Button>

        {/* Información adicional */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Pago procesado por Mercado Pago
          </p>
          <div className="flex items-center justify-center space-x-1 mt-1">
            <span className="text-xs text-gray-400">🔒</span>
            <span className="text-xs text-gray-400">Pago seguro</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 