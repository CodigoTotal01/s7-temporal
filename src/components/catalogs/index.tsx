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
    <div className="w-full h-full overflow-y-auto">
      <div className="w-full p-4 md:p-6">
        {/* Header principal */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-xl md:text-2xl text-gray-900">Gestión de Catálogos</h2>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona las categorías, materiales, texturas y demás catálogos que se usarán en tus productos
              </p>
            </div>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-orange/20 via-orange/40 to-orange/20"></div>
        </div>

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
  )
}

export default CatalogsManager

