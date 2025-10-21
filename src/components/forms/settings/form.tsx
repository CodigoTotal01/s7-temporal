'use client'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/hooks/settings/use-settings'
import React from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/loader'
import { DomainUpdate } from './domain-update'
import EditChatbotIcon from './edit-chatbot-icon'

const WelcomeMessage = dynamic(
  () => import('./greetings-message').then((props) => props.default),
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
}

const SettingsForm = ({ id, name, chatBot }: Props) => {
  const {
    register,
    onUpdateSettings,
    errors,
    loading,
  } = useSettings(id)
  return (
    <form
      className="flex flex-col gap-6 md:gap-8 py-6 md:py-10 w-full px-4 md:px-8"
      onSubmit={onUpdateSettings}
    >
      {/* Sección de Configuración de la Empresa */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 md:h-8 bg-orange rounded-full"></div>
            <h2 className="font-bold text-xl md:text-2xl text-gray-900">Configuración de la Empresa</h2>
          </div>
          <Separator orientation="horizontal" className="bg-gray-100" />
          <div className="space-y-4 md:space-y-6">
            <DomainUpdate
              name={name}
              register={register}
              errors={errors}
            />
            {/* <CodeSnippet id={id} /> */}
          </div>
        </div>
      </div>

      {/* Sección de Configuración del Asistente Virtual */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 md:h-8 bg-orange rounded-full"></div>
            <h2 className="font-bold text-xl md:text-2xl text-gray-900">Configuración del Asistente Virtual</h2>
          </div>
          <Separator orientation="horizontal" className="bg-gray-100" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            {/* Columna izquierda - Configuraciones */}
            <div className="space-y-6 md:space-y-8 order-2 lg:order-1">
              <EditChatbotIcon
                chatBot={chatBot}
                register={register}
                errors={errors}
              />
              <WelcomeMessage
                message={chatBot?.welcomeMessage!}
                register={register}
                errors={errors}
              />
            </div>

            {/* Columna derecha - Preview o información adicional */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-100 order-1 lg:order-2">
              <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-3 md:mb-4">Vista Previa</h3>
              <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                Aquí puedes ver cómo se verá tu asistente virtual una vez configurado.
              </p>
              <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-orange rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs md:text-sm">AI</span>
                  </div>
                  <div>
                    <p className="font-medium text-xs md:text-sm text-gray-900">Asistente Virtual</p>
                    <p className="text-xs text-gray-500">{name}</p>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg p-2 md:p-3">
                  <p className="text-xs md:text-sm text-gray-700">
                    {chatBot?.welcomeMessage || "Hola, ¿tienes alguna pregunta? Envíanos un mensaje aquí"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <Button
          type="submit"
          className="px-6 md:px-8 h-11 md:h-12 rounded-lg font-medium bg-orange hover:bg-orange/90 text-white order-1 sm:order-2"
        >
          <Loader loading={loading}>Guardar Cambios</Loader>
        </Button>
      </div>
    </form>
  )
}

export default SettingsForm
