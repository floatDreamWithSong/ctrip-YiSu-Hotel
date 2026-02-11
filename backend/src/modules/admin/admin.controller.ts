import { Controller, Get, Query } from '@nestjs/common';
import { UserType } from '@/utils/decorators/user-type.decorator';
import { ZodValidationPipe } from '@/pipes/zod-validate.pipe';
import { GetPendingHotelsSchema, GetPendingHotelsType } from '@yisu/shared';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('pending')
  @UserType('onlyAdmin')
  async getPendingHotels(@Query(new ZodValidationPipe(GetPendingHotelsSchema)) query: GetPendingHotelsType) {
    return this.adminService.getPendingHotels(query);
  }
}
