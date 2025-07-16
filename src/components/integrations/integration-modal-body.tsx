import { CheckCircle2Icon } from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'
import { MercadoPagoConnect } from '../settings/mercadopago-connect'

type IntegrationModalBodyProps = {
  type: string
  connections: {
    [key in 'mercadopago']: boolean
  }
}

export const IntegrationModalBody = ({
  type,
  connections,
}: IntegrationModalBodyProps) => {
  switch (type) {
    case 'mercadopago':
      return (
        <div className="flex flex-col gap-2">
          <h2 className="font-bold">Mercado Pago quiere acceder a</h2>
          {[
            'Información de pago y bancaria',
            'Productos y servicios que vendes',
            'Información de negocio y impuestos',
            'Crear y actualizar productos',
            'Procesar pagos con Yape y Plin',
          ].map((item, key) => (
            <div
              key={key}
              className="flex gap-2 items-center pl-3"
            >
              <CheckCircle2Icon />
              <p>{item}</p>
            </div>
          ))}
          <div className="flex justify-between mt-10">
            <Button variant="outline">Aprender más</Button>
            <MercadoPagoConnect connected={connections[type]} />
          </div>
        </div>
      )
    default:
      return <></>
  }
}
