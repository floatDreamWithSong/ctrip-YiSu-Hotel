import { MerchantHotelRequest } from '@/apis/hotel'

export const HOTEL_DETAIL_QUERY_KEY = 'merchant-hotel-detail'
export const HOTEL_INFO_DETAIL_QUERY_KEY = 'merchant-hotel-info-detail'

/**
 * 酒店详情 QueryOptions 工厂函数。
 * 供 useHotelDetail、route loader 共用，保证 queryKey 完全一致。
 * staleTime = 30s：悬停预取后 30 秒内命中缓存，实现零等待体验。
 */
export const hotelDetailQueryOptions = (hotelId: number) => ({
  queryKey: [HOTEL_DETAIL_QUERY_KEY, hotelId] as const,
  queryFn: () => MerchantHotelRequest.getHotelDetail(hotelId),
  staleTime: 30_000,
})

/**
 * 酒店信息详情 QueryOptions 工厂函数。
 * 供 useHotelInfoForm.openEdit 和悬停预取共用，保证 queryKey 完全一致。
 * staleTime = 30s：悬停预取后 30 秒内命中缓存，弹窗打开即填充表单。
 */
export const hotelInfoDetailQueryOptions = (
  hotelId: number,
  infoId: number,
) => ({
  queryKey: [HOTEL_INFO_DETAIL_QUERY_KEY, hotelId, infoId] as const,
  queryFn: () => MerchantHotelRequest.getHotelInfoDetail(hotelId, infoId),
  staleTime: 30_000,
})
