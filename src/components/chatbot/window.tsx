import { ChatBotMessageProps } from '@/schemas/conversation.schema'
import React, { forwardRef } from 'react'
import { UseFormRegister } from 'react-hook-form'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import ChatModeToggle from './chat-mode-toggle'
import TabsMenu from '../tabs/intex'
import { BOT_TABS_MENU } from '@/constants/menu'
import { TabsContent } from '../ui/tabs'
import { Separator } from '../ui/separator'
import Bubble from './bubble'
import { Responding } from './responding'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Send } from 'lucide-react'
import { CardDescription, CardTitle } from '../ui/card'
import Accordion from '../accordian'
import SessionIndicator from './session-indicator'

type Props = {
  errors: any
  register: UseFormRegister<ChatBotMessageProps>
  chats: { role: 'user' | 'assistant'; content: string; link?: string }[]
  onChat(): void
  onResponding: boolean
  domainName: string
  theme?: string | null
  textColor?: string | null
  help?: boolean
  realtimeMode:
  | {
    chatroom: string
    mode: boolean
  }
  | undefined
  helpdesk: {
    id: string
    question: string
    answer: string
    domainId: string | null
  }[]
  setChat: React.Dispatch<
    React.SetStateAction<
      {
        role: 'user' | 'assistant'
        content: string
        link?: string | undefined
      }[]
    >
  >
  // ✅ Nuevos props para el toggle de modo
  onToggleHumanMode: (isHumanMode: boolean) => void
  isHumanMode?: boolean
  isToggleDisabled?: boolean
  // ✅ Props de sesión
  sessionData?: {
    customerId: string
    email: string
    name?: string
    expiresAt: string
  } | null
  isAuthenticated?: boolean
  onClearSession?: () => void
}

export const BotWindow = forwardRef<HTMLDivElement, Props>(
  (
    {
      register,
      chats,
      onChat,
      onResponding,
      domainName,
      helpdesk,
      realtimeMode,
      setChat,
      textColor,
      theme,
      help,
      // ✅ Nuevos props
      sessionData,
      isAuthenticated,
      onClearSession,
      // ✅ Props del toggle
      onToggleHumanMode,
      isHumanMode = false,
      isToggleDisabled = false,
    },
    ref
  ) => {
    return (
      <div className="h-[500px] w-[380px] flex flex-col bg-white rounded-xl border-[1px] overflow-hidden overflow-x-hidden shadow-lg">
        {/* ✅ Indicador de sesión compacto (si está autenticado) */}
        {(isAuthenticated && sessionData) && (
          <SessionIndicator
            sessionData={sessionData}
            isAuthenticated={isAuthenticated}
            onClearSession={onClearSession}
          />
        )}

        <div className="flex justify-between px-3 pt-3">
          <div className="flex gap-2 flex-1">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt="@shadcn"
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex justify-center flex-col flex-1">
              <h3 className="text-xs font-semibold leading-none">
                {isHumanMode ? 'Agente Humano' : 'Asistente Virtual'}
              </h3>
              <p className="text-xs text-gray-500">{domainName}</p>


            </div>
            <div className="flex items-center gap-2">
              {/* ✅ Solo mostrar toggle cuando hay sesión activa */}
              {isAuthenticated && (
                <div className="w-full">
                  <ChatModeToggle
                    isHumanMode={isHumanMode}
                    onToggle={onToggleHumanMode}
                    disabled={isToggleDisabled}
                    chatRoomId={realtimeMode?.chatroom}
                    setChats={setChat}
                  />
                </div>
              )}

            </div>
          </div>
        </div>
        <div className="p-2">
          <TabsMenu
            triggers={BOT_TABS_MENU}
            className="bg-transparent border-[1px] border-border p-0.5"
          >
            <TabsContent value="asistente">
              <Separator orientation="horizontal" />
              <div className="flex flex-col h-full">
                <div
                  style={{
                    background: theme || '',
                    color: textColor || '',
                  }}
                  className={`px-3 flex flex-col py-3 gap-2 chat-window overflow-y-auto overflow-x-hidden ${(isAuthenticated && sessionData) ? 'h-[280px]' : 'h-[320px]'
                    }`}
                  ref={ref}
                >
                  {chats.map((chat, key) => (
                    <Bubble
                      key={key}
                      message={chat}
                    />
                  ))}
                  {onResponding && <Responding />}
                </div>
                <form
                  onSubmit={onChat}
                  className="flex px-3 py-2 flex-col "
                >
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      {...register('content')}
                      placeholder="Escribe tu mensaje..."
                      className="focus-visible:ring-0 flex-1 px-3 py-1.5 focus-visible:ring-offset-0 bg-white rounded-lg outline-none border border-gray-200 text-xs"
                    />
                    <Button
                      type="submit"
                      size="xs"
                      className="p-2 h-8 w-8 rounded-lg"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="soporte">
              <div className={`overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-3 w-full ${(isAuthenticated && sessionData) ? 'h-[310px]' : 'h-[350px]'
                }`}>
                <div>
                  <CardTitle className="text-xs">Ayuda</CardTitle>
                  <CardDescription className="text-xs">
                    Explora una lista de preguntas frecuentes.
                  </CardDescription>
                </div>
                <Separator orientation="horizontal" />

                {helpdesk.map((desk) => (
                  <Accordion
                    key={desk.id}
                    trigger={desk.question}
                    content={desk.answer}
                  />
                ))}
              </div>
            </TabsContent>
          </TabsMenu>
        </div>
        <div className="flex justify-center py-1">
          <p className="text-gray-400 text-xs">Powered By Devs</p>
        </div>
      </div>
    )
  }
)

BotWindow.displayName = 'BotWindow'
