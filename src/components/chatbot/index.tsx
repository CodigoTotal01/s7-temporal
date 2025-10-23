'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { BotIcon } from '@/icons/bot-icon'
import { useChatBot } from '@/hooks/chatbot/use-chatbot'
import { BotWindow } from './window'

type Props = {}

const AiChatBot = (props: Props) => {
  const {
    onOpenChatBot,
    botOpened,
    onChats,
    register,
    onStartChatting,
    onAiTyping,
    messageWindowRef,
    currentBot,
    loading,
    onRealTime,
    setOnChats,
    errors,
    // ✅ Datos de sesión
    sessionData,
    isAuthenticated,
    clearSession,
    // ✅ Props del toggle
    isHumanMode,
    onToggleHumanMode,
    isToggleDisabled,
  } = useChatBot()

  return (
    <div className="h-screen flex flex-col justify-end items-end gap-4 pr-4 pb-4">
      {botOpened && (
        <BotWindow
          errors={errors}
          setChat={setOnChats}
          realtimeMode={onRealTime}
          helpdesk={currentBot?.helpdesk!}
          domainName={currentBot?.name!}
          ref={messageWindowRef}
          help={currentBot?.chatBot?.helpdesk}
          theme={currentBot?.chatBot?.background}
          textColor={currentBot?.chatBot?.textColor}
          chats={onChats}
          register={register}
          onChat={onStartChatting}
          onResponding={onAiTyping}
          // ✅ Pasar datos de sesión
          sessionData={sessionData}
          isAuthenticated={isAuthenticated}
          onClearSession={clearSession}
          // ✅ Pasar props del toggle
          isHumanMode={isHumanMode}
          onToggleHumanMode={onToggleHumanMode}
          isToggleDisabled={isToggleDisabled}
        />
      )}
      <div
        className={cn(
          'rounded-full relative cursor-pointer shadow-lg w-16 h-16 flex items-center justify-center bg-grandis hover:bg-orange-400 transition-colors duration-200',
          loading ? 'invisible' : 'visible'
        )}
        onClick={onOpenChatBot}
      >
        {/* ✅ Badge de sesión activa */}
        {isAuthenticated && sessionData && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}

        {currentBot?.chatBot?.icon ? (
          <Image
            src={`https://ucarecdn.com/${currentBot.chatBot.icon}/`}
            alt="bot"
            fill
            className="p-2"
          />
        ) : (
          <BotIcon />
        )}
      </div>
    </div>
  )
}

export default AiChatBot
