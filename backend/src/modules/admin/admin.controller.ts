import { Controller, Get, Query, Param, ParseIntPipe, NotFoundException, Post, HttpCode } from '@nestjs/common';
import { UserType } from '@/utils/decorators/user-type.decorator';
import { ZodValidationPipe } from '@/pipes/zod-validate.pipe';
import { GetPendingHotelsSchema, GetPendingHotelsType } from '@yisu/shared';
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
}
