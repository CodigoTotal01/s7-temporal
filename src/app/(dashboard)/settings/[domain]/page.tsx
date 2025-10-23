import { onGetCurrentDomainInfo } from '@/action/settings'
import BotTrainingForm from '@/components/forms/settings/bot-training'
import SettingsForm from '@/components/forms/settings/form'
import AvailabilityScheduleForm from '@/components/forms/settings/availability-schedule'
import ProductTable from '@/components/products'
import { redirect } from 'next/navigation'
import React from 'react'

// Forzar SSR para evitar error en build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = { params: { domain: string } }

const DomainSettingsPage = async ({ params }: Props) => {
  const domain = await onGetCurrentDomainInfo(params.domain)
  if (!domain || !domain.domains || domain.domains.length === 0) redirect('/dashboard')

  const currentDomain = domain.domains[0]

  return (
    <>
      <div className="overflow-y-auto w-full chat-window flex-1 h-0">
        <SettingsForm
          chatBot={currentDomain.chatBot}
          id={currentDomain.id}
          name={currentDomain.name}
        />
        <AvailabilityScheduleForm id={currentDomain.id} />
        <BotTrainingForm 
          id={currentDomain.id} 
          helpdesk={currentDomain.helpdesk || []}
          filterQuestions={currentDomain.filterQuestions || []}
        />
        <ProductTable
          id={currentDomain.id}
          products={currentDomain.products || []}
          catalogs={{
            categories: currentDomain.categories || [],
            materials: currentDomain.materials || [],
            textures: currentDomain.textures || [],
            seasons: currentDomain.seasons || [],
            uses: currentDomain.uses || [],
            features: currentDomain.features || [],
          }}
        />
      </div>
    </>
  )
}

export default DomainSettingsPage
