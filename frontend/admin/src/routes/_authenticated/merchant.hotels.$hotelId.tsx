import HotelDetailPage from '@/features/merchant/pages/HotelDetailPage'
import { hotelDetailQueryOptions } from '@/features/merchant/queries/hotelQueries'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/merchant/hotels/$hotelId',
)({
  // 鼠标悬停「管理酒店」Link 时触发此 loader（preload="intent"）
  // ensureQueryData：缓存新鲜则立即返回；否则等待请求完成，确保页面渲染时数据就绪
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
