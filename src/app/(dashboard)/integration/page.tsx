export const dynamic = "force-dynamic";
import { onGetPaymentConnected } from '@/action/settings'
import IntegrationsList from '@/components/integrations'

const IntegrationsPage = async () => {
  const payment = await onGetPaymentConnected()

  const connections = {
    mercadopago: payment ? true : false,
  }

  return (
    <>
      <IntegrationsList connections={connections} />
    </>
  )
}

export default IntegrationsPage
