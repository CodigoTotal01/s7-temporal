'use client'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/hooks/settings/use-settings'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/loader'
import { DomainUpdate } from './domain-update'
import { Building2, Save } from 'lucide-react'

type Props = {
  id: string
  name: string
}

const CompanySettings = ({ id, name }: Props) => {
  const {
    register,
    onUpdateSettings,
    errors,
    loading,
  } = useSettings(id)

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="w-full space-y-8 p-4 md:p-6">
        {/* Header con icono y título */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-orange" />
            </div>
            <div>
              <h2 className="font-bold text-xl md:text-2xl text-gray-900">Configuración de la Empresa</h2>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona la información básica de tu empresa
              </p>
            </div>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-orange/20 via-orange/40 to-orange/20"></div>
        </div>

        <form onSubmit={onUpdateSettings} className="space-y-8">
          {/* Información actual */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-orange rounded-full"></div>
              <h3 className="font-semibold text-lg text-gray-900">Información Actual</h3>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200/50">
              <p className="text-sm text-gray-600">
                Nombre actual: <span className="font-semibold text-gray-900 text-base">{name}</span>
              </p>
            </div>
          </div>

          {/* Formulario de actualización */}
          <div className="bg-white rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-orange rounded-full"></div>
              <h3 className="font-semibold text-lg text-gray-900">Actualizar Información</h3>
            </div>

            <div className="space-y-4">
              <DomainUpdate
                name={name}
                register={register}
                errors={errors}
              />
            </div>

            {/* Botón de acción integrado */}
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
        </form>
      </div>
    </div>
  )
}

export default CompanySettings
