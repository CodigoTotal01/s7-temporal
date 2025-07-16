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
    <div>
      <div>
        <h2 className="font-bold text-2xl">Productos</h2>
        <p className="text-sm font-light">
          Agrega productos a tu tienda y hazlos visibles para que los clientes puedan comprar.
        </p>
      </div>
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
          <div className="flex-1 flex justify-end">
            <SideSheet
              description="Agrega productos a tu tienda y hazlos visibles para que los clientes puedan comprar."
              title="Agregar un producto"
              className="flex items-center gap-2 bg-orange px-4 py-2 text-black font-semibold rounded-lg text-sm"
              trigger={
                <>
                  <Plus
                    size={20}
                    className="text-white"
                  />
                  <p className="text-white">Agregar producto</p>
                </>
              }
            >
              <CreateProductForm id={id} />
            </SideSheet>
          </div>
        }
      >
        <TabsContent value="Todos los productos">
          <DataTable headers={['Imagen destacada', 'Nombre', 'Precio', 'Creado']}>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Image
                    src={`https://ucarecdn.com/${product.image}/`}
                    width={50}
                    height={50}
                    alt="image"
                  />
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>S/{product.price}</TableCell>
                <TableCell className="text-right">
                  {product.createdAt.getDate()}{' '}
                  {getMonthName(product.createdAt.getMonth())}{' '}
                  {product.createdAt.getFullYear()}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        </TabsContent>
      </TabsMenu>
    </div>
  )
}

export default ProductTable
