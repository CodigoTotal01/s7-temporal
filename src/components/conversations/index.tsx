'use client'

import { useConversation } from '@/hooks/conversation/use-conversation'
import React from 'react'
import TabsMenu from '../tabs/intex'
import { TABS_MENU } from '@/constants/menu'
import { TabsContent } from '../ui/tabs'
import ConversationSearch from './search'
import { Loader } from '../loader'
import ChatCard from './chat-card'

type Props = {
  domains?:
  | {
    name: string
    id: string
    icon: string
  }[]
  | undefined
}

const ConversationMenu = ({ domains }: Props) => {
  const { register, setValue, chatRooms, loading, activeTab, onGetActiveChatMessages, changeActiveTab, toggleFavorite } =
    useConversation()

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-3 md:p-4 lg:p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-1 h-5 md:h-6 lg:h-8 bg-blue-500 rounded-full"></div>
          <h2 className="font-bold text-base md:text-lg lg:text-xl text-gray-900">Conversaciones</h2>
        </div>
      </div>
      
      <div className="flex-1 p-3 md:p-4 lg:p-6 overflow-hidden">
        <TabsMenu triggers={TABS_MENU} onTabChange={changeActiveTab} value={activeTab}>
          <TabsContent value="no leidos" className="mt-3 md:mt-4">
            <ConversationSearch
              domains={domains}
              register={register}
              setValue={setValue}
            />
            <div className="flex flex-col gap-2 mt-3 md:mt-4 overflow-y-auto">
              <Loader loading={loading}>
                {chatRooms.length ? (
                  chatRooms.map((room) => (
                    <ChatCard
                      seen={room.chatRoom[0].message[0]?.seen}
                      id={room.chatRoom[0].id}
                      onChat={() => onGetActiveChatMessages(room.chatRoom[0].id)}
                      createdAt={room.chatRoom[0].message[0]?.createdAt}
                      key={room.chatRoom[0].id}
                      title={room.email!}
                      description={room.chatRoom[0].message[0]?.message}
                      isFavorite={room.chatRoom[0].isFavorite}
                      onToggleFavorite={(isFavorite) => toggleFavorite(room.chatRoom[0].id, isFavorite)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 md:py-6 text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2 md:mb-3">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-1">
                      No hay conversaciones
                    </h3>
                    <p className="text-xs text-gray-600">
                      Las conversaciones aparecerán aquí.
                    </p>
                  </div>
                )}
              </Loader>
            </div>
          </TabsContent>
          <TabsContent value="todos" className="mt-3 md:mt-4">
            <ConversationSearch
              domains={domains}
              register={register}
              setValue={setValue}
            />
            <div className="flex flex-col gap-2 mt-3 md:mt-4 overflow-y-auto">
              <Loader loading={loading}>
                {chatRooms.length ? (
                  chatRooms.map((room) => (
                    <ChatCard
                      seen={room.chatRoom[0].message[0]?.seen}
                      id={room.chatRoom[0].id}
                      onChat={() => onGetActiveChatMessages(room.chatRoom[0].id)}
                      createdAt={room.chatRoom[0].message[0]?.createdAt}
                      key={room.chatRoom[0].id}
                      title={room.email!}
                      description={room.chatRoom[0].message[0]?.message}
                      isFavorite={room.chatRoom[0].isFavorite}
                      onToggleFavorite={(isFavorite) => toggleFavorite(room.chatRoom[0].id, isFavorite)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 md:py-6 text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2 md:mb-3">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-1">
                      Todas las conversaciones
                    </h3>
                    <p className="text-xs text-gray-600">
                      Aquí verás todas las conversaciones.
                    </p>
                  </div>
                )}
              </Loader>
            </div>
          </TabsContent>
          <TabsContent value="expirados" className="mt-3 md:mt-4">
            <ConversationSearch
              domains={domains}
              register={register}
              setValue={setValue}
            />
            <div className="flex flex-col gap-2 mt-3 md:mt-4 overflow-y-auto">
              <Loader loading={loading}>
                {chatRooms.length ? (
                  chatRooms.map((room) => (
                    <ChatCard
                      seen={room.chatRoom[0].message[0]?.seen}
                      id={room.chatRoom[0].id}
                      onChat={() => onGetActiveChatMessages(room.chatRoom[0].id)}
                      createdAt={room.chatRoom[0].message[0]?.createdAt}
                      key={room.chatRoom[0].id}
                      title={room.email!}
                      description={room.chatRoom[0].message[0]?.message}
                      isFavorite={room.chatRoom[0].isFavorite}
                      onToggleFavorite={(isFavorite) => toggleFavorite(room.chatRoom[0].id, isFavorite)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 md:py-6 text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2 md:mb-3">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-1">
                      Conversaciones expiradas
                    </h3>
                    <p className="text-xs text-gray-600">
                      Las conversaciones expiradas aparecerán aquí.
                    </p>
                  </div>
                )}
              </Loader>
            </div>
          </TabsContent>
          <TabsContent value="favoritos" className="mt-3 md:mt-4">
            <ConversationSearch
              domains={domains}
              register={register}
              setValue={setValue}
            />
            <div className="flex flex-col gap-2 mt-3 md:mt-4 overflow-y-auto">
              <Loader loading={loading}>
                {chatRooms.length ? (
                  chatRooms.map((room) => (
                    <ChatCard
                      seen={room.chatRoom[0].message[0]?.seen}
                      id={room.chatRoom[0].id}
                      onChat={() => onGetActiveChatMessages(room.chatRoom[0].id)}
                      createdAt={room.chatRoom[0].message[0]?.createdAt}
                      key={room.chatRoom[0].id}
                      title={room.email!}
                      description={room.chatRoom[0].message[0]?.message}
                      isFavorite={room.chatRoom[0].isFavorite}
                      onToggleFavorite={(isFavorite) => toggleFavorite(room.chatRoom[0].id, isFavorite)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 md:py-6 text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2 md:mb-3">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-1">
                      Conversaciones favoritas
                    </h3>
                    <p className="text-xs text-gray-600">
                      Tus conversaciones favoritas aparecerán aquí.
                    </p>
                  </div>
                )}
              </Loader>
            </div>
          </TabsContent>
        </TabsMenu>
      </div>
    </div>
  )
}

export default ConversationMenu
