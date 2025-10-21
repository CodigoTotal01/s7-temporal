'use client'

import { useChatTime } from '@/hooks/conversation/use-conversation'
import React from 'react'
import { Card, CardContent, CardDescription } from '../ui/card'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { User } from 'lucide-react'
import { UrgentIcon } from '@/icons/urgent-icon'

type Props = {
  title: string
  description?: string
  createdAt: Date
  id: string
  onChat(): void
  seen?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (isFavorite: boolean) => void
}

const ChatCard = ({
  title,
  description,
  createdAt,
  onChat,
  id,
  seen,
  isFavorite = false,
  onToggleFavorite,
}: Props) => {
  const { messageSentAt, urgent } = useChatTime(createdAt, id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(!isFavorite)
  }

  return (
    <Card
      onClick={onChat}
      className="rounded-none border-r-0 hover:bg-muted cursor-pointer transition duration-150 ease-in-out"
    >
      <CardContent className="py-4 flex gap-3">
        <div>
          <Avatar>
            <AvatarFallback className="bg-muted">
              <User />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex justify-between w-full">
          <div className="flex-1">
            <div className="flex gap-5 items-center">
              <CardDescription className="font-bold leading-none text-gray-600">
                {title}
              </CardDescription>
              {urgent && !seen && <UrgentIcon />}
            </div>
            <CardDescription>
              {description
                ? description.substring(0, 20) + '...'
                : 'This chatroom is empty'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFavoriteClick}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <svg 
                className={`w-4 h-4 ${isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                />
              </svg>
            </button>
            <div className="w-[60px] flex justify-end">
              <CardDescription className="text-xs">
                {createdAt ? messageSentAt : ''}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChatCard
 