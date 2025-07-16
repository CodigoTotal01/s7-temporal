'use client'
import React from 'react'
import { useHelpDesk } from '@/hooks/settings/use-settings'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card'
import { Section } from '@/components/section-label'
import FormGenerator from '../form-generator'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/loader'
import Accordion from '@/components/accordian'

type Props = {
  id: string
}

const HelpDesk = ({ id }: Props) => {
  const { register, errors, onSubmitQuestion, isQuestions, loading } =
    useHelpDesk(id)

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <div className="bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-1 h-6 md:h-8 bg-blue-500 rounded-full"></div>
          <h3 className="font-semibold text-lg md:text-xl text-gray-900">Ayuda</h3>
        </div>
        <form
          onSubmit={onSubmitQuestion}
          className="flex flex-col gap-4 md:gap-6"
        >
          <div className="flex flex-col gap-3">
            <Section
              label="Pregunta"
              message="Añade una pregunta que creas que se hace frecuentemente."
            />
            <FormGenerator
              inputType="input"
              register={register}
              errors={errors}
              form="help-desk-form"
              name="question"
              placeholder="Escribe tu pregunta"
              type="text"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Section
              label="Respuesta"
              message="La respuesta para la pregunta anterior."
            />
            <FormGenerator
              inputType="textarea"
              register={register}
              errors={errors}
              name="answer"
              form="help-desk-form"
              placeholder="Escribe tu respuesta"
              type="text"
              lines={5}
            />
          </div>
          <Button
            type="submit"
            className="bg-orange hover:bg-orange/90 transition duration-150 ease-in-out text-white font-semibold px-6 py-2 rounded-lg"
          >
            Crear
          </Button>
        </form>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-1 h-6 md:h-8 bg-green-500 rounded-full"></div>
          <h3 className="font-semibold text-lg md:text-xl text-gray-900">Preguntas Existentes</h3>
        </div>
        <div className="space-y-3 md:space-y-4 max-h-96 overflow-y-auto">
          <Loader loading={loading}>
            {isQuestions.length ? (
              isQuestions.map((question) => (
                <Accordion
                  key={question.id}
                  trigger={question.question}
                  content={question.answer}
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No hay preguntas para mostrar</p>
            )}
          </Loader>
        </div>
      </div>
    </div>
  )
}

export default HelpDesk
