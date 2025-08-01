import { ChatBotMessageProps } from '@/schemas/conversation.schema'
import React, { forwardRef } from 'react'
import { UseFormRegister } from 'react-hook-form'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import RealTimeMode from './real-time'
import Image from 'next/image'
import TabsMenu from '../tabs/intex'
import { BOT_TABS_MENU } from '@/constants/menu'
import ChatIcon from '@/icons/chat-icon'
import { TabsContent } from '../ui/tabs'
import { Separator } from '../ui/separator'
import Bubble from './bubble'
import { Responding } from './responding'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Send } from 'lucide-react'
import { CardDescription, CardTitle } from '../ui/card'
import Accordion from '../accordian'

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
    },
    ref
  ) => {
    return (
      <div className="h-[500px] w-[380px] flex flex-col bg-white rounded-xl mr-[80px] border-[1px] overflow-hidden shadow-lg">
        <div className="flex justify-between px-3 pt-3">
          <div className="flex gap-2">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt="@shadcn"
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex items-start flex-col">
              <h3 className="text-xs font-semibold leading-none">
                Asistente virtual
              </h3>
              <p className="text-xs text-gray-500">{domainName}</p>
              {realtimeMode?.mode && (
                <RealTimeMode
                  setChats={setChat}
                  chatRoomId={realtimeMode.chatroom}
                />
              )}
            </div>
          </div>
          <div className="relative w-10 h-10">
            <Image
              src="https://ucarecdn.com/019dd17d-b69b-4dea-a16b-60e0f25de1e9/propuser.png"
              fill
              alt="users"
              objectFit="contain"
            />
          </div>
        </div>
        <TabsMenu
          triggers={BOT_TABS_MENU}
          className=" bg-transparent border-[1px] border-border m-2"
        >
          <TabsContent value="chatbot">
            <Separator orientation="horizontal" />
            <div className="flex flex-col h-full">
              <div
                style={{
                  background: theme || '',
                  color: textColor || '',
                }}
                className="px-3 flex h-[320px] flex-col py-3 gap-2 chat-window overflow-y-auto"
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
                className="flex px-3 py-2 flex-col flex-1 bg-porcelain"
              >
                <div className="flex justify-between items-center gap-2">
                  <Input
                    {...register('content')}
                    placeholder="Escribe tu mensaje..."
                    className="focus-visible:ring-0 flex-1 p-2 focus-visible:ring-offset-0 bg-white rounded-lg outline-none border border-gray-200 text-xs"
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
            <div className="h-[350px] overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-3">
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
        <div className="flex justify-center py-1">
          <p className="text-gray-400 text-xs">Powered By Devs</p>
        </div>
      </div>
    )
  }
)

BotWindow.displayName = 'BotWindow'
