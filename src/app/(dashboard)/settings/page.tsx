import InfoBar from '@/components/infobar';
import BillingSettings from '@/components/settings/billing-settings';
import ChangePassword from '@/components/settings/change-password';
import React from 'react'

type Props = {}

const Page = (props: Props) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-porcelain to-white">
      <InfoBar />
      <div className="w-full flex-1 flex flex-col items-center py-8 px-2 sm:px-4 md:px-8 lg:px-12">
        <div className="w-full max-w-3xl">
          
          <div className="space-y-8">
            {/* Sección de contraseña */}
            <div className="bg-white rounded-2xl shadow-lg border border-platinum p-6 md:p-8">
              <ChangePassword />
            </div>
            {/* Sección de facturación (comentada por ahora) */}
            {/* <div className="bg-white rounded-2xl shadow-lg border border-platinum p-6 md:p-8">
              <BillingSettings />
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page;