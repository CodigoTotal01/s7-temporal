'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, RefreshCw, Info } from 'lucide-react'
import { MercadoPagoConnect } from '@/components/settings/mercadopago-connect'

export default function TestMercadoPagoPage() {
  const [connected, setConnected] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [connectAvailable, setConnectAvailable] = useState<boolean | null>(null)
  const [checkingConnect, setCheckingConnect] = useState(false)

  // Verificar disponibilidad de Mercado Pago Connect
  const checkConnectAvailability = async () => {
    setCheckingConnect(true)
    try {
      const response = await fetch('/api/mercadopago/check-connect')
      const data = await response.json()
      setConnectAvailable(data.available)
      if (!data.available) {
        setError(`Connect no disponible: ${data.reason}`)
      }
    } catch (error) {
      console.error('Error checking Connect availability:', error)
      setConnectAvailable(false)
    } finally {
      setCheckingConnect(false)
    }
  }

  // Función para verificar el estado actual de conexión
  const checkConnectionStatus = async () => {
    setCheckingStatus(true)
    try {
      const response = await fetch('/api/mercadopago/connect?action=status')
      if (response.ok) {
        const data = await response.json()
        setConnected(data.connected || false)
      }
    } catch (error) {
      console.error('Error checking status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  // Verificar estado al cargar la página
  useEffect(() => {
    checkConnectionStatus()
    checkConnectAvailability()
  }, [])

  const testConnection = async (action: 'connect' | 'disconnect') => {
    setTesting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/mercadopago/connect?action=${action}`)
      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setConnected(data.connected || false)
      } else {
        setError(data.error || 'Error desconocido')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Prueba de Conexión - Mercado Pago</CardTitle>
          <CardDescription>
            Prueba la conexión y desconexión con Mercado Pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Verificación de Connect */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Mercado Pago Connect:</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={checkConnectAvailability}
                disabled={checkingConnect}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${checkingConnect ? 'animate-spin' : ''}`} />
                Verificar
              </Button>
            </div>
            {connectAvailable === null ? (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 text-gray-600 mr-2 animate-spin" />
                  <span className="text-gray-800">Verificando disponibilidad...</span>
                </div>
              </div>
            ) : connectAvailable ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Mercado Pago Connect está disponible. Los usuarios pueden conectarse a sus propias cuentas.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Mercado Pago Connect no está disponible. Usando modo simulado.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Estado actual */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Estado Actual:</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={checkConnectionStatus}
                disabled={checkingStatus}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${checkingStatus ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
            <div className={`p-3 rounded-lg ${connected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center">
                {connected ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Conectado a Mercado Pago</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-gray-800 font-medium">No conectado</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Componente de conexión */}
          <div className="space-y-2">
            <h3 className="font-semibold">Conectar/Desconectar Mercado Pago:</h3>
            <MercadoPagoConnect connected={connected} />
          </div>

          {/* Botones de prueba manual */}
          <div className="space-y-2">
            <h3 className="font-semibold">Prueba Manual de Endpoints:</h3>
            <div className="flex gap-2">
              <Button 
                onClick={() => testConnection('connect')} 
                disabled={testing || connected}
                variant="outline"
                className="flex-1"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  'Probar Conexión'
                )}
              </Button>
              <Button 
                onClick={() => testConnection('disconnect')} 
                disabled={testing || !connected}
                variant="outline"
                className="flex-1"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  'Probar Desconexión'
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Mensaje:</strong> {result.message}</p>
                  {result.url && <p><strong>URL:</strong> {result.url}</p>}
                  <p><strong>Estado:</strong> {result.connected ? 'Conectado' : 'Desconectado'}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Información:</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Mercado Pago Connect:</strong> Permite que cada usuario se conecte a su propia cuenta de Mercado Pago.</p>
              <p><strong>Modo Simulado:</strong> Los pagos van a tu cuenta de Mercado Pago.</p>
              <p><strong>En Perú:</strong> Mercado Pago Connect SÍ está disponible para cuentas empresariales.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 