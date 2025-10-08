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
  }
  createdAt?: Date
}

const Bubble = ({ message, createdAt }: Props) => {
  // Validación de seguridad para evitar errores
  if (!message || !message.content) {
    console.error('Bubble: message or message.content is undefined', message)
    return null
  }

  let d = new Date()
  const image = extractUUIDFromString(message.content)
  console.log(message.link)

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
              {createdAt.getDate()} {getMonthName(createdAt.getMonth())}
            </p>
            <p>
              {createdAt.getHours()}:{createdAt.getMinutes()}
              {createdAt.getHours() > 12 ? 'PM' : 'AM'}
            </p>
          </div>
        ) : (
          <p className="text-xs opacity-70">
            {`${d.getHours()}:${d.getMinutes()} ${d.getHours() > 12 ? 'pm' : 'am'
              }`}
          </p>
        )}
        {image ? (
          <div className="relative aspect-square rounded-md overflow-hidden">
            <Image
              src={`https://ucarecdn.com/${image[0]}/`}
              fill
              alt="image"
              className="object-cover"
            />
          </div>
        ) : (
          <p className="text-xs leading-relaxed">
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
          </p>
        )}
      </div>
    </div>
  )
}

export default Bubble
