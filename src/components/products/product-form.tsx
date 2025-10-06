'use client'

import React from 'react'

import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { ErrorMessage } from '@hookform/error-message'
import { Loader } from '@/components/loader'
import FormGenerator from '../forms/form-generator'
import { UploadIcon } from 'lucide-react'
import { useProducts } from '@/hooks/settings/use-settings'

type CreateProductFormProps = {
  id: string
  editingProduct?: any
  onCancel?: () => void
  onCreateNewProduct: any
  onUpdateProduct: any
  register: any
  errors: any
  loading: boolean
}

export const CreateProductForm = ({ 
  id, 
  editingProduct, 
  onCancel, 
  onCreateNewProduct, 
  onUpdateProduct, 
  register, 
  errors, 
  loading 
}: CreateProductFormProps) => {
  return (
    <form
      className="mt-3 w-full flex flex-col gap-5 py-10"
      onSubmit={editingProduct ? onUpdateProduct : onCreateNewProduct}
    >
      <FormGenerator
        inputType="input"
        register={register}
        label="Nombre"
        name="name"
        errors={errors}
        placeholder="Nombre del producto"
        type="text"
      />
      <div className="flex flex-col items-start">
        <Label
          htmlFor="upload-product"
          className="flex gap-2 p-3 rounded-lg bg-peach text-gray-600 cursor-pointer font-semibold text-sm items-center"
        >
          <Input
            {...register('image')}
            className="hidden"
            type="file"
            id="upload-product"
            accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
          />
          <UploadIcon />
          Subir imagen
        </Label>
        <p className="text-xs text-gray-500 mt-1">
          Solo se aceptan archivos JPG, JPEG y PNG (máx. 2MB)
        </p>
        {editingProduct && (
          <p className="text-xs text-blue-600 mt-1">
            Imagen actual: {editingProduct.image ? 'Seleccionada' : 'No disponible'}
          </p>
        )}
        <ErrorMessage
          errors={errors}
          name="image"
          render={({ message }) => (
            <p className="text-red-400 mt-2">
              {message === 'Required' ? '' : message}
            </p>
          )}
        />
      </div>
      <FormGenerator
        inputType="input"
        register={register}
        label="Precio"
        name="price"
        errors={errors}
        placeholder="Precio del producto"
        type="text"
      />
      <div className="flex gap-3">
        <Button
          type="submit"
          className="flex-1"
        >
          <Loader loading={loading}>
            {editingProduct ? 'Actualizar producto' : 'Crear producto'}
          </Loader>
        </Button>
        {editingProduct && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
