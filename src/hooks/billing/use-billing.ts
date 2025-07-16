/* import { useStripeHook } from "@/hooks/stripe/use-stripe"
import { useToast } from "@/components/ui/use-toast"
import { useElements } from "@stripe/react-stripe-js"
import axios from "axios"
import { useState } from "react"

export const useStripe = () => {
  const [onStripeAccountPending, setOnStripeAccountPending] =
    useState<boolean>(false)

  const onStripeConnect = async () => {
    try {
      setOnStripeAccountPending(true)
      const account = await axios.get(`/api/stripe/connect`)
      if (account) {
        setOnStripeAccountPending(false)
        if (account) {
          window.location.href = account.data.url
        }
      }
    } catch (error) {
      console.log(error)
    }
  }
  return { onStripeConnect, onStripeAccountPending }
}

export const useCompleteCustomerPayment = (onNext: () => void) => {
  const [processing, setProcessing] = useState<boolean>(false)
  const { toast } = useToast()
  const stripe = useStripeHook()
  const elements = useElements()

  const onMakePayment = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!stripe || !elements) {
      return null
    }

    console.log('no reload')

    try {
      setProcessing(true)

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: 'http://localhost:3000/settings',
        },
        redirect: 'if_required',
      })

      if (error) {
        console.log(error)
      }

      if (paymentIntent?.status === 'succeeded') {
        toast({
          title: 'Pago exitoso',
          description: 'Pago completado',
        })
        onNext()
      }

      setProcessing(false)
    } catch (error) {
      console.log(error)
    }
  }

  return { processing, onMakePayment }
}
 */