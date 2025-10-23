import React from 'react'
import { FieldErrors, FieldValues } from 'react-hook-form'
import { UseFormRegister } from 'react-hook-form'
import QuestionsForm from './questions'
import BookAppointmentDate from './booking-date'

type Props = {
    questions: {
        id: string
        question: string
        answered: string | null
    }[]
    type: 'Appointment'
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
    availableSlots?: string[]
    loadingSlots?: boolean
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
    bookings,
    availableSlots = [],
    loadingSlots = false,
}: Props) => {

    if (step == 1) {
        return (
            <QuestionsForm
                register={register}
                error={error}
                onNext={onNext}
                questions={questions}
            />
        )
    }

    if (step == 2 && type == 'Appointment') {
        return (
            <BookAppointmentDate
                date={date}
                bookings={bookings}
                currentSlot={slot}
                register={register}
                onBack={onBack}
                onBooking={onBooking}
                onSlot={onSlot}
                loading={loading}
                availableSlots={availableSlots}
                loadingSlots={loadingSlots}
            />
        )
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <h2 className="font-bold text-gray-600 text-4xl">Gracias</h2>
            <p className="text-center">
                Gracias por tomarse el tiempo para llenar este formulario. Nos encantaría
                <br /> hablar contigo pronto.
            </p>
        </div>
    )
}

export default PortalSteps