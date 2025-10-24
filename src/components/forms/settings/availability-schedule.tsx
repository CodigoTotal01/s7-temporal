'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/loader'
import { Switch } from '@/components/ui/switch'
import { Clock, Plus, Trash2, Calendar, XCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { onGetAvailabilitySchedule, onUpdateAvailabilitySchedule } from '@/action/settings'
import { Separator } from '@/components/ui/separator'

type Props = {
  id: string
}

const daysOfWeek = [
  { value: 'MONDAY', label: 'Lunes', color: 'bg-blue-500' },
  { value: 'TUESDAY', label: 'Martes', color: 'bg-purple-500' },
  { value: 'WEDNESDAY', label: 'Miércoles', color: 'bg-pink-500' },
  { value: 'THURSDAY', label: 'Jueves', color: 'bg-orange-500' },
  { value: 'FRIDAY', label: 'Viernes', color: 'bg-green-500' },
  { value: 'SATURDAY', label: 'Sábado', color: 'bg-yellow-500' },
  { value: 'SUNDAY', label: 'Domingo', color: 'bg-red-500' },
]

type DaySchedule = {
  dayOfWeek: string
  timeSlots: string[]
  isActive: boolean
}

// Función para generar opciones de tiempo cada 30 minutos
const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const period = hour >= 12 ? 'pm' : 'am'
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const displayMinute = minute.toString().padStart(2, '0')
      slots.push(`${displayHour}:${displayMinute}${period}`)
    }
  }
  return slots
}

const AvailabilityScheduleForm = ({ id }: Props) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({})
  const [showAddModal, setShowAddModal] = useState<string | null>(null)
  const [selectedHour, setSelectedHour] = useState<string>('')
  const [rangeMode, setRangeMode] = useState(false)
  const [rangeEnd, setRangeEnd] = useState<string>('')
  const timeSlotOptions = generateTimeSlots()

  useEffect(() => {
    loadSchedule()
  }, [id])

  const loadSchedule = async () => {
    setLoading(true)
    const result = await onGetAvailabilitySchedule(id)
    if (result?.schedule) {
      const scheduleMap: Record<string, DaySchedule> = {}
      result.schedule.forEach((s: any) => {
        scheduleMap[s.dayOfWeek] = {
          dayOfWeek: s.dayOfWeek,
          timeSlots: s.timeSlots,
          isActive: s.isActive,
        }
      })
      setSchedule(scheduleMap)
    }
    setLoading(false)
  }

  const handleToggleDay = async (day: string) => {
    const currentSchedule = schedule[day] || { dayOfWeek: day, timeSlots: [], isActive: false }
    const newIsActive = !currentSchedule.isActive

    setSaving(day)
    const result = await onUpdateAvailabilitySchedule(
      id,
      day,
      currentSchedule.timeSlots,
      newIsActive
    )

    if (result?.status === 200) {
      setSchedule(prev => ({
        ...prev,
        [day]: { ...currentSchedule, isActive: newIsActive }
      }))
      toast({
        title: 'Éxito',
        description: result.message,
      })
    }
    setSaving(null)
  }

  const handleAddSlots = async (day: string) => {
    if (!selectedHour) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un horario',
        variant: 'destructive',
      })
      return
    }

    const currentSchedule = schedule[day] || { dayOfWeek: day, timeSlots: [], isActive: true }
    let slotsToAdd: string[] = []

    if (rangeMode && rangeEnd) {
      const startIdx = timeSlotOptions.indexOf(selectedHour)
      const endIdx = timeSlotOptions.indexOf(rangeEnd)

      if (startIdx === -1 || endIdx === -1) {
        toast({
          title: 'Error',
          description: 'Horarios inválidos',
          variant: 'destructive',
        })
        return
      }

      if (startIdx >= endIdx) {
        toast({
          title: 'Error',
          description: 'La hora de inicio debe ser antes que la hora de fin',
          variant: 'destructive',
        })
        return
      }

      // Filtrar horarios que NO estén agregados ya
      slotsToAdd = timeSlotOptions
        .slice(startIdx, endIdx + 1)
        .filter(slot => !currentSchedule.timeSlots.includes(slot))
    } else {
      // Verificar que el horario NO esté ya agregado
      if (currentSchedule.timeSlots.includes(selectedHour)) {
        toast({
          title: 'Error',
          description: 'Este horario ya está agregado',
          variant: 'destructive',
        })
        return
      }
      slotsToAdd = [selectedHour]
    }

    if (slotsToAdd.length === 0) {
      toast({
        title: 'Información',
        description: 'Todos los horarios en este rango ya están agregados',
      })
      return
    }

    const updatedSlots = [...currentSchedule.timeSlots, ...slotsToAdd]

    setSaving(day)
    const result = await onUpdateAvailabilitySchedule(
      id,
      day,
      updatedSlots,
      currentSchedule.isActive
    )

    if (result?.status === 200) {
      setSchedule(prev => ({
        ...prev,
        [day]: { ...currentSchedule, timeSlots: updatedSlots }
      }))
      setShowAddModal(null)
      setSelectedHour('')
      setRangeEnd('')
      setRangeMode(false)
      toast({
        title: 'Éxito',
        description: `${slotsToAdd.length} horario${slotsToAdd.length > 1 ? 's' : ''} agregado${slotsToAdd.length > 1 ? 's' : ''}`,
      })
    } else {
      toast({
        title: 'Error',
        description: result?.message || 'Error al agregar horarios',
        variant: 'destructive',
      })
    }
    setSaving(null)
  }

  const handleRemoveSlot = async (day: string, slotToRemove: string) => {
    const currentSchedule = schedule[day]
    if (!currentSchedule) return

    const updatedSlots = currentSchedule.timeSlots.filter(s => s !== slotToRemove)

    setSaving(day)
    const result = await onUpdateAvailabilitySchedule(
      id,
      day,
      updatedSlots,
      currentSchedule.isActive
    )

    if (result?.status === 200) {
      setSchedule(prev => ({
        ...prev,
        [day]: { ...currentSchedule, timeSlots: updatedSlots }
      }))
      toast({
        title: 'Éxito',
        description: 'Horario eliminado',
      })
    }
    setSaving(null)
  }

  const handleClearAllSlots = async (day: string) => {
    const currentSchedule = schedule[day]
    if (!currentSchedule || currentSchedule.timeSlots.length === 0) return

    // Confirmar antes de eliminar todos
    if (!confirm(`¿Estás seguro de eliminar todos los ${currentSchedule.timeSlots.length} horarios del ${daysOfWeek.find(d => d.value === day)?.label}?`)) {
      return
    }

    setSaving(day)
    const result = await onUpdateAvailabilitySchedule(
      id,
      day,
      [], // Array vacío para eliminar todos
      currentSchedule.isActive
    )

    if (result?.status === 200) {
      setSchedule(prev => ({
        ...prev,
        [day]: { ...currentSchedule, timeSlots: [] }
      }))
      toast({
        title: 'Éxito',
        description: 'Todos los horarios han sido eliminados',
      })
    } else {
      toast({
        title: 'Error',
        description: result?.message || 'Error al eliminar horarios',
        variant: 'destructive',
      })
    }
    setSaving(null)
  }

  const sortTimeSlots = (slots: string[]) => {
    return slots.sort((a, b) => {
      const convertTo24 = (time: string) => {
        const match = time.match(/^(\d{1,2}):(\d{2})(am|pm)$/i)
        if (!match) return 0
        let [, hours, minutes, period] = match
        let h = parseInt(hours)
        const m = parseInt(minutes)
        if (period.toLowerCase() === 'pm' && h !== 12) h += 12
        if (period.toLowerCase() === 'am' && h === 12) h = 0
        return h * 60 + m
      }
      return convertTo24(a) - convertTo24(b)
    })
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="w-full p-4 md:p-6">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Header con icono y título */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange" />
              </div>
              <div>
                <h2 className="font-bold text-xl md:text-2xl text-gray-900">Horarios Disponibles</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configura los horarios en los que atiendes cada día. Los clientes solo podrán agendar citas en estos horarios.
                </p>
              </div>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-orange/20 via-orange/40 to-orange/20"></div>
          </div>

          <Loader loading={loading}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {daysOfWeek.map((day) => {
                const daySchedule = schedule[day.value] || { dayOfWeek: day.value, timeSlots: [], isActive: false }
                const isSaving = saving === day.value
                const sortedSlots = sortTimeSlots([...daySchedule.timeSlots])

                return (
                  <div key={day.value} className="border-2 rounded-xl p-4 transition-all hover:shadow-md bg-gradient-to-br from-gray-50 to-white">
                    {/* Header del día */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 ${day.color} rounded-full`}></div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{day.label}</h3>
                          <p className="text-xs text-gray-500">
                            {daySchedule.timeSlots.length} horario{daySchedule.timeSlots.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={daySchedule.isActive}
                        onCheckedChange={() => handleToggleDay(day.value)}
                        disabled={isSaving}
                      />
                    </div>

                    {daySchedule.isActive && (
                      <>
                        <Separator className="mb-3 bg-gray-200" />

                        {/* Horarios con scroll responsivo */}
                        <div className="relative mb-3">
                          {sortedSlots.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {sortedSlots.map((slot, idx) => (
                                  <div
                                    key={idx}
                                    className="group relative bg-white border-2 border-gray-200 rounded-lg p-3 flex items-center justify-between hover:border-orange-400 hover:shadow-sm transition-all"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm font-medium text-gray-700">{slot}</span>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveSlot(day.value, slot)}
                                      disabled={isSaving}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-md"
                                      title="Eliminar horario"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                              <Calendar className="w-8 h-8 mb-2" />
                              <p className="text-xs">Sin horarios configurados</p>
                            </div>
                          )}

                          {/* Indicador de scroll si hay muchos horarios */}
                          {sortedSlots.length > 8 && (
                            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                          )}

                          {/* Contador de horarios */}
                          {sortedSlots.length > 0 && (
                            <div className="mt-2 text-center">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {sortedSlots.length} horario{sortedSlots.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Botones de acción */}
                        {showAddModal !== day.value ? (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={() => setShowAddModal(day.value)}
                              variant="outline"
                              className="flex-1 border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
                              disabled={isSaving}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar horario
                            </Button>
                            {sortedSlots.length > 0 && (
                              <Button
                                type="button"
                                onClick={() => handleClearAllSlots(day.value)}
                                variant="outline"
                                className="border-2 hover:border-red-500 hover:bg-red-50 transition-all"
                                disabled={isSaving}
                                title="Eliminar todos los horarios"
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                            {/* Toggle para modo rango */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-700">
                                {rangeMode ? 'Rango de horarios' : 'Horario individual'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setRangeMode(!rangeMode)}
                                className="text-xs text-blue-600 hover:text-blue-700 underline"
                              >
                                {rangeMode ? 'Individual' : 'Usar rango'}
                              </button>
                            </div>

                            {/* Selectores */}
                            <div className="space-y-2">
                              <select
                                value={selectedHour}
                                onChange={(e) => setSelectedHour(e.target.value)}
                                className="w-full px-3 py-2 border-2 rounded-lg text-sm bg-white focus:border-blue-500 focus:outline-none"
                              >
                                <option value="">{rangeMode ? 'Hora inicio' : 'Seleccionar hora'}</option>
                                {timeSlotOptions.map((slot, idx) => {
                                  const isAlreadyAdded = daySchedule.timeSlots.includes(slot)
                                  return (
                                    <option key={idx} value={slot} disabled={isAlreadyAdded}>
                                      {slot} {isAlreadyAdded ? '(ya agregado)' : ''}
                                    </option>
                                  )
                                })}
                              </select>

                              {rangeMode && (
                                <select
                                  value={rangeEnd}
                                  onChange={(e) => setRangeEnd(e.target.value)}
                                  className="w-full px-3 py-2 border-2 rounded-lg text-sm bg-white focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="">Hora fin</option>
                                  {timeSlotOptions.map((slot, idx) => (
                                    <option key={idx} value={slot}>
                                      {slot}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={() => handleAddSlots(day.value)}
                                disabled={isSaving || !selectedHour || (rangeMode && !rangeEnd)}
                                className="flex-1 bg-blue-500 hover:bg-blue-600"
                                size="sm"
                              >
                                {isSaving ? 'Guardando...' : 'Agregar'}
                              </Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  setShowAddModal(null)
                                  setSelectedHour('')
                                  setRangeEnd('')
                                  setRangeMode(false)
                                }}
                                variant="outline"
                                size="sm"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </Loader>
        </div>
      </div>
    </div>
  )
}

export default AvailabilityScheduleForm
