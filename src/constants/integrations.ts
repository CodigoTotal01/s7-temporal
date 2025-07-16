type IntegrationsListItemProps = {
  id: string
  name: 'stripe'
  logo: string
  description: string
  title: string
  modalDescription: string
}

export const INTEGRATION_LIST_ITEMS: IntegrationsListItemProps[] = [
  {
    id: '1',
    name: 'stripe',
    description:
      'Stripe es la forma más rápida y sencilla de integrar pagos y servicios financieros en tu plataforma de software o marketplace.',
    logo: '914be637-39bf-47e6-bb81-37b553163945',
    title: 'Conectar cuenta de Stripe',
    modalDescription:
      'Las plataformas y marketplaces más exitosas, como Shopify y DoorDash, utilizan Stripe Connect.',
  },
]
