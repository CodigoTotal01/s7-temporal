import React from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type Props = {
  triggers: {
    label: string
    icon?: JSX.Element
  }[]
  children: React.ReactNode
  className?: string
  button?: JSX.Element
}

const TabsMenu = ({ triggers, children, className, button }: Props) => {
  return (
    <Tabs
      defaultValue={triggers[0].label}
      className="w-full"
    >
      <div className="overflow-x-auto">
        <TabsList className={cn('pr-5 gap-1 sm:gap-0 w-full flex-nowrap', className)}>
          {triggers.map((trigger, key) => (
            <TabsTrigger
              key={key}
              value={trigger.label}
              className="capitalize flex gap-1 sm:gap-2 font-semibold text-xs sm:text-sm px-2 sm:px-3 py-1.5 min-w-0 flex-shrink-0 whitespace-nowrap"
            >
              {trigger.icon && trigger.icon}
              <span>{trigger.label}</span>
            </TabsTrigger>
          ))}
          {button}
        </TabsList>
      </div>
      {children}
    </Tabs>
  )
}

export default TabsMenu
