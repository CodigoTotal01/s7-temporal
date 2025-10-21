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
  onTabChange?: (value: string) => void
  value?: string
}

const TabsMenu = ({ triggers, children, className, button, onTabChange, value }: Props) => {
  return (
    <Tabs
      defaultValue={triggers[0].label}
      value={value}
      className="w-full overflow-hidden"
      onValueChange={onTabChange}
    >
      <TabsList className={cn('w-full', className)}>
          {triggers.map((trigger, key) => (
            <TabsTrigger
              key={key}
              value={trigger.label}
              className="capitalize flex gap-1 items-center justify-center font-semibold text-xs px-2 py-1.5 flex-1"
            >
              {trigger.icon && trigger.icon}
              <span>{trigger.label}</span>
            </TabsTrigger>
          ))}
          {button}
        </TabsList>
      {children}
    </Tabs>
  )
}

export default TabsMenu
