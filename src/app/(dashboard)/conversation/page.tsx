import { onGetAllAccountDomains } from '@/action/settings'
import ConversationMenu from '@/components/conversations'
import Messenger from '@/components/conversations/messenger'
import InfoBar from '@/components/infobar'
import { Separator } from '@/components/ui/separator'
import React from 'react'

type Props = {}

const ConversationPage = async (props: Props) => {
  const domains = await onGetAllAccountDomains()
  return (
    <div className="w-full h-full flex flex-col lg:flex-row">
      <div className="w-full lg:w-[600px] lg:min-w-[600px] lg:max-w-[600px] h-1/2 lg:h-full">
        <ConversationMenu domains={domains?.domains} />
      </div>

      <Separator orientation="horizontal" className="lg:hidden" />
      <Separator orientation="vertical" className="hidden lg:block" />

      <div className="w-full flex-1 flex flex-col min-h-0 h-1/2 lg:h-full">
        <div className="px-4 lg:px-5">
          <InfoBar />
        </div>
        <Messenger />
      </div>
    </div>
  )
}

export default ConversationPage
