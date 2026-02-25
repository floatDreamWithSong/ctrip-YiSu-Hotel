import { MerchantHotelRequest } from '@/apis/hotel'

/** 酒店详情查询 key（与 loader 共享，确保缓存命中） */
export const HOTEL_DETAIL_QUERY_KEY = 'merchant-hotel-detail'

/**
 * 酒店详情 QueryOptions 工厂函数。
 * 供 useHotelDetail hook 和路由 loader 共用，保证 queryKey / queryFn 一致。
 * staleTime 30 秒：loader 预取的数据在用户进入详情页 30 秒内不会重新请求。
 */
export const hotelDetailQueryOptions = (hotelId: number) => ({
  queryKey: [HOTEL_DETAIL_QUERY_KEY, hotelId] as const,
  queryFn: () => MerchantHotelRequest.getHotelDetail(hotelId),
  staleTime: 30_000, // 30 秒
})

/** 酒店信息详情查询 key（供编辑弹窗预取使用） */
export const HOTEL_INFO_DETAIL_QUERY_KEY = 'merchant-hotel-info-detail'

/**
 * 酒店信息详情 QueryOptions 工厂函数。
 * 供 useHotelInfoForm.openEdit 和悬停预取共用，保证 queryKey 一致。
 * staleTime 30 秒：悬停预取的数据在 30 秒内不会重复请求。
 */
export const hotelInfoDetailQueryOptions = (
  hotelId: number,
  infoId: number,
) => ({
  queryKey: [HOTEL_INFO_DETAIL_QUERY_KEY, hotelId, infoId] as const,
  queryFn: () => MerchantHotelRequest.getHotelInfoDetail(hotelId, infoId),
  staleTime: 30_000, // 30 秒
})
