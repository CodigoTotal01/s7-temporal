'use client'
import { Loader } from '@/components/loader'
import { Button } from '@/components/ui/button'
import { useCompleteCustomerPayment } from '@/hooks/billing/use-mercadopago'
import React from 'react'

type CustomerPaymentFormProps = {
  onNext(): void
}

export const CustomerPaymentForm = ({ onNext }: CustomerPaymentFormProps) => {
  const { processing, onMakePayment } = useCompleteCustomerPayment(onNext)

  return (
    <div className="flex flex-col">
      {/* Mercado Pago Payment Element - similar a Stripe PaymentElement */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-4 bg-blue-600 rounded"></div>
            <span className="text-sm font-medium">Mercado Pago</span>
          </div>

          <div className="space-y-3">
            <div className="border border-gray-200 rounded p-3 bg-gray-50">
              <div className="text-sm text-gray-600">Métodos de pago disponibles:</div>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-8 h-5 bg-gray-300 rounded text-xs flex items-center justify-center">💳</div>
                <div className="w-8 h-5 bg-gray-300 rounded text-xs flex items-center justify-center">📱</div>
                <div className="w-8 h-5 bg-gray-300 rounded text-xs flex items-center justify-center">🏦</div>
                <span className="text-xs text-gray-500">+ más</span>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Tarjetas de crédito/débito, Yape, Plin, transferencias bancarias y más
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full mt-5"
        onClick={onMakePayment}
      >
        <Loader loading={processing}>Pagar con Mercado Pago</Loader>
      </Button>
    </div>
  )
}
