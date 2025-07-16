import React from 'react'
import { FieldErrors, FieldValues } from 'react-hook-form'
import { UseFormRegister } from 'react-hook-form'

type Props = {
    questions: {
        id: string
        question: string
        answered: string | null
    }[]
    type: 'Appointment' | 'Payment'
    register: UseFormRegister<FieldValues>
    error: FieldErrors<FieldValues>
    onNext(): void
    step: number
    date: Date | undefined
    onBooking: React.Dispatch<React.SetStateAction<Date | undefined>>
    onBack(): void
    onSlot(slot: string): void
    slot?: string
    loading: boolean
    bookings?:
    | {
        date: Date
        slot: string
    }[]
    | undefined
    products?:
    | {
        name: string
        image: string
        price: number
    }[]
    | undefined
    amount?: number
    stripeId?: string
}

const PortalSteps = ({
    questions,
    type,
    register,
    error,
    onNext,
    step,
    onBooking,
    date,
    onBack,
    onSlot,
    loading,
    slot,
    products,
    bookings,
    amount,
    stripeId,
}: Props) => {
    return <div>PortalSteps</div>
}

export default PortalSteps