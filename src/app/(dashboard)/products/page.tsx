import { onGetCurrentDomainInfo } from '@/action/settings'
import ProductTable from '@/components/products'
import { redirect } from 'next/navigation'
import React from 'react'

// Forzar SSR para evitar error en build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = { params: { domain: string } }

const ProductsPage = async ({ params }: Props) => {
  const domain = await onGetCurrentDomainInfo(params.domain)
  if (!domain || !domain.domains || domain.domains.length === 0) redirect('/dashboard')

  const currentDomain = domain.domains[0]

  return (
    <div className="overflow-y-auto w-full chat-window flex-1 h-0">
      <ProductTable
        id={currentDomain.id}
        products={currentDomain.products || []}
        catalogs={{
          categories: (currentDomain as any).categories || [],
          materials: (currentDomain as any).materials || [],
          textures: (currentDomain as any).textures || [],
          seasons: (currentDomain as any).seasons || [],
          uses: (currentDomain as any).uses || [],
          features: (currentDomain as any).features || [],
        }}
      />
    </div>
  )
}

export default ProductsPage
