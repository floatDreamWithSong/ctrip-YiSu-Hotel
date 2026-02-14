import z from 'zod'
import {
  mobileHomeBannerQuerySchema,
  mobileHotelDetailResponseSchema,
  mobileHotelSearchQuerySchema,
  mobileHotelSearchResponseSchema,
  mobileHotelTagListResponseSchema,
  mobileNearbyHotelsQuerySchema,
  mobileNearbyPoisQuerySchema,
  mobileNearbyPoisResponseSchema,
} from '../schema/hotel-mobile'

export const ApiMobileHotelSchemas = {
  mobileHomeBannerQuery: mobileHomeBannerQuerySchema,
  mobileHotelSearchQuery: mobileHotelSearchQuerySchema,
  mobileHotelSearchResponse: mobileHotelSearchResponseSchema,
  mobileHotelDetailResponse: mobileHotelDetailResponseSchema,
  mobileNearbyHotelsQuery: mobileNearbyHotelsQuerySchema,
  mobileNearbyPoisQuery: mobileNearbyPoisQuerySchema,
  mobileNearbyPoisResponse: mobileNearbyPoisResponseSchema,
  mobileHotelTagListResponse: mobileHotelTagListResponseSchema,
}

export type ApiMobileHotelTypes = {
  [key in keyof typeof ApiMobileHotelSchemas as `${Capitalize<key>}`]: z.infer<
    (typeof ApiMobileHotelSchemas)[key]
  >
}

