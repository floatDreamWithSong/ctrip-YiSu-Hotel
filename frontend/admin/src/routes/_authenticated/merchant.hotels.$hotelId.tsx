import HotelDetailPage from '@/features/merchant/pages/HotelDetailPage'
import { hotelDetailQueryOptions } from '@/features/merchant/queries/hotelQueries'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/merchant/hotels/$hotelId',
)({
  /**
   * 路由 loader：在进入页面前将酒店详情预存入 TanStack Query 缓存。
   * · ensureQueryData：缓存已有（staleTime 内）则直接复用，否则发起请求。
   * · 仅调用 GET 接口，不触发任何业务状态变更。
   */
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      hotelDetailQueryOptions(Number(params.hotelId)),
    ),
  component: RouteComponent,
})

function RouteComponent() {
  const { hotelId } = Route.useParams()
  return <HotelDetailPage hotelId={Number(hotelId)} />
}
