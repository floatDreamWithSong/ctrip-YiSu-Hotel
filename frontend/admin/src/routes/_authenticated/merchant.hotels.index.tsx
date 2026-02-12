import HotelsPage from '@/features/merchant/hotels-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/merchant/hotels/')({
  component: HotelsPage,
})
