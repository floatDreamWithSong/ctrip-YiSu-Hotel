import { Module } from '@nestjs/common'
import { HotelController } from './hotel.controller'
import { HotelService } from './hotel.service'
import { MobileHotelController } from './mobile-hotel.controller'
import { MobileHotelService } from './mobile-hotel.service'
import { LocationModule } from '../location/location.module'

@Module({
  imports: [LocationModule],
  controllers: [HotelController, MobileHotelController],
  providers: [HotelService, MobileHotelService],
})
export class HotelModule {}
