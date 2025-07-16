type IntegrationsListItemProps = {
  id: string
  name: 'mercadopago'
  logo: string
  description: string
  title: string
  modalDescription: string
}

export const INTEGRATION_LIST_ITEMS: IntegrationsListItemProps[] = [
  {
    id: '1',
    name: 'mercadopago',
    description:
      'Mercado Pago es la plataforma de pagos más popular en Perú, con soporte para tarjetas, Yape, Plin y otros métodos de pago locales.',
    logo: '196e1022-956e-41f5-b317-303dc97bacfc',
    title: 'Conectar cuenta de Mercado Pago',
    modalDescription:
      'Mercado Pago es utilizado por millones de usuarios en Perú para pagos seguros y rápidos.',
  },
]
