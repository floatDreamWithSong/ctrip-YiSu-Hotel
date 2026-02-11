import { Module } from '@nestjs/common';
import { Configurations } from './config';
import { JwtUtilsModule } from './utils/jwt/jwt.module';
import { PrismaModule } from './utils/prisma/prisma.module';
import { RedisCacheModule } from './utils/redis/redis.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './guards/jwt.guard';
import { UserTypeGuard } from './guards/user-type.guard';
import { UserModule } from './modules/user/user.module';
import { LocationModule } from './modules/location/location.module';
import { AdminModule } from './modules/admin/admin.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';

@Module({
  imports: [
    Configurations,
    JwtUtilsModule,
    PrismaModule,
    RedisCacheModule,
    UserModule,
    LocationModule,
    AdminModule,
    ThrottlerModule.forRoot([
      {
        name: 'burst',
        ttl: 1000,  // 1秒
        limit: 10,   // 1秒内最多10次请求
      },
      // {
      //   name: 'sustained',
      //   ttl: 30_000, // 30秒
      //   limit: 10, // 最多10次请求
      // }
    ])
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UserTypeGuard,
    },
  ],
})
export class AppModule { }
