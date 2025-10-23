'use client'
import { Section } from '@/components/section-label'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card'
import { useFilterQuestions, useHelpDesk } from '@/hooks/settings/use-settings'
import React from 'react'
import FormGenerator from '../form-generator'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/loader'
import { Spinner } from '@/components/spinner'
import { Edit, Trash2, X } from 'lucide-react'

type Props = {
  id: string
  initialQuestions?: Array<{ id: string; question: string }>
}

const FilterQuestions = ({ id, initialQuestions }: Props) => {
  const {
    register,
    errors,
    onAddFilterQuestions,
    onDeleteQuestion,
    startEditing,
    cancelEditing,
    editingQuestion,
    isQuestions,
    loading,
    deleting
  } = useFilterQuestions(id, initialQuestions)

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <div className="bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-1 h-6 md:h-8 bg-purple-500 rounded-full"></div>
          <h3 className="font-semibold text-lg md:text-xl text-gray-900">
            {editingQuestion ? 'Editar Pregunta' : 'Preguntas del Bot'}
          </h3>
        </div>
        <form
          onSubmit={onAddFilterQuestions}
          className="flex flex-col gap-4 md:gap-6"
        >
          <div className="flex flex-col gap-3">
            <Section
              label="Pregunta"
              message="Añade una pregunta que quieras que tu asistente virtual haga al cliente cuando solicite agendar una cita"
            />
            <FormGenerator
              inputType="input"
              register={register}
              errors={errors}
              form="filter-questions-form"
              name="question"
              placeholder="Ejemplo: ¿Qué tipo de servicio necesitas?"
              type="text"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              className="bg-orange hover:bg-orange/90 transition duration-150 ease-in-out text-white font-semibold px-6 py-2 rounded-lg flex-1"
            >
              {editingQuestion ? 'Actualizar' : 'Crear'}
            </Button>
            {editingQuestion && (
              <Button
                type="button"
                onClick={cancelEditing}
                variant="outline"
                className="px-6 py-2 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-1 h-6 md:h-8 bg-indigo-500 rounded-full"></div>
          <h3 className="font-semibold text-lg md:text-xl text-gray-900">Preguntas Existentes</h3>
        </div>
        <div className="space-y-3 md:space-y-4 max-h-96 overflow-y-auto">
          <Loader loading={loading}>
            {isQuestions.length ? (
              isQuestions.map((question) => (
                <div
                  key={question.id}
                  className={`bg-white rounded-lg p-3 md:p-4 border transition-all ${editingQuestion?.id === question.id
                      ? 'border-orange ring-2 ring-orange/20'
                      : 'border-gray-200'
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-gray-900 text-sm md:text-base flex-1">
                      {question.question}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(question)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteQuestion(question.id)}
                        disabled={deleting === question.id}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        {deleting === question.id ? (
                          <Spinner noPadding />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
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

export default FilterQuestions
