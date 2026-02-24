import { Module } from '@nestjs/common'
import { HotelController } from './hotel.controller'
import { HotelRealtimeService } from './hotel-realtime.service'
import { HotelService } from './hotel.service'
import { MobileHotelController } from './mobile-hotel.controller'
import { MobileHotelService } from './mobile-hotel.service'
import { LocationModule } from '../location/location.module'
import { JwtUtilsModule } from '@/utils/jwt/jwt.module'

@Module({
  imports: [LocationModule, JwtUtilsModule],
  controllers: [HotelController, MobileHotelController],
  providers: [HotelService, MobileHotelService, HotelRealtimeService],
})
export class HotelModule {}
