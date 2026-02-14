import HotelListPage from '@/features/hotel/list-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/list/$roomType')({
  component: HotelListPage,
})

