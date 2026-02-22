import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { HotelService } from './hotel.service'
import { UserType } from '@/utils/decorators/user-type.decorator'
import { User } from '@/utils/decorators/user.decorator'
import { JwtPayload } from '@/utils/jwt/types'
import { ZodValidationPipe } from '@/pipes/zod-validate.pipe'
import { ApiHotelTypes } from '@yisu/shared'

@Controller()
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Get('merchant/hotels')
  @UserType('onlyMerchant')
  getMerchantHotels(@Query(ZodValidationPipe.hotelQuerySchema) query: ApiHotelTypes['HotelQuery'], @User() user: JwtPayload) {
    return this.hotelService.getMerchantHotels(user.sub, query)
  }

  @Post('merchant/hotels')
  @HttpCode(HttpStatus.OK)
  @UserType('onlyMerchant')
  createHotel(@Body(ZodValidationPipe.hotelCreateSchema) body: ApiHotelTypes['HotelCreate'], @User() user: JwtPayload) {
    return this.hotelService.createHotel(user.sub, body)
  }

  @Delete('merchant/hotels/:hotelId')
  @HttpCode(HttpStatus.OK)
  @UserType('onlyMerchant')
  deleteHotel(@Param('hotelId', ParseIntPipe) hotelId: number, @User() user: JwtPayload) {
    return this.hotelService.softDeleteHotel(user.sub, hotelId)
  }

  @Get('merchant/hotels/:hotelId')
  @UserType('onlyMerchant')
  getHotelDetail(@Param('hotelId', ParseIntPipe) hotelId: number, @User() user: JwtPayload) {
    return this.hotelService.getMerchantHotelDetail(user.sub, hotelId)
  }

  @Put('merchant/hotels/:hotelId/home-ad-enabled')
  @HttpCode(HttpStatus.OK)
  @UserType('onlyMerchant')
  updateHomeAdEnabled(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Body(ZodValidationPipe.hotelUpdateHomeAdSchema) body: ApiHotelTypes['HotelUpdateHomeAd'],
    @User() user: JwtPayload,
  ) {
    return this.hotelService.updateHomeAdEnabled(user.sub, hotelId, body)
  }

  @Get('merchant/hotels/:hotelId/infos')
  @UserType('onlyMerchant')
  getHotelInfos(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Query(ZodValidationPipe.hotelInfoQuerySchema) query: ApiHotelTypes['HotelInfoQuery'],
    @User() user: JwtPayload,
  ) {
    return this.hotelService.getMerchantHotelInfos(user.sub, hotelId, query)
  }

  @Get('merchant/hotels/:hotelId/infos/:infoId')
  @UserType('onlyMerchant')
  getHotelInfoDetail(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('infoId', ParseIntPipe) infoId: number,
    @User() user: JwtPayload,
  ) {
    return this.hotelService.getMerchantHotelInfoDetail(user.sub, hotelId, infoId)
  }

  @Post('merchant/hotels/:hotelId/infos')
  @HttpCode(HttpStatus.OK)
  @UserType('onlyMerchant')
  createHotelInfo(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Body(ZodValidationPipe.hotelInfoCreateSchema) body: ApiHotelTypes['HotelInfoCreate'],
    @User() user: JwtPayload,
  ) {
    return this.hotelService.createHotelInfo(user.sub, hotelId, body)
  }

  @Put('merchant/hotels/:hotelId/infos/:infoId')
  @HttpCode(HttpStatus.OK)
  @UserType('onlyMerchant')
  updateHotelInfo(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('infoId', ParseIntPipe) infoId: number,
    @Body(ZodValidationPipe.hotelInfoUpdateSchema) body: ApiHotelTypes['HotelInfoUpdate'],
    @User() user: JwtPayload,
  ) {
    return this.hotelService.updateHotelInfo(user.sub, hotelId, infoId, body)
  }

  @Delete('merchant/hotels/:hotelId/infos/:infoId')
  @HttpCode(HttpStatus.OK)
  @UserType('onlyMerchant')
  deleteHotelInfo(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('infoId', ParseIntPipe) infoId: number,
    @User() user: JwtPayload,
  ) {
    return this.hotelService.softDeleteHotelInfo(user.sub, hotelId, infoId)
  }

  @Post('merchant/hotels/:hotelId/infos/:infoId/duplicate')
  @HttpCode(HttpStatus.OK)
  @UserType('onlyMerchant')
  duplicateHotelInfo(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('infoId', ParseIntPipe) infoId: number,
    @User() user: JwtPayload,
  ) {
    return this.hotelService.duplicateHotelInfo(user.sub, hotelId, infoId)
  }

  @Post('merchant/hotels/:hotelId/infos/:infoId/submit')
  @HttpCode(HttpStatus.OK)
  @UserType('onlyMerchant')
  submitHotelInfo(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('infoId', ParseIntPipe) infoId: number,
    @User() user: JwtPayload,
  ) {
    return this.hotelService.submitForReview(user.sub, hotelId, infoId)
  }

  @Post('merchant/hotels/:hotelId/infos/:infoId/withdraw')
  @HttpCode(HttpStatus.OK)
  @UserType('onlyMerchant')
  withdrawHotelInfo(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('infoId', ParseIntPipe) infoId: number,
    @User() user: JwtPayload,
  ) {
    return this.hotelService.withdrawReview(user.sub, hotelId, infoId)
  }

  @Post('merchant/hotels/:hotelId/infos/:infoId/offline')
  @HttpCode(HttpStatus.OK)
  @UserType('onlyMerchant')
  offlineHotelInfo(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('infoId', ParseIntPipe) infoId: number,
    @User() user: JwtPayload,
  ) {
    return this.hotelService.offlineHotelInfo(user.sub, hotelId, infoId)
  }

  @Get('admin/reviews/hotel-infos')
  @UserType('onlyAdmin')
  getAdminReviewHotelInfos(@Query(ZodValidationPipe.adminReviewQuerySchema) query: ApiHotelTypes['AdminReviewQuery']) {
    return this.hotelService.getAdminReviewHotelInfos(query)
  }

  @Get('admin/reviews/hotel-infos/:infoId')
  @UserType('onlyAdmin')
  getAdminReviewHotelInfoDetail(@Param('infoId', ParseIntPipe) infoId: number) {
    return this.hotelService.getAdminReviewHotelInfoDetail(infoId)
  }

  @Post('admin/reviews/hotel-infos/:infoId/action')
  @HttpCode(HttpStatus.OK)
  @UserType('onlyAdmin')
  reviewHotelInfo(
    @Param('infoId', ParseIntPipe) infoId: number,
    @Body(ZodValidationPipe.adminReviewActionSchema) body: ApiHotelTypes['AdminReviewAction'],
    @User() user: JwtPayload,
  ) {
    return this.hotelService.reviewHotelInfo(user.sub, infoId, body)
  }

  @Get('admin/reviews/records')
  @UserType('onlyAdmin')
  getReviewRecords(@Query(ZodValidationPipe.reviewRecordQuerySchema) query: ApiHotelTypes['ReviewRecordQuery']) {
    return this.hotelService.getReviewRecords(query)
  }
}
