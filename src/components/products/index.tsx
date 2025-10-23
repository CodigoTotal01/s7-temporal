'use client'

import React from 'react'
import TabsMenu from '../tabs/intex'
import { SideSheet } from '../sheet'
import { Plus, Trash2, Edit } from 'lucide-react'
import { CreateProductForm } from './product-form'
import { TabsContent } from '../ui/tabs'
import { DataTable } from '../table'
import { TableCell, TableRow } from '../ui/table'
import Image from 'next/image'
import { getMonthName } from '@/lib/utils'
import { useProducts } from '@/hooks/settings/use-settings'
import { Button } from '../ui/button'
import { Loader } from '../loader'
import { Switch } from '../ui/switch'

type Props = {
  products: {
    id: string
    name: string
    price: number
    image: string
    active: boolean
    createdAt: Date
    domainId: string | null
    category?: { id: string; name: string } | null
    material?: { id: string; name: string } | null
    texture?: { id: string; name: string } | null
    season?: { id: string; name: string } | null
  }[]
  id: string
  catalogs?: {
    categories: { id: string; name: string; active: boolean }[]
    materials: { id: string; name: string; active: boolean }[]
    textures: { id: string; name: string; active: boolean }[]
    seasons: { id: string; name: string; active: boolean }[]
    uses: { id: string; name: string; active: boolean }[]
    features: { id: string; name: string; active: boolean }[]
  }
}

const ProductTable = ({ id, products, catalogs }: Props) => {
  const {
    onCreateNewProduct,
    onUpdateProduct,
    onDeleteProduct,
    onToggleProduct,
    register,
    setValue,
    errors,
    loading,
    deleting,
    editingProduct,
    startEditing,
    cancelEditing,
  } = useProducts(id)

  // Usar los catálogos pasados como parámetro o valores por defecto
  const categories = catalogs?.categories || []
  const materials = catalogs?.materials || []
  const textures = catalogs?.textures || []
  const seasons = catalogs?.seasons || []
  const uses = catalogs?.uses || []
  const features = catalogs?.features || []

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="w-full p-4 md:p-6">
        {/* Header principal */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-orange" />
            </div>
            <div>
              <h2 className="font-bold text-xl md:text-2xl text-gray-900">Gestión de Productos</h2>
              <p className="text-sm text-gray-600 mt-1">
                Agrega productos a tu tienda y hazlos visibles para que los clientes puedan comprar
              </p>
            </div>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-orange/20 via-orange/40 to-orange/20"></div>
        </div>

        <div >
          <div className="flex flex-col gap-4 md:gap-6">

            <div className="relative">
              <TabsMenu
                className="w-full flex justify-start"
                triggers={[
                  {
                    label: 'Todos los productos',
                  },
                  { label: 'Activos' },
                  { label: 'Inactivos' },
                ]}
                button={
                  <div className="flex-1 flex justify-center sm:justify-end">
                    <SideSheet
                      description="Agrega productos a tu tienda y hazlos visibles para que los clientes puedan comprar."
                      title="Agregar un producto"
                      className="flex items-center gap-2 bg-orange hover:bg-orange/90 px-3 md:px-4 py-2 text-white font-medium rounded-lg text-sm transition duration-150 ease-in-out"
                      trigger={
                        <>
                          <Plus
                            size={16}
                            className="text-white"
                          />
                          <span className="text-white">Agregar producto</span>
                        </>
                      }
                    >
                      <CreateProductForm
                        id={id}
                        editingProduct={editingProduct}
                        onCancel={cancelEditing}
                        onCreateNewProduct={onCreateNewProduct}
                        onUpdateProduct={onUpdateProduct}
                        register={register}
                        setValue={setValue}
                        errors={errors}
                        loading={loading}
                        categories={categories}
                        materials={materials}
                        textures={textures}
                        seasons={seasons}
                        uses={uses}
                        features={features}
                      />
                    </SideSheet>
                  </div>
                }
              >
                <TabsContent value="Todos los productos" className="mt-4">
                  <div className=" overflow-x-auto">
                    {editingProduct ? (
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Editando: {editingProduct.name}
                        </h3>
                        <CreateProductForm
                          id={id}
                          editingProduct={editingProduct}
                          onCancel={cancelEditing}
                          onCreateNewProduct={onCreateNewProduct}
                          onUpdateProduct={onUpdateProduct}
                          register={register}
                          setValue={setValue}
                          errors={errors}
                          loading={loading}
                          categories={categories}
                          materials={materials}
                          textures={textures}
                          seasons={seasons}
                          uses={uses}
                          features={features}
                        />
                      </div>
                    ) : products.length > 0 ? (
                      <DataTable headers={['Imagen', 'Nombre', 'Material', 'Categoría', 'Precio', 'Estado', 'Acciones']}>
                        {products.filter(product => {
                          // Filtro por pestañas
                          const activeProducts = products.filter(p => p.active)
                          const inactiveProducts = products.filter(p => !p.active)

                          // Retornar todos los productos para la pestaña "Todos los productos"
                          return true
                        }).map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <Image
                                src={`https://ucarecdn.com/${product.image}/`}
                                width={50}
                                height={50}
                                alt="image"
                                style={{ objectFit: 'cover' }}
                                className="rounded-lg"
                              />
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                            <TableCell className="text-gray-700">
                              {product.material?.name || <span className="text-gray-400 italic">Sin material</span>}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {product.category?.name || <span className="text-gray-400 italic">Sin categoría</span>}
                            </TableCell>
                            <TableCell className="font-semibold text-orange">S/{product.price}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Switch
                                  checked={product.active}
                                  onCheckedChange={() => onToggleProduct(product.id)}
                                />
                                <span className={`text-xs font-medium ${product.active ? 'text-green-600' : 'text-red-600'}`}>
                                  {product.active ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditing(product)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                                >
                                  <Edit size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteProduct(product.id)}
                                  disabled={deleting === product.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                >
                                  {deleting === product.id ? (
                                    <Loader loading={true}>
                                      <Trash2 size={16} />
                                    </Loader>
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </DataTable>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 mx-auto bg-orange/10 rounded-full flex items-center justify-center mb-4">
                          <Plus className="w-8 h-8 text-orange" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No cuentas con productos
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 max-w-md">
                          Comienza agregando tu primer producto para que los clientes puedan ver y comprar en tu tienda.
                        </p>
                        <SideSheet
                          description="Agrega productos a tu tienda y hazlos visibles para que los clientes puedan comprar."
                          title="Agregar un producto"
                          className="flex items-center gap-2 bg-orange hover:bg-orange/90 px-6 py-3 text-white font-medium rounded-lg text-sm transition duration-150 ease-in-out"
                          trigger={
                            <>
                              <Plus size={16} className="text-white" />
                              <span className="text-white">Agregar mi primer producto</span>
                            </>
                          }
                        >
                          <CreateProductForm
                            id={id}
                            editingProduct={editingProduct}
                            onCancel={cancelEditing}
                            onCreateNewProduct={onCreateNewProduct}
                            onUpdateProduct={onUpdateProduct}
                            register={register}
                            setValue={setValue}
                            errors={errors}
                            loading={loading}
                            categories={categories}
                            materials={materials}
                            textures={textures}
                            seasons={seasons}
                            uses={uses}
                            features={features}
                          />
                        </SideSheet>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="Activos" className="mt-4">
                  <div className="bg-gray-50 rounded-lg p-3 md:p-4 lg:p-6 border border-gray-100 overflow-x-auto">
                    {products.filter(p => p.active).length > 0 ? (
                      <DataTable headers={['Imagen', 'Nombre', 'Material', 'Categoría', 'Precio', 'Estado', 'Acciones']}>
                        {products.filter(p => p.active).map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <Image
                                src={`https://ucarecdn.com/${product.image}/`}
                                width={50}
                                height={50}
                                alt="image"
                                style={{ objectFit: 'cover' }}
                                className="rounded-lg"
                              />
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                            <TableCell className="text-gray-700">
                              {product.material?.name || <span className="text-gray-400 italic">Sin material</span>}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {product.category?.name || <span className="text-gray-400 italic">Sin categoría</span>}
                            </TableCell>
                            <TableCell className="font-semibold text-orange">S/{product.price}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Switch
                                  checked={product.active}
                                  onCheckedChange={() => onToggleProduct(product.id)}
                                />
                                <span className={`text-xs font-medium ${product.active ? 'text-green-600' : 'text-red-600'}`}>
                                  {product.active ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditing(product)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                                >
                                  <Edit size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteProduct(product.id)}
                                  disabled={deleting === product.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                >
                                  {deleting === product.id ? (
                                    <Loader loading={true}>
                                      <Trash2 size={16} />
                                    </Loader>
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </DataTable>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 mx-auto bg-orange/10 rounded-full flex items-center justify-center mb-4">
                          <Plus className="w-8 h-8 text-orange" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No hay productos activos
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 max-w-md">
                          Todos tus productos están inactivos. Actívalos para que los clientes puedan verlos.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="Inactivos" className="mt-4">
                  <div className="bg-gray-50 rounded-lg p-3 md:p-4 lg:p-6 border border-gray-100 overflow-x-auto">
                    {products.filter(p => !p.active).length > 0 ? (
                      <DataTable headers={['Imagen', 'Nombre', 'Material', 'Categoría', 'Precio', 'Estado', 'Acciones']}>
                        {products.filter(p => !p.active).map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <Image
                                src={`https://ucarecdn.com/${product.image}/`}
                                width={50}
                                height={50}
                                alt="image"
                                style={{ objectFit: 'cover' }}
                                className="rounded-lg"
                              />
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                            <TableCell className="text-gray-700">
                              {product.material?.name || <span className="text-gray-400 italic">Sin material</span>}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {product.category?.name || <span className="text-gray-400 italic">Sin categoría</span>}
                            </TableCell>
                            <TableCell className="font-semibold text-orange">S/{product.price}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Switch
                                  checked={product.active}
                                  onCheckedChange={() => onToggleProduct(product.id)}
                                />
                                <span className={`text-xs font-medium ${product.active ? 'text-green-600' : 'text-red-600'}`}>
                                  {product.active ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditing(product)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                                >
                                  <Edit size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteProduct(product.id)}
                                  disabled={deleting === product.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                >
                                  {deleting === product.id ? (
                                    <Loader loading={true}>
                                      <Trash2 size={16} />
                                    </Loader>
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </DataTable>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 mx-auto bg-orange/10 rounded-full flex items-center justify-center mb-4">
                          <Plus className="w-8 h-8 text-orange" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No hay productos inactivos
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 max-w-md">
                          Todos tus productos están activos y visibles para los clientes.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </TabsMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTable
