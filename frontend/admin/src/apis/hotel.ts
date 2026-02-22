import { request } from '@yisu/front-utils/request'
import { ApiHotelSchemas } from '@yisu/shared'
import type { ApiHotelTypes } from '@yisu/shared'

// 从 shared 包导入响应类型
export type {
  PaginatedResult,
  MerchantHotelItem,
  MerchantHotelDetail,
  HotelInfoItem,
  HotelInfoDetail,
  AdminReviewHotelInfoItem,
  AdminReviewHotelInfoDetail,
  ReviewRecordItem,
  HotelImage,
  RoomType,
  Location,
} from '@yisu/shared'

import type {
  PaginatedResult,
  MerchantHotelItem,
  MerchantHotelDetail,
  HotelInfoItem,
  AdminReviewHotelInfoItem,
  AdminReviewHotelInfoDetail,
  ReviewRecordItem,
} from '@yisu/shared'

export const MerchantHotelRequest = {
  getHotels: (params: ApiHotelTypes['HotelQuery']) => {
    return request<PaginatedResult<MerchantHotelItem>>({
      url: '/merchant/hotels',
      method: 'GET',
      params,
      paramsValidator: ApiHotelSchemas.hotelQuery,
    })
  },
  createHotel: (data: ApiHotelTypes['HotelCreate']) => {
    return request<MerchantHotelItem>({
      url: '/merchant/hotels',
      method: 'POST',
      data,
      dataValidator: ApiHotelSchemas.hotelCreate,
    })
  },
  deleteHotel: (hotelId: number) => {
    return request<null>({
      url: `/merchant/hotels/${hotelId}`,
      method: 'DELETE',
    })
  },
  getHotelDetail: (hotelId: number) => {
    return request<MerchantHotelDetail>({
      url: `/merchant/hotels/${hotelId}`,
      method: 'GET',
    })
  },
  updateHomeAdEnabled: (
    hotelId: number,
    data: ApiHotelTypes['HotelUpdateHomeAd'],
  ) => {
    return request({
      url: `/merchant/hotels/${hotelId}/home-ad-enabled`,
      method: 'PUT',
      data,
      dataValidator: ApiHotelSchemas.hotelUpdateHomeAd,
    })
  },
  getHotelInfos: (hotelId: number, params: ApiHotelTypes['HotelInfoQuery']) => {
    return request<PaginatedResult<HotelInfoItem>>({
      url: `/merchant/hotels/${hotelId}/infos`,
      method: 'GET',
      params,
      paramsValidator: ApiHotelSchemas.hotelInfoQuery,
    })
  },
  getHotelInfoDetail: (hotelId: number, infoId: number) => {
    return request<
      ApiHotelTypes['HotelInfoCreate'] & {
        id: number
        reviewStatus: string
      }
    >({
      url: `/merchant/hotels/${hotelId}/infos/${infoId}`,
      method: 'GET',
    })
  },
  createHotelInfo: (
    hotelId: number,
    data: ApiHotelTypes['HotelInfoCreate'],
  ) => {
    return request({
      url: `/merchant/hotels/${hotelId}/infos`,
      method: 'POST',
      data,
      dataValidator: ApiHotelSchemas.hotelInfoCreate,
    })
  },
  updateHotelInfo: (
    hotelId: number,
    infoId: number,
    data: ApiHotelTypes['HotelInfoUpdate'],
  ) => {
    return request({
      url: `/merchant/hotels/${hotelId}/infos/${infoId}`,
      method: 'PUT',
      data,
      dataValidator: ApiHotelSchemas.hotelInfoUpdate,
    })
  },
  deleteHotelInfo: (hotelId: number, infoId: number) => {
    return request({
      url: `/merchant/hotels/${hotelId}/infos/${infoId}`,
      method: 'DELETE',
    })
  },
  duplicateHotelInfo: (hotelId: number, infoId: number) => {
    return request({
      url: `/merchant/hotels/${hotelId}/infos/${infoId}/duplicate`,
      method: 'POST',
    })
  },
  submitHotelInfo: (hotelId: number, infoId: number) => {
    return request({
      url: `/merchant/hotels/${hotelId}/infos/${infoId}/submit`,
      method: 'POST',
    })
  },
  withdrawHotelInfo: (hotelId: number, infoId: number) => {
    return request({
      url: `/merchant/hotels/${hotelId}/infos/${infoId}/withdraw`,
      method: 'POST',
    })
  },
  offlineHotelInfo: (hotelId: number, infoId: number) => {
    return request({
      url: `/merchant/hotels/${hotelId}/infos/${infoId}/offline`,
      method: 'POST',
    })
  },
}

export const AdminReviewRequest = {
  getReviewHotelInfos: (params: ApiHotelTypes['AdminReviewQuery']) => {
    return request<PaginatedResult<AdminReviewHotelInfoItem>>({
      url: '/admin/reviews/hotel-infos',
      method: 'GET',
      params,
      paramsValidator: ApiHotelSchemas.adminReviewQuery,
    })
  },
  getReviewHotelInfoDetail: (infoId: number) => {
    return request<AdminReviewHotelInfoDetail>({
      url: `/admin/reviews/hotel-infos/${infoId}`,
      method: 'GET',
    })
  },
  reviewHotelInfo: (
    infoId: number,
    data: ApiHotelTypes['AdminReviewAction'],
  ) => {
    return request<null>({
      url: `/admin/reviews/hotel-infos/${infoId}/action`,
      method: 'POST',
      data,
      dataValidator: ApiHotelSchemas.adminReviewAction,
    })
  },
  getReviewRecords: (params: ApiHotelTypes['ReviewRecordQuery']) => {
    return request<PaginatedResult<ReviewRecordItem>>({
      url: '/admin/reviews/records',
      method: 'GET',
      params,
      paramsValidator: ApiHotelSchemas.reviewRecordQuery,
    })
  },
}
