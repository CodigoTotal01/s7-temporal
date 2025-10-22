'use client'

import React from 'react'
import { Card } from '../ui/card'
import { Users, Clock, MessageCircle } from 'lucide-react'

type Props = {
  chatRoomId: string
  setChats: React.Dispatch<
    React.SetStateAction<
      {
        role: 'user' | 'assistant'
        content: string
        link?: string | undefined
      }[]
    >
  >
}

const HumanMode = ({ chatRoomId, setChats }: Props) => {
  return (
    <Card className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="font-semibold text-sm">Modo Humano Activo</span>
        </div>
        <div className="flex items-center gap-1 text-xs opacity-90">
          <Clock className="h-3 w-3" />
          <span>Agente conectado</span>
        </div>
      </div>
      <div className="mt-1 text-xs opacity-90">
        Un miembro de nuestro equipo está respondiendo a tu consulta
      </div>
    </Card>
  )
}

export default HumanMode
