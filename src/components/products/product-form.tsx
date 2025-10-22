'use client'

import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ErrorMessage } from '@hookform/error-message'
import { Loader } from '@/components/loader'
import FormGenerator from '../forms/form-generator'
import { UploadIcon, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type CatalogItem = {
  id: string
  name: string
  active: boolean
}

type CreateProductFormProps = {
  id: string
  editingProduct?: any
  onCancel?: () => void
  onCreateNewProduct: any
  onUpdateProduct: any
  register: any
  setValue: any
  errors: any
  loading: boolean
  categories: CatalogItem[]
  materials: CatalogItem[]
  textures: CatalogItem[]
  seasons: CatalogItem[]
  uses: CatalogItem[]
  features: CatalogItem[]
}

export const CreateProductForm = ({ 
  id, 
  editingProduct, 
  onCancel, 
  onCreateNewProduct, 
  onUpdateProduct, 
  register, 
  setValue,
  errors, 
  loading,
  categories,
  materials,
  textures,
  seasons,
  uses,
  features,
}: CreateProductFormProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [featured, setFeatured] = useState(editingProduct?.featured || false)

  return (
    <div className="w-full">
      {/* Botón solo para CREAR producto - NO mostrar cuando esté editando */}
      {!editingProduct && (
        <div className="flex gap-3 pb-4 border-b border-gray-200 mb-6">
          <Button
            type="submit"
            className="flex-1 bg-orange hover:bg-orange/90"
            disabled={loading}
            onClick={onCreateNewProduct}
          >
            <Loader loading={loading}>
              Crear producto
            </Loader>
          </Button>
        </div>
      )}

    <form
        className="w-full flex flex-col gap-6 py-6 max-h-[60vh] overflow-y-auto px-2"
      onSubmit={editingProduct ? onUpdateProduct : onCreateNewProduct}
    >
        {/* Información Básica */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Información Básica</h3>
        
      <FormGenerator
        inputType="input"
        register={register}
          label="Nombre del Producto *"
        name="name"
        errors={errors}
          placeholder="Ej: Algodón Pima Premium"
        type="text"
      />

      <div className="flex flex-col items-start">
        <Label
          htmlFor="upload-product"
            className="flex gap-2 p-3 rounded-lg bg-peach text-gray-600 cursor-pointer font-semibold text-sm items-center hover:bg-peach/80 transition"
        >
          <Input
            {...register('image')}
            className="hidden"
            type="file"
            id="upload-product"
            accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
          />
            <UploadIcon size={18} />
            Subir imagen principal
        </Label>
        <p className="text-xs text-gray-500 mt-1">
          Solo se aceptan archivos JPG, JPEG y PNG (máx. 2MB)
        </p>
        {editingProduct && (
          <p className="text-xs text-blue-600 mt-1">
              Imagen actual: {editingProduct.image ? 'Seleccionada ✓' : 'No disponible'}
          </p>
        )}
        <ErrorMessage
          errors={errors}
          name="image"
          render={({ message }) => (
              <p className="text-red-400 mt-2 text-sm">
              {message === 'Required' ? '' : message}
            </p>
          )}
        />
      </div>

        <div className="grid grid-cols-2 gap-4">
      <FormGenerator
        inputType="input"
        register={register}
            label="Precio (S/) *"
        name="price"
        errors={errors}
            placeholder="100"
            type="text"
          />
          <FormGenerator
            inputType="input"
            register={register}
            label="Precio Oferta (S/)"
            name="salePrice"
            errors={errors}
            placeholder="80"
            type="text"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">Descripción</Label>
          <Textarea
            {...register('description')}
            id="description"
            placeholder="Describe las características principales de la tela..."
            className="mt-1 min-h-[80px]"
          />
        </div>
      </div>

      {/* Información Técnica de la Tela */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Información Técnica</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Material Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="materialId" className="text-sm font-medium text-gray-700">
              Material
            </Label>
            {materials.filter(m => m.active).length > 0 ? (
              <Select 
                defaultValue={editingProduct?.materialId || 'none'}
                onValueChange={(value) => setValue('materialId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {materials.filter(m => m.active).map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle size={16} className="text-yellow-600" />
                <p className="text-xs text-yellow-700">
                  No hay materiales.{' '}
                  <Link href="/catalogs" className="underline font-medium">
                    Crear en Catálogos
                  </Link>
                </p>
              </div>
            )}
          </div>

          <FormGenerator
            inputType="input"
            register={register}
            label="Color Principal"
            name="color"
            errors={errors}
            placeholder="Ej: Azul marino"
            type="text"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormGenerator
            inputType="input"
            register={register}
            label="Ancho"
            name="width"
            errors={errors}
            placeholder="Ej: 1.50m, 2.80m"
            type="text"
          />
          <FormGenerator
            inputType="input"
            register={register}
            label="Gramaje/Peso"
            name="weight"
            errors={errors}
            placeholder="Ej: 150 gr/m²"
            type="text"
          />
        </div>

        {/* Textura Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="textureId" className="text-sm font-medium text-gray-700">
            Textura
          </Label>
          {textures.filter(t => t.active).length > 0 ? (
            <Select 
              defaultValue={editingProduct?.textureId || 'none'}
              onValueChange={(value) => setValue('textureId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar textura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {textures.filter(t => t.active).map((texture) => (
                  <SelectItem key={texture.id} value={texture.id}>
                    {texture.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle size={16} className="text-yellow-600" />
              <p className="text-xs text-yellow-700">
                No hay texturas.{' '}
                <Link href="/catalogs" className="underline font-medium">
                  Crear en Catálogos
                </Link>
              </p>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="colors" className="text-sm font-medium text-gray-700">
            Colores Disponibles
          </Label>
          <Input
            {...register('colors')}
            id="colors"
            placeholder="Separar con comas: Rojo, Azul, Verde, Amarillo"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Separa los colores con comas</p>
        </div>
      </div>

      {/* Inventario */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Inventario</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <FormGenerator
            inputType="input"
            register={register}
            label="Stock"
            name="stock"
            errors={errors}
            placeholder="100"
            type="text"
          />
          <FormGenerator
            inputType="input"
            register={register}
            label="Unidad"
            name="unit"
            errors={errors}
            placeholder="metro"
            type="text"
          />
          <FormGenerator
            inputType="input"
            register={register}
            label="Stock Mínimo"
            name="minStock"
            errors={errors}
            placeholder="10"
            type="text"
          />
        </div>

        <FormGenerator
          inputType="input"
          register={register}
          label="SKU (Código)"
          name="sku"
          errors={errors}
          placeholder="TEL-ALG-001"
        type="text"
      />
      </div>

      {/* Sección Avanzada (Colapsable) */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-lg font-semibold text-gray-900 border-b pb-2 hover:text-orange transition"
        >
          <span>Información Adicional</span>
          {showAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-2">
            {/* Categoría Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-sm font-medium text-gray-700">
                Categoría
              </Label>
              {categories.filter(c => c.active).length > 0 ? (
                <Select 
                  defaultValue={editingProduct?.categoryId || 'none'}
                  onValueChange={(value) => setValue('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {categories.filter(c => c.active).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle size={16} className="text-yellow-600" />
                  <p className="text-xs text-yellow-700">
                    No hay categorías.{' '}
                    <Link href="/catalogs" className="underline font-medium">
                      Crear en Catálogos
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* Temporada Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="seasonId" className="text-sm font-medium text-gray-700">
                Temporada
              </Label>
              {seasons.filter(s => s.active).length > 0 ? (
                <Select 
                  defaultValue={editingProduct?.seasonId || 'none'}
                  onValueChange={(value) => setValue('seasonId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar temporada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {seasons.filter(s => s.active).map((season) => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle size={16} className="text-yellow-600" />
                  <p className="text-xs text-yellow-700">
                    No hay temporadas.{' '}
                    <Link href="/catalogs" className="underline font-medium">
                      Crear en Catálogos
                    </Link>
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="care" className="text-sm font-medium text-gray-700">Instrucciones de Cuidado</Label>
              <Textarea
                {...register('care')}
                id="care"
                placeholder="Lavado a mano, agua fría. No usar blanqueador..."
                className="mt-1 min-h-[60px]"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="featured" className="text-sm font-medium text-gray-700">
                  Producto Destacado
                </Label>
                <p className="text-xs text-gray-500">Aparecerá primero en el catálogo</p>
              </div>
              <Switch
                {...register('featured')}
                id="featured"
                checked={featured}
                onCheckedChange={setFeatured}
              />
            </div>
          </div>
        )}
      </div>

      {/* Botones solo para EDITAR producto - NO mostrar cuando esté creando */}
      {editingProduct && (
        <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
          <Button
            type="submit"
            className="flex-1 bg-orange hover:bg-orange/90"
            disabled={loading}
            onClick={onUpdateProduct}
          >
            <Loader loading={loading}>
              Actualizar producto
            </Loader>
          </Button>
          {onCancel && (
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
      )}
    </form>
    </div>
  )
}
