import React from 'react'

type Props = {}

const CatalogsPage = async (props: Props) => {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Catálogos de Productos</h1>
        <p className="text-gray-600">
          Selecciona una empresa desde el menú lateral para gestionar sus catálogos
        </p>
      </div>
    </div>
  )
}

export default CatalogsPage

