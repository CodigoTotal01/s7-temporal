import React from 'react'
import TabsMenu from '../tabs/intex'
import { SideSheet } from '../sheet'
import { Plus } from 'lucide-react'
import { CreateProductForm } from './product-form'
import { TabsContent } from '../ui/tabs'
import { DataTable } from '../table'
import { TableCell, TableRow } from '../ui/table'
import Image from 'next/image'
import { getMonthName } from '@/lib/utils'

type Props = {
  products: {
    id: string
    name: string
    price: number
    image: string
    createdAt: Date
    domainId: string | null
  }[]
  id: string
}

const ProductTable = ({ id, products }: Props) => {
  return (
    <div className="w-full px-4 md:px-8 pb-6 md:pb-10">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 md:h-8 bg-orange rounded-full"></div>
            <h2 className="font-bold text-xl md:text-2xl text-gray-900">Productos</h2>
          </div>
          <p className="text-sm md:text-base text-gray-600 font-light">
            Agrega productos a tu tienda y hazlos visibles para que los clientes puedan comprar.
          </p>

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
                    <CreateProductForm id={id} />
                  </SideSheet>
                </div>
              }
            >
              <TabsContent value="Todos los productos" className="mt-4">
                <div className="bg-gray-50 rounded-lg p-3 md:p-4 lg:p-6 border border-gray-100 overflow-x-auto">
                  {products.length > 0 ? (
                    <DataTable headers={['Imagen destacada', 'Nombre', 'Precio', 'Creado']}>
                      {products.map((product) => (
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
                          <TableCell className="font-semibold text-orange">S/{product.price}</TableCell>
                          <TableCell className="text-right text-gray-600">
                            {product.createdAt.getDate()}{' '}
                            {getMonthName(product.createdAt.getMonth())}{' '}
                            {product.createdAt.getFullYear()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </DataTable>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 md:py-12 lg:py-16 text-center px-4">
                      <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gray-200 rounded-full flex items-center justify-center mb-3 md:mb-4 lg:mb-6">
                        <Plus size={20} className="text-gray-400 md:text-2xl" />
                      </div>
                      <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-2 md:mb-3">
                        No cuentas con productos
                      </h3>
                      <p className="text-xs md:text-sm lg:text-base text-gray-600 mb-4 md:mb-6 lg:mb-8 max-w-sm md:max-w-md px-2">
                        Comienza agregando tu primer producto para que los clientes puedan ver y comprar en tu tienda.
                      </p>
                      <SideSheet
                        description="Agrega productos a tu tienda y hazlos visibles para que los clientes puedan comprar."
                        title="Agregar un producto"
                        className="flex items-center gap-2 bg-orange hover:bg-orange/90 px-3 md:px-4 lg:px-6 py-2 md:py-3 text-white font-medium rounded-lg text-xs md:text-sm lg:text-base transition duration-150 ease-in-out"
                        trigger={
                          <>
                            <Plus size={16} className="text-white md:text-lg" />
                            <span className="text-white">Agregar mi primer producto</span>
                          </>
                        }
                      >
                        <CreateProductForm id={id} />
                      </SideSheet>
                    </div>
                  )}
                </div>
              </TabsContent>
            </TabsMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTable
