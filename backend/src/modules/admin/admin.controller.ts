import { Controller, Get, Query, Param, ParseIntPipe, NotFoundException, Post, HttpCode, Body } from '@nestjs/common';
import { UserType } from '@/utils/decorators/user-type.decorator';
import { ZodValidationPipe } from '@/pipes/zod-validate.pipe';
import { GetPendingHotelsSchema, GetPendingHotelsType, RejectHotelSchema, RejectHotelType } from '@yisu/shared';
import { AdminService } from './admin.service';
import { User } from '@/utils/decorators/user.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('pending')
  @UserType('onlyAdmin')
  async getPendingHotels(@Query(new ZodValidationPipe(GetPendingHotelsSchema)) query: GetPendingHotelsType) {
    return this.adminService.getPendingHotels(query);
  }

  @Get(':versionId/detail')
  @UserType('onlyAdmin')
  async getHotelDetail(@Param('versionId', ParseIntPipe) versionId: number) {
    const detail = await this.adminService.getHotelDetail(versionId);
    if (!detail)
      throw new NotFoundException('酒店版本不存在');

    return detail;
  }

  @Post(':versionId/approve')
  @HttpCode(204)
  @UserType('onlyAdmin')
  async approveHotel(
    @Param('versionId', ParseIntPipe) versionId: number,
    @User('sub') adminUserId: number,
  ) {
    await this.adminService.approveHotel(versionId, adminUserId);
  }

  @Post(':versionId/reject')
  @HttpCode(204)
  @UserType('onlyAdmin')
  async rejectHotel(
    @Param('versionId', ParseIntPipe) versionId: number,
    @User('sub') adminUserId: number,
    @Body(new ZodValidationPipe(RejectHotelSchema)) dto: RejectHotelType,
  ) {
    await this.adminService.rejectHotel(versionId, adminUserId, dto);
  }

  @Get('reject-reasons')
  @UserType('onlyAdmin')
  getRejectReasons() {
    return this.adminService.getRejectReasons();
  }

  @Get(':hotelId/review-history')
  @UserType('onlyAdmin')
  async getReviewHistory(@Param('hotelId', ParseIntPipe) hotelId: number) {
    return this.adminService.getReviewHistory(hotelId);
  }
}
