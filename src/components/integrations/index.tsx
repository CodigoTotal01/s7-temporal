'use client'
import React from 'react'
import { Card, CardContent, CardDescription } from '../ui/card'
import Image from 'next/image'
import { INTEGRATION_LIST_ITEMS } from '@/constants/integrations'
import IntegrationTrigger from './IntegrationTrigger'

type Props = {
  connections: {
    mercadopago: boolean
  }
}

const IntegrationsList = ({ connections }: Props) => {
  return (
    <div className="flex-1 h-0 grid grid-cols-1 content-start lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {INTEGRATION_LIST_ITEMS.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-col p-5 gap-2">
            <div className="flex w-full justify-between items-start gap-x-20">
              <div className="">
                <div className="w-32 h-32 relative">
                  <Image
                    sizes="100vw"
                    src={`https://ucarecdn.com/${item.logo}/`}
                    alt="Logo"
                    fill
                  />
                </div>
                <h2 className="font-bold capitalize">{item.name}</h2>
              </div>
              <IntegrationTrigger
                connections={connections}
                title={item.title}
                descrioption={item.modalDescription}
                logo={item.logo}
                name={item.name}
              />
            </div>
            <CardDescription>{item.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default IntegrationsList
