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
}

export const CreateProductForm = ({ id }: CreateProductFormProps) => {
  const { onCreateNewProduct, register, errors, loading } = useProducts(id)
  return (
    <form
      className="mt-3 w-full flex flex-col gap-5 py-10"
      onSubmit={onCreateNewProduct}
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
          />
          <UploadIcon />
          Subir imagen
        </Label>
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
      <Button
        type="submit"
        className="w-full"
      >
        <Loader loading={loading}>Crear producto</Loader>
      </Button>
    </form>
  )
}
