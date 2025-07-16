import TabsMenu from '@/components/tabs/intex'
import { TabsContent } from '@/components/ui/tabs'
import { HELP_DESK_TABS_MENU } from '@/constants/menu'
import React from 'react'
import HelpDesk from './help-desk'
import FilterQuestions from './filter-questions'

type Props = {
  id: string
}

const BotTrainingForm = ({ id }: Props) => {
  return (
    <div className="w-full px-4 md:px-8 pb-6 md:pb-10">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 md:h-8 bg-orange rounded-full"></div>
            <h2 className="font-bold text-xl md:text-2xl text-gray-900">Entrenamiento de Bot</h2>
          </div>
          <p className="text-sm md:text-base text-gray-600 font-light">
            Establece preguntas frecuentes, crea preguntas para capturar información de leads y entrena a tu bot para que actúe como lo deseas.
          </p>
          <TabsMenu triggers={HELP_DESK_TABS_MENU}>
            <TabsContent
              value="soporte"
              className="w-full"
            >
              <HelpDesk id={id} />
            </TabsContent>
            <TabsContent value="preguntas">
              <FilterQuestions id={id} />
            </TabsContent>
          </TabsMenu>
        </div>
      </div>
    </div>
  )
}

export default BotTrainingForm
