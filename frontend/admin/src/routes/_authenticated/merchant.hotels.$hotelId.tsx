import HotelDetailPage from '@/features/merchant/hotel-detail-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/merchant/hotels/$hotelId')(
  {
    component: RouteComponent,
  },
)

function RouteComponent() {
  const { hotelId } = Route.useParams()
  return <HotelDetailPage hotelId={Number(hotelId)} />
}
