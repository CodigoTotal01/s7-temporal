import React from 'react'
import { AccordionContent, AccordionItem, AccordionTrigger, Accordion as ShadcnAccordion } from '@/components/ui/accordion'

type Props = {
  trigger: string
  content: string
}

const Accordion = ({ content, trigger }: Props) => {
  return (
    <ShadcnAccordion
      type="single"
      collapsible
    >
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-xs">{trigger}</AccordionTrigger>
        <AccordionContent className="text-xs">{content}</AccordionContent>
      </AccordionItem>
    </ShadcnAccordion>
  )
}

export default Accordion
