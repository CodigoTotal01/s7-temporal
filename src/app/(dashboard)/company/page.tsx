import { onGetCurrentDomainInfo } from '@/action/settings'
import CompanySettings from '@/components/forms/settings/company-settings'
import { redirect } from 'next/navigation'
import React from 'react'

// Forzar SSR para evitar error en build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = { params: { domain: string } }

const CompanyPage = async ({ params }: Props) => {
  const domain = await onGetCurrentDomainInfo(params.domain)
  if (!domain || !domain.domains || domain.domains.length === 0) redirect('/dashboard')

  const currentDomain = domain.domains[0]

  return (
    <div className="overflow-y-auto w-full chat-window flex-1 h-0">
      <CompanySettings
        id={currentDomain.id}
        name={currentDomain.name}
      />
    </div>
  )
}

export default CompanyPage
