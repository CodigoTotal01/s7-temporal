'use client'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/hooks/settings/use-settings'
import React from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/loader'
import EditChatbotIcon from './edit-chatbot-icon'
import { Bot, MessageSquare, Save } from 'lucide-react'

const WelcomeMessage = dynamic(
    () => import('./greetings-message').then((props) => props.default),
    {
        ssr: false,
    }
)

const BotTrainingForm = dynamic(
    () => import('./bot-training').then((props) => props.default),
    {
        ssr: false,
    }
)

type Props = {
    id: string
    name: string
    chatBot: {
        id: string
        icon: string | null
        welcomeMessage: string | null
    } | null
    helpdesk?: Array<{ id: string; question: string; answer: string }>
    filterQuestions?: Array<{ id: string; question: string }>
}

const ChatbotSettings = ({ id, name, chatBot, helpdesk, filterQuestions }: Props) => {
    const {
        register,
        onUpdateSettings,
        errors,
        loading,
    } = useSettings(id)

    return (
        <div className="w-full h-full overflow-y-auto">
            <div className="w-full space-y-8 p-4 md:p-6">
                {/* Header principal */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
                            <Bot className="w-6 h-6 text-orange" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl md:text-2xl text-gray-900">Configuración del Asistente Virtual</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Personaliza tu asistente virtual y configura sus respuestas
                            </p>
                        </div>
                    </div>
                    <div className="w-full h-px bg-gradient-to-r from-orange/20 via-orange/40 to-orange/20"></div>
                </div>

                <form onSubmit={onUpdateSettings} className="space-y-8">
                    {/* Sección de Configuración del Asistente Virtual */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center">
                                <Bot className="w-4 h-4 text-orange" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">Personalización del Asistente</h3>
                                <p className="text-sm text-gray-600">Configura la apariencia y mensaje de bienvenida</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Columna izquierda - Configuraciones */}
                            <div className="space-y-6 order-2 lg:order-1">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <EditChatbotIcon
                                        chatBot={chatBot}
                                        register={register}
                                        errors={errors}
                                    />
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <WelcomeMessage
                                        message={chatBot?.welcomeMessage!}
                                        register={register}
                                        errors={errors}
                                    />
                                </div>
                            </div>

                            {/* Columna derecha - Vista Previa */}
                            <div className="order-1 lg:order-2">
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-4 border border-gray-200/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MessageSquare className="w-4 h-4 text-orange" />
                                        <h4 className="font-semibold text-gray-900">Vista Previa</h4>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-4">
                                        Así se verá tu asistente virtual para los clientes
                                    </p>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-orange rounded-full flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">AI</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">Asistente Virtual</p>
                                                <p className="text-xs text-gray-500">{name}</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-100 rounded-lg p-3">
                                            <p className="text-sm text-gray-700">
                                                {chatBot?.welcomeMessage || "Hola, ¿tienes alguna pregunta? Envíanos un mensaje aquí"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botón de acción */}
                        <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="px-8 h-12 rounded-lg font-medium bg-orange hover:bg-orange/90 text-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                <Loader loading={loading}>Guardar Cambios</Loader>
                            </Button>
                        </div>
                    </div>

                    {/* Sección de Configuración de Respuestas */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-orange" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">Configuración de Respuestas</h3>
                                <p className="text-sm text-gray-600">Gestiona las preguntas frecuentes y respuestas del asistente</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <BotTrainingForm
                                id={id}
                                helpdesk={helpdesk || []}
                                filterQuestions={filterQuestions || []}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ChatbotSettings
