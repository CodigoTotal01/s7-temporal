import React, { useEffect } from 'react'
import { FieldValues, UseFormRegister, UseFormSetValue } from 'react-hook-form'

type Props = {
  register: UseFormRegister<FieldValues>
  setValue: UseFormSetValue<FieldValues>
  domains?:
  | {
    name: string
    id: string
    icon: string
  }[]
  | undefined
}

const ConversationSearch = ({ register, setValue, domains }: Props) => {
  // Automáticamente seleccionar la primera empresa si solo hay una
  useEffect(() => {
    if (domains && domains.length === 1) {
      setValue('domain', domains[0].id)
    }
  }, [domains, setValue])

  // Si solo hay una empresa, no mostrar el dropdown
  if (domains && domains.length === 1) {
    return (
      <div className="flex flex-col py-3">
        <div className="px-3 py-4 text-sm border-[1px] rounded-lg mr-5 bg-gray-50 text-gray-600">
          {domains[0].name}
        </div>
        {/* Campo oculto para mantener el valor */}
        <input type="hidden" {...register('domain')} value={domains[0].id} />
      </div>
    )
  }

  // Si hay múltiples empresas, mostrar el dropdown (caso raro)
  return (
    <div className="flex flex-col py-3">
      <select
        {...register('domain')}
        className="px-3 py-4 text-sm border-[1px] rounded-lg mr-5"
      >
        <option
          disabled
          selected
        >
          Selecciona una empresa
        </option>
        {domains?.map((domain) => (
          <option
            value={domain.id}
            key={domain.id}
          >
            {domain.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ConversationSearch
