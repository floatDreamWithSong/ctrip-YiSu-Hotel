import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { MobileHotelService } from './mobile-hotel.service'
import { ZodValidationPipe } from '@/pipes/zod-validate.pipe'
import { ApiMobileHotelSchemas, ApiMobileHotelTypes } from '@yisu/shared'
import { UserType } from '@/utils/decorators/user-type.decorator'

@Controller('mobile/hotels')
@UserType('onlyUser')
export class MobileHotelController {
  constructor(private readonly mobileHotelService: MobileHotelService) {}

  @Get('home-banners')
  getHomeBanners(@Query(ZodValidationPipe.mobileHomeBannerQuerySchema) query: ApiMobileHotelTypes['MobileHomeBannerQuery']) {
    return this.mobileHotelService.getHomeBanners(query)
  }

  @Get('search')
  searchHotels(@Query(ZodValidationPipe.mobileHotelSearchQuerySchema) query: ApiMobileHotelTypes['MobileHotelSearchQuery']) {
    return this.mobileHotelService.searchHotels(query)
  }

  @Get('tags')
  getTagList() {
    return this.mobileHotelService.getTagList()
  }

  @Get(':hotelId')
  getHotelDetail(@Param('hotelId', ParseIntPipe) hotelId: number) {
    return this.mobileHotelService.getHotelDetail(hotelId)
  }

  @Get(':hotelId/nearby-hotels')
  getNearbyHotels(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Query(new ZodValidationPipe(ApiMobileHotelSchemas.mobileNearbyHotelsQuery.omit({ hotelId: true })))
    query: Omit<ApiMobileHotelTypes['MobileNearbyHotelsQuery'], 'hotelId'>,
  ) {
    return this.mobileHotelService.getNearbyHotels({
      ...query,
      hotelId,
    })
  }

  @Get(':hotelId/nearby-pois')
  getNearbyPois(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Query(new ZodValidationPipe(ApiMobileHotelSchemas.mobileNearbyPoisQuery.omit({ hotelId: true })))
    query: Omit<ApiMobileHotelTypes['MobileNearbyPoisQuery'], 'hotelId'>,
  ) {
    return this.mobileHotelService.getNearbyPois({
      ...query,
      hotelId,
    })
  }
}
