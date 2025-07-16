import {
  onDomainCustomerResponses,
  onGetAllDomainBookings,
} from '@/action/appointment'
import { onGetDomainProductsAndConnectedAccountId } from '@/action/payments'
import PortalForm from '@/components/forms/portal/portal-form'
import React from 'react'

const CustomerPaymentPage = async ({
  params,
}: {
  params: { domainid: string; customerid: string }
}) => {
  const questions = await onDomainCustomerResponses(params.customerid)
  const products = await onGetDomainProductsAndConnectedAccountId(
    params.domainid
  )

  if (!questions) return null

  return (
    <PortalForm
      email={questions.email!}
      products={products?.products}
      amount={products?.amount}
      domainid={params.domainid}
      customerId={params.customerid}
      questions={questions.questions}
      stripeId={products?.stripeId!}
      type="Payment"
    />
  )
}

export default CustomerPaymentPage
