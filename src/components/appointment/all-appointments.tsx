import { APPOINTMENT_TABLE_HEADER } from '@/constants/menu'
import React from 'react'
import { DataTable } from '../table'
import { TableCell, TableRow } from '../ui/table'
import { getMonthName } from '@/lib/utils'
import { CardDescription } from '../ui/card'

type Props = {
  bookings:
  | {
    Customer: {
      name: string | null
      email: string | null
      Domain: {
        name: string
      } | null
    } | null
    id: string
    email: string
    domainId: string | null
    date: Date
    slot: string
    createdAt: Date
  }[]
  | undefined
}

const AllAppointments = ({ bookings }: Props) => {
  return (
    <DataTable headers={APPOINTMENT_TABLE_HEADER}>
      {bookings ? (
        bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="text-xs">
              <div className="font-medium">{booking.Customer?.name || 'Sin nombre'}</div>
              <div className="text-gray-500 text-xs">{booking.email}</div>
            </TableCell>
            <TableCell className="text-xs">
              <div>
                {getMonthName(booking.date.getMonth())} {booking.date.getDate()}{' '}
                {booking.date.getFullYear()}
              </div>
              <div className="uppercase">{booking.slot}</div>
            </TableCell>
            <TableCell className="text-xs">
              <div>
                {getMonthName(booking.createdAt.getMonth())}{' '}
                {booking.createdAt.getDate()} {booking.createdAt.getFullYear()}
              </div>
              <div>
                {booking.createdAt.getHours().toString().padStart(2, '0')}:{booking.createdAt.getMinutes().toString().padStart(2, '0')}{' '}
                {booking.createdAt.getHours() > 12 ? 'PM' : 'AM'}
              </div>
            </TableCell>
            <TableCell className="text-right text-xs">
              {booking.Customer?.Domain?.name}
            </TableCell>
          </TableRow>
        ))
      ) : (
        <CardDescription className="text-xs">Sin citas</CardDescription>
      )}
    </DataTable>
  )
}

export default AllAppointments
