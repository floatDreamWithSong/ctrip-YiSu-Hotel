import HotelListPage from '@/features/hotel/list-page'
import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'

const listSearchSchema = z.object({
  city: z.string().optional(),
  district: z.string().optional(),
  keyword: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  targetDate: z.string().optional(),
  guestCount: z.coerce.number().int().min(1).optional(),
  roomCount: z.coerce.number().int().min(1).optional(),
  slotId: z.coerce.number().int().positive().optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  starLevels: z.string().optional(),
  tagIds: z.string().optional(),
  distanceKm: z.coerce.number().optional(),
  sortBy: z.enum(['price', 'distance', 'starLevel']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
})

export const Route = createFileRoute('/_authenticated/list/$roomType')({
  validateSearch: (search) => listSearchSchema.parse(search),
  component: HotelListPage,
})
