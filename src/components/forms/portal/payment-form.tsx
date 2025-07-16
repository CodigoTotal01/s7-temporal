'use client'
import React from 'react'
import { MercadoPagoButton } from '@/components/payment/mercadopago-button'

type CustomerPaymentFormProps = {
  onNext(): void
  preferenceId?: string
  amount?: number
}

export const CustomerPaymentForm = ({ onNext, preferenceId, amount }: CustomerPaymentFormProps) => {
  return (
    <div className="flex flex-col">
      {preferenceId && amount ? (
        <MercadoPagoButton
          preferenceId={preferenceId}
          amount={amount}
          onSuccess={onNext}
          onError={() => console.error('Error en pago')}
        />
      ) : (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009EE3] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando formulario de pago...</p>
          <p className="text-sm text-gray-500 mt-2">Mercado Pago</p>
        </div>
      )}
    </div>
  )
}
