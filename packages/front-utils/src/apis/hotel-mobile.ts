import { ApiMobileHotelSchemas, type ApiMobileHotelTypes } from '@yisu/shared'
import { request } from '../request'

export const MobileHotelRequest = {
  getHomeBanners: (params: ApiMobileHotelTypes['MobileHomeBannerQuery']) =>
    request<ApiMobileHotelTypes['MobileHotelSearchResponse']['items']>({
      url: '/mobile/hotels/home-banners',
      method: 'GET',
      params,
      paramsValidator: ApiMobileHotelSchemas.mobileHomeBannerQuery,
    }),
  searchHotels: (params: ApiMobileHotelTypes['MobileHotelSearchQuery']) =>
    request<ApiMobileHotelTypes['MobileHotelSearchResponse']>({
      url: '/mobile/hotels/search',
      method: 'GET',
      params,
      paramsValidator: ApiMobileHotelSchemas.mobileHotelSearchQuery,
      responseValidator: ApiMobileHotelSchemas.mobileHotelSearchResponse,
    }),
  getHotelDetail: (hotelId: number) =>
    request<ApiMobileHotelTypes['MobileHotelDetailResponse']>({
      url: `/mobile/hotels/${hotelId}`,
      method: 'GET',
      responseValidator: ApiMobileHotelSchemas.mobileHotelDetailResponse,
    }),
  getNearbyHotels: (params: ApiMobileHotelTypes['MobileNearbyHotelsQuery']) =>
    request<ApiMobileHotelTypes['MobileHotelSearchResponse']['items']>({
      url: `/mobile/hotels/${params.hotelId}/nearby-hotels`,
      method: 'GET',
      params,
      paramsValidator: ApiMobileHotelSchemas.mobileNearbyHotelsQuery,
    }),
  getNearbyPois: (params: ApiMobileHotelTypes['MobileNearbyPoisQuery']) =>
    request<ApiMobileHotelTypes['MobileNearbyPoisResponse']>({
      url: `/mobile/hotels/${params.hotelId}/nearby-pois`,
      method: 'GET',
      params,
      paramsValidator: ApiMobileHotelSchemas.mobileNearbyPoisQuery,
      responseValidator: ApiMobileHotelSchemas.mobileNearbyPoisResponse,
    }),
  getTags: () =>
    request<ApiMobileHotelTypes['MobileHotelTagListResponse']>({
      url: '/mobile/hotels/tags',
      method: 'GET',
      responseValidator: ApiMobileHotelSchemas.mobileHotelTagListResponse,
    }),
}

