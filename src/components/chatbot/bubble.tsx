import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, extractUUIDFromString, getMonthName } from '@/lib/utils'

type Props = {
  message: {
    role: 'user' | 'assistant'
    content: string
    link?: string
    imageUrl?: string
  }
  createdAt?: Date | string
}

const Bubble = ({ message, createdAt }: Props) => {
  // Validación de seguridad para evitar errores
  if (!message || !message.content) {
    return null
  }

  let d = new Date()

  // ✅ SIMPLIFICADO: Usar directamente la URL de imagen del mensaje
  const imageUrl = message.imageUrl

  return (
    <div
      className={cn(
        'flex gap-2 items-end',
        message.role == 'assistant' ? 'self-start' : 'self-end flex-row-reverse'
      )}
    >
      {message.role == 'assistant' ? (
        <Avatar className="w-6 h-6">
          <AvatarImage
            src="https://github.com/shadcn.png"
            alt="@shadcn"
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="w-6 h-6">
          <AvatarFallback>
            <User className="w-3 h-3" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'flex flex-col gap-1 min-w-[150px] max-w-[250px] p-3 rounded-lg',
          message.role == 'assistant'
            ? 'bg-gray-100 rounded-br-sm'
            : 'bg-blue-500 text-white rounded-bl-sm'
        )}
      >
        {createdAt ? (
          <div className="flex gap-2 text-xs opacity-70">
            <p>
              {(() => {
                // ✅ Convertir a Date si es necesario
                const date = createdAt instanceof Date ? createdAt : new Date(createdAt)
                return `${date.getDate()} ${getMonthName(date.getMonth())}`
              })()}
            </p>
            <p>
              {(() => {
                // ✅ Convertir a Date si es necesario
                const date = createdAt instanceof Date ? createdAt : new Date(createdAt)
                const hours = date.getHours()
                const minutes = date.getMinutes().toString().padStart(2, '0')
                return `${hours}:${minutes}${hours > 12 ? 'PM' : 'AM'}`
              })()}
            </p>
          </div>
        ) : (
          <p className="text-xs opacity-70">
            {`${d.getHours()}:${d.getMinutes()} ${d.getHours() > 12 ? 'pm' : 'am'
              }`}
          </p>
        )}
        <div className="text-xs leading-relaxed whitespace-pre-line">
          {/* ✅ SIEMPRE mostrar el texto del producto */}
          {message.content.replace('(complete)', ' ')}
          {message.link && (
            <Link
              className="underline font-medium pl-1"
              href={message.link}
              target="_blank"
            >
              Ver enlace
            </Link>
          )}
        </div>

        {/* ✅ Si hay imagen, mostrarla debajo del texto */}
        {imageUrl && (
          <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100 mt-2">
            <Image
              src={imageUrl}
              fill
              alt="Imagen del producto"
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                const container = target.parentElement
                if (container) {
                  container.innerHTML = `
                    <div class="flex items-center justify-center h-full text-xs text-gray-500">
                      <div class="text-center">
                        <div class="mb-1">🖼️</div>
                        <div>Imagen no disponible</div>
                      </div>
                    </div>
                  `
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Bubble
