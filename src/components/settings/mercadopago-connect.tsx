'use client'
import React from 'react'
import { Button } from '../ui/button'
import { Loader } from '../loader'
import { useMercadoPago } from '@/hooks/billing/use-mercadopago'

type MercadoPagoConnectProps = {
  connected: boolean
}

export const MercadoPagoConnect = ({ connected }: MercadoPagoConnectProps) => {
  const { connectMercadoPago, disconnectMercadoPago, loading } = useMercadoPago()

  const handleConnect = async () => {
    try {
      await connectMercadoPago()
      window.location.reload()
    } catch (error) {
      console.error('Error al conectar:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectMercadoPago()
      window.location.reload()
    } catch (error) {
      console.error('Error al desconectar:', error)
    }
  }

  return (
    <Button
      disabled={loading}
      onClick={connected ? handleDisconnect : handleConnect}
      className={connected ? 'bg-red-600 hover:bg-red-700' : ''}
    >
      <Loader loading={loading}>
        {connected ? 'Desconectar Mercado Pago' : 'Conectar Mercado Pago'}
      </Loader>
    </Button>
  )
} 