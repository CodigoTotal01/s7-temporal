import React from 'react'
import { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form'
import FormGenerator from '../form-generator'
import { Button } from '@/components/ui/button'

type Props = {
  questions: {
    id: string
    question: string
    answered: string | null
  }[]
  register: UseFormRegister<FieldValues>
  error: FieldErrors<FieldValues>
  onNext(): void
}

const QuestionsForm = ({ questions, register, error, onNext }: Props) => {
  return (
    <div className="flex flex-col gap-5 justify-center">
      <div className="flex justify-center">
        <h2 className="text-4xl font-bold mb-5">Detalles</h2>
      </div>
      {questions.map((question) => (
        <FormGenerator
          defaultValue={question.answered || ''}
          key={question.id}
          name={`question-${question.id}`}
          errors={error}
          register={register}
          label={question.question}
          type="text"
          inputType="input"
          placeholder={question.answered || 'No respondido'}
        />
      ))}

      <Button
        className=""
        type="button"
        onClick={onNext}
      >
        Siguiente
      </Button>
    </div>
  )
}

export default QuestionsForm
