'use client'

import React from 'react'
import TabsMenu from '../tabs/intex'
import { TabsContent } from '../ui/tabs'
import { CATALOG_TABS_MENU } from '@/constants/menu'
import CatalogManager from './catalog-manager'

type Props = {
  domainId: string
}

const CatalogsManager = ({ domainId }: Props) => {
  return (
    <div className="w-full px-4 md:px-8 pb-6 md:pb-10">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 md:h-8 bg-orange rounded-full"></div>
            <h2 className="font-bold text-xl md:text-2xl text-gray-900">
              Catálogos de Productos
            </h2>
          </div>
          <p className="text-sm md:text-base text-gray-600 font-light">
            Gestiona las categorías, materiales, texturas y demás catálogos que se usarán en tus productos
          </p>

          <TabsMenu
            className="w-full"
            triggers={CATALOG_TABS_MENU}
          >
            <TabsContent value="categorías" className="mt-4">
              <CatalogManager
                domainId={domainId}
                type="category"
                title="Categorías"
                description="Ejemplo: Básicas, Premium, Especiales"
              />
            </TabsContent>

            <TabsContent value="materiales" className="mt-4">
              <CatalogManager
                domainId={domainId}
                type="material"
                title="Materiales"
                description="Ejemplo: Algodón, Lino, Seda, Polyester"
              />
            </TabsContent>

            <TabsContent value="texturas" className="mt-4">
              <CatalogManager
                domainId={domainId}
                type="texture"
                title="Texturas"
                description="Ejemplo: Lisa, Texturizada, Satinada, Rizada"
              />
            </TabsContent>

            <TabsContent value="temporadas" className="mt-4">
              <CatalogManager
                domainId={domainId}
                type="season"
                title="Temporadas"
                description="Ejemplo: Verano, Invierno, Otoño, Primavera, Todo el año"
              />
            </TabsContent>

            <TabsContent value="usos" className="mt-4">
              <CatalogManager
                domainId={domainId}
                type="use"
                title="Usos Recomendados"
                description="Ejemplo: Vestidos, Camisas, Blusas, Pantalones, Tapicería"
              />
            </TabsContent>

            <TabsContent value="características" className="mt-4">
              <CatalogManager
                domainId={domainId}
                type="feature"
                title="Características"
                description="Ejemplo: Impermeable, Elástico, Antibacterial, Antiarrugas"
              />
            </TabsContent>
          </TabsMenu>
        </div>
      </div>
    </div>
  )
}

export default CatalogsManager

