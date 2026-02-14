import { request } from '@yisu/front-utils/request'
import { ApiHotelSchemas } from '@yisu/shared'
import type { ApiHotelTypes } from '@yisu/shared'

export interface PaginatedResult<T> {
  total: number
  page: number
  limit: number
  items: T[]
}

export const MerchantHotelRequest = {
  getHotels: (params: ApiHotelTypes['HotelQuery']) => {
    return request<PaginatedResult<{
      id: number
      hotelNickname: string
      isHomeAdEnabled: boolean
      publishedInfoId: number | null
      publishedInfo: null | {
        id: number
        infoNickname: string
        name: string
        reviewStatus: string
      }
      _count: {
        infos: number
      }
      createdAt: string
      updatedAt: string
    }>>({
      url: '/merchant/hotels',
      method: 'GET',
      params,
      paramsValidator: ApiHotelSchemas.hotelQuery,
    })
  },
  createHotel: (data: ApiHotelTypes['HotelCreate']) => {
    return request<{
      id: number
      hotelNickname: string
      isHomeAdEnabled: boolean
      merchantId: number
      publishedInfoId: number | null
      isDeleted: boolean
      createdAt: string
      updatedAt: string
    }>({
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
    return request<{
      id: number
      hotelNickname: string
      isHomeAdEnabled: boolean
      merchantId: number
      publishedInfoId: number | null
      createdAt: string
      updatedAt: string
      infoCount: number
    }>({
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
    return request<PaginatedResult<{
      id: number
      infoNickname: string
      name: string
      reviewStatus: string
      createdAt: string
      updatedAt: string
    }>>({
      url: `/merchant/hotels/${hotelId}/infos`,
      method: 'GET',
      params,
      paramsValidator: ApiHotelSchemas.hotelInfoQuery,
    })
  },
  getHotelInfoDetail: (hotelId: number, infoId: number) => {
    return request<ApiHotelTypes['HotelInfoCreate'] & {
      id: number
      reviewStatus: string
    }>({
      url: `/merchant/hotels/${hotelId}/infos/${infoId}`,
      method: 'GET',
    })
  },
  createHotelInfo: (hotelId: number, data: ApiHotelTypes['HotelInfoCreate']) => {
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
    return request<PaginatedResult<{
      id: number
      infoNickname: string
      name: string
      reviewStatus: string
      createdAt: string
      updatedAt: string
      hotel: {
        id: number
        hotelNickname: string
        merchant: {
          user: {
            id: number
            username: string
            email: string
          }
        }
      }
    }>>({
      url: '/admin/reviews/hotel-infos',
      method: 'GET',
      params,
      paramsValidator: ApiHotelSchemas.adminReviewQuery,
    })
  },
  getReviewHotelInfoDetail: (infoId: number) => {
    return request<{
      id: number
      hotelId: number
      infoNickname: string
      name: string
      enName?: string
      starLevel: number
      phone?: string
      description?: string
      province?: string
      city?: string
      district?: string
      address: string
      openedAt?: string
      homeAdImage?: string
      reviewStatus: string
      images: Array<{
        id: number
        url: string
        sortOrder: number
        caption?: string
      }>
      roomTypes: Array<{
        id: number
        name: string
        count: number
        price: number
        priceMode: string
        duration: number
        bedType?: string
        maxGuests: number
        area?: number
        imageUrl?: string
        sortOrder: number
        hourlySlots: Array<{
          id: number
          startTime: string
        }>
      }>
      tags: string[]
      location: null | { lng: number; lat: number }
      hotel: {
        id: number
        hotelNickname: string
        merchant: {
          id: number
          username: string
          email: string
        }
      }
      reviewRecords: Array<{
        id: number
        action: string
        rejectReason: string | null
        rejectDetail: string | null
        createdAt: string
        reviewerName: string
      }>
    }>({
      url: `/admin/reviews/hotel-infos/${infoId}`,
      method: 'GET',
    })
  },
  reviewHotelInfo: (infoId: number, data: ApiHotelTypes['AdminReviewAction']) => {
    return request<null>({
      url: `/admin/reviews/hotel-infos/${infoId}/action`,
      method: 'POST',
      data,
      dataValidator: ApiHotelSchemas.adminReviewAction,
    })
  },
  getReviewRecords: (params: ApiHotelTypes['ReviewRecordQuery']) => {
    return request<PaginatedResult<{
      id: number
      action: string
      rejectReason: string | null
      rejectDetail: string | null
      createdAt: string
      reviewer: {
        id: number
        username: string
        email: string
      }
      hotel: {
        id: number
        hotelNickname: string
      }
      info: {
        id: number
        infoNickname: string
        name: string
      }
    }>>({
      url: '/admin/reviews/records',
      method: 'GET',
      params,
      paramsValidator: ApiHotelSchemas.reviewRecordQuery,
    })
  },
}
