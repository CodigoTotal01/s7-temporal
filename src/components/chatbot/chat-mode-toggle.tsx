'use client'

import React from 'react'
import { useRealTime } from '@/hooks/chatbot/use-chatbot'

type Props = {
    isHumanMode: boolean
    onToggle: (isHumanMode: boolean) => void
    disabled?: boolean
    chatRoomId?: string
    setChats?: React.Dispatch<React.SetStateAction<{
        role: 'user' | 'assistant'
        content: string
        link?: string | undefined
    }[]>>
}

const ChatModeToggle = ({ isHumanMode, onToggle, disabled = false, chatRoomId, setChats }: Props) => {
    // ✅ Siempre llamar el hook, pero solo activar si hay chatRoomId
    useRealTime(chatRoomId || '', setChats || (() => {}))

    return (
        <div className="flex bg-gray-100 rounded-lg p-0.5 w-fit">
            <button
                onClick={() => {
                    onToggle(false)
                }}
                disabled={disabled}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${!isHumanMode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                    } ${disabled ? 'opacity-50' : ''}`}
            >
                Asistente
            </button>

            <button
                onClick={() => {
                    onToggle(true)
                }}
                disabled={disabled}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${isHumanMode
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                    } ${disabled ? 'opacity-50' : ''}`}
            >
                Humano
            </button>
        </div>
    )
}

export default ChatModeToggle