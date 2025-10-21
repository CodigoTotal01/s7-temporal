import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlertCircle, MessageCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

type Props = {
  urgentChats: Array<{
    id: string
    createdAt: Date
    updatedAt: Date
    Customer: {
      id: string
      name: string | null
      email: string | null
    } | null
    message: Array<{
      message: string
      createdAt: Date
      role: 'user' | 'assistant' | null
    }>
  }>
}

const UrgentChats = ({ urgentChats }: Props) => {
  return (
    <Card className="border-porcelain shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center relative">
            <AlertCircle className="w-6 h-6 text-red-500" />
            {urgentChats.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {urgentChats.length}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gravel">Chats en Tiempo Real</h3>
            <p className="text-xs text-ironside">Requieren atención humana inmediata</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {urgentChats.length > 0 ? (
          <div className="space-y-4">
            {urgentChats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
              >
                <Avatar className="w-10 h-10 border-2 border-red-300">
                  <AvatarFallback className="bg-red-200 text-red-700 font-semibold">
                    {(chat.Customer?.name || chat.Customer?.email)?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gravel truncate">
                        {chat.Customer?.name || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-ironside truncate">
                        {chat.Customer?.email || 'Sin email'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(chat.updatedAt, { addSuffix: true, locale: es })}
                    </div>
                  </div>

                  {chat.message[0] && (
                    <div className="flex items-start gap-2 mb-3">
                      <MessageCircle className="w-4 h-4 text-ironside flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gravel line-clamp-2">
                        {chat.message[0].message}
                      </p>
                    </div>
                  )}

                  <Link href="/conversation">
                    <Button
                      size="sm"
                      className="w-full bg-red-500 hover:bg-red-600 text-white"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Atender Ahora
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gravel font-medium mb-2">Sin chats urgentes</p>
            <p className="text-ironside text-xs">
              No hay conversaciones que requieran atención inmediata
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UrgentChats

