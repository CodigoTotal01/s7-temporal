import { Loader } from '@/components/loader'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import React from 'react'
import { FieldValues, UseFormRegister } from 'react-hook-form'

// Función para convertir slot de tiempo (ej: "3:30pm") a minutos desde medianoche
const timeSlotToMinutes = (slot: string): number => {
  const [time, period] = slot.split(/(am|pm)/i)
  const [hours, minutes] = time.split(':').map(Number)
  let totalHours = hours
  
  if (period.toLowerCase() === 'pm' && hours !== 12) {
    totalHours += 12
  } else if (period.toLowerCase() === 'am' && hours === 12) {
    totalHours = 0
  }
  
  return totalHours * 60 + (minutes || 0)
}

// Función para verificar si un slot ya pasó
const isSlotPast = (date: Date | undefined, slot: string): boolean => {
  if (!date) return false
  
  const now = new Date()
  const isToday = 
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  
  if (!isToday) return false
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const slotMinutes = timeSlotToMinutes(slot)
  
  return currentMinutes >= slotMinutes
}

type Props = {
  date: Date | undefined
  onBooking: React.Dispatch<React.SetStateAction<Date | undefined>>
  onBack(): void
  register: UseFormRegister<FieldValues>
  onSlot(slot: string): void
  currentSlot?: string
  loading: boolean
  bookings:
  | {
    date: Date
    slot: string
  }[]
  | undefined
  availableSlots: string[]
  loadingSlots: boolean
}

const BookAppointmentDate = ({
  date,
  onBooking,
  onBack,
  register,
  onSlot,
  currentSlot,
  loading,
  bookings,
  availableSlots,
  loadingSlots,
}: Props) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Resetear horas para comparación solo de fecha

  return (
    <div className="flex flex-col gap-5 justify-center">
      <div className="flex justify-center">
        <h2 className="text-4xl font-bold mb-5">Reservar una cita</h2>
      </div>
      <div className="flex gap-6 flex-col lg:flex-row">
        <div className="w-full lg:w-[300px] lg:flex-shrink-0">
          <h6 className="text-lg font-semibold mb-2">Agenda tu cita</h6>
          <CardDescription className="text-sm">
            Agenda una cita con nosotros para recibir atención personalizada. Resolveremos tus dudas, conoceremos tus necesidades y te ayudaremos a encontrar exactamente lo que buscas. Selecciona el día y horario que mejor se ajuste a tu disponibilidad.
          </CardDescription>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="flex justify-center lg:justify-start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onBooking}
              className="rounded-md border"
              disabled={(date) => {
                const checkDate = new Date(date)
                checkDate.setHours(0, 0, 0, 0)
                return checkDate < today
              }}
            />
          </div>
          <div className="flex flex-col gap-5 w-full max-w-md mx-auto lg:mx-0">
          {loadingSlots ? (
            <div className="flex items-center justify-center py-10">
              <Loader loading={true}>
                <span></span>
              </Loader>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No hay horarios disponibles para este día</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header con información */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Selecciona un horario</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {availableSlots.length} horario{availableSlots.length !== 1 ? 's' : ''} disponible{availableSlots.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Grid responsivo de horarios */}
              <div className="relative">
                <div className="max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 pb-4">
                    {availableSlots.map((slot, key) => {
                      const isBooked = bookings &&
                        bookings.some(
                          (booking) =>
                            `${booking.date.getDate()}/${booking.date.getMonth()}` ===
                            `${date?.getDate()}/${date?.getMonth()}` &&
                            booking.slot == slot
                        )
                      const isPast = isSlotPast(date, slot)
                      const isDisabled = isBooked || isPast

                      return (
                        <Label
                          htmlFor={`slot-${key}`}
                          key={key}
                          className="block"
                        >
                          <Card
                            onClick={() => !isDisabled && onSlot(slot)}
                            className={cn(
                              'relative p-3 text-center transition-all duration-200',
                              currentSlot == slot 
                                ? 'bg-grandis text-white shadow-lg scale-105' 
                                : 'bg-peach hover:bg-grandis',
                              isDisabled
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                                : 'cursor-pointer border-2 border-orange hover:shadow-md'
                            )}
                          >
                            <Input
                              disabled={isDisabled}
                              className="hidden"
                              type="radio"
                              value={slot}
                              {...register('slot')}
                              id={`slot-${key}`}
                            />
                            <div className="space-y-1">
                              <div className="text-sm font-semibold">{slot}</div>
                              {isPast && !isBooked && (
                                <div className="text-xs text-red-500">Pasado</div>
                              )}
                              {isBooked && (
                                <div className="text-xs text-blue-500">Reservado</div>
                              )}
                            </div>
                            
                            {/* Indicador de selección */}
                            {currentSlot == slot && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </Card>
                        </Label>
                      )
                    })}
                  </div>
                </div>
                
                {/* Indicador de scroll */}
                {availableSlots.length > 12 && (
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
              </div>

              {/* Información adicional */}
              <div className="text-center text-xs text-gray-500 space-y-1">
                <p>💡 Los horarios se actualizan en tiempo real</p>
                <p>⏰ Selecciona el que mejor se ajuste a tu disponibilidad</p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
      <div className="flex gap-5 justify-center mt-5">
        <Button
          type="button"
          onClick={onBack}
          variant={'outline'}
        >
          ¿Editar preguntas?
        </Button>
        <Button>
          <Loader loading={loading}>Reservar ahora</Loader>
        </Button>
      </div>
    </div>
  )
}

export default BookAppointmentDate
