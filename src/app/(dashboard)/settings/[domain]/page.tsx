import { onGetCurrentDomainInfo } from '@/action/settings'
import BotTrainingForm from '@/components/forms/settings/bot-training'
import SettingsForm from '@/components/forms/settings/form'
import InfoBar from '@/components/infobar'
import ProductTable from '@/components/products'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = { params: { domain: string } }

const DomainSettingsPage = async ({ params }: Props) => {
  const domain = await onGetCurrentDomainInfo(params.domain)
  if (!domain || !domain.domains || domain.domains.length === 0) redirect('/dashboard')

  const currentDomain = domain.domains[0]

  return (
    <>
      <InfoBar />
      <div className="overflow-y-auto w-full chat-window flex-1 h-0">
        <SettingsForm
          plan={domain.subscription?.plan!}
          chatBot={currentDomain.chatBot}
          id={currentDomain.id}
          name={currentDomain.name}
        />
        <BotTrainingForm id={currentDomain.id} />
        <ProductTable
          id={currentDomain.id}
          products={currentDomain.products || []}
        />
      </div>
    </>
  )
}

export default DomainSettingsPage
