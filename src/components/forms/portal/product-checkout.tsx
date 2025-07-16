'use client'
import React from 'react'
import { useMercadoPagoCustomer } from '@/hooks/billing/use-mercadopago'
import { Loader } from '@/components/loader'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { CustomerPaymentForm } from './payment-form'

type Props = {
  onBack(): void
  products?:
  | {
    name: string
    image: string
    price: number
  }[]
  | undefined
  amount?: number
  onNext(): void
  stripeId?: string
}

const PaymentCheckout = ({
  onBack,
  onNext,
  amount,
  products,
  stripeId,
}: Props) => {
  const { preferenceId, loadForm } = useMercadoPagoCustomer(amount!, products)

  return (
    <Loader loading={loadForm}>
      <div className="flex flex-col gap-8 justify-center max-w-6xl mx-auto">
        {/* Header con diseño de Mercado Pago */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-[#009EE3] rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">MP</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Pago Seguro</h1>
          </div>
          <p className="text-gray-600 text-lg">Completa tu pago con Mercado Pago</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna de productos */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <span>🛒</span>
                <span>Resumen de compra</span>
              </h2>
              
              <div className="space-y-4">
                {products && products.map((product, key) => (
                  <Card
                    key={key}
                    className="w-full flex gap-4 p-4 bg-white border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-20 h-20 aspect-square relative rounded-lg overflow-hidden">
                      <Image
                        src={`https://ucarecdn.com/${product.image}/`}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-500">Cantidad: 1</p>
                      </div>
                      <p className="text-xl font-bold text-[#009EE3]">S/ {product.price.toFixed(2)}</p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Total */}
              <div className="mt-6 pt-4 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  <span className="text-3xl font-bold text-[#009EE3]">S/ {amount?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna de pago */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-[#009EE3] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">MP</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Mercado Pago</h3>
                  <p className="text-sm text-gray-600">Pago seguro y rápido</p>
                </div>
              </div>

              {preferenceId && (
                <CustomerPaymentForm onNext={onNext} preferenceId={preferenceId} amount={amount} />
              )}
            </div>

            {/* Información adicional */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start space-x-3">
                <span className="text-green-600 text-xl">✅</span>
                <div>
                  <p className="font-medium text-green-800">Compra protegida</p>
                  <p className="text-sm text-green-700">Tu pago está protegido por Mercado Pago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Loader>
  )
}

export default PaymentCheckout
