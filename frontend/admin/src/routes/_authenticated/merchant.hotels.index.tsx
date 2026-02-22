import HotelsListPage from '@/features/merchant/pages/HotelsListPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/merchant/hotels/')({
  component: HotelsListPage,
})
