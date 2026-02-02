import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from '@/guards/custom-throttler.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'burst',
        ttl: 1000,  // 1秒
        limit: 1,   // 1秒内最多1次请求
      },
      {
        name: 'sustained',
        ttl: 30_000, // 30秒
        limit: 10, // 最多10次请求
      }
    ])],
  providers: [
    EmailService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
  exports: [EmailService],
})
export class EmailModule { }
