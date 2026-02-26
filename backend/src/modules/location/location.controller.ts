import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { Public } from '@/utils/decorators/public.decorator';
import { ZodValidationPipe } from '@/pipes/zod-validate.pipe';
import type {  ApiLocationTypes } from '@yisu/shared';
import { Throttle } from '@nestjs/throttler';

@Controller('location')
export class LocationController {
  private readonly logger = new Logger(LocationController.name);

  constructor(private readonly locationService: LocationService) { }

  @Post('regeocode')
  @HttpCode(HttpStatus.OK)
  @Public()
  @Throttle({ burst: { ttl: 1000, limit: 3 } })
  async regeocode(
    @Body(ZodValidationPipe.regeocodeRequestSchema)
    body: ApiLocationTypes['RegeocodeRequest'],
  ) {
    return await this.locationService.regeocode(body.location);
  }

  @Get('input-tips')
  @Public()
  @Throttle({ burst: { ttl: 1000, limit: 5 } })
  async inputTips(
    @Query(ZodValidationPipe.inputTipsRequestSchema)
    query: ApiLocationTypes['InputTipsRequest'],
  ) {
    return await this.locationService.inputTips(query.keywords, query.city);
  }

  @Get('geocode')
  @Public()
  @Throttle({ burst: { ttl: 1000, limit: 3 } })
  async geocode(
    @Query(ZodValidationPipe.geocodeRequestSchema)
    query: ApiLocationTypes['GeocodeRequest'],
  ) {
    return await this.locationService.geocode(query.address, query.city);
  }

  @Get('china-city-index')
  @Public()
  @Throttle({ burst: { ttl: 1000, limit: 2 } })
  async chinaCityIndex() {
    return await this.locationService.chinaCityIndex();
  }
}
