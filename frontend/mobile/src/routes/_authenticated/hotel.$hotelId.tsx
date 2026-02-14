import HotelDetailPage from '@/features/hotel/detail-page'
import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'

const detailSearchSchema = z.object({
  roomType: z.enum(['HOTEL', 'HOURLY']).optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  targetDate: z.string().optional(),
  guestCount: z.coerce.number().int().min(1).optional(),
  roomCount: z.coerce.number().int().min(1).optional(),
})

export const Route = createFileRoute('/_authenticated/hotel/$hotelId')({
  validateSearch: (search) => detailSearchSchema.parse(search),
  component: HotelDetailPage,
})
