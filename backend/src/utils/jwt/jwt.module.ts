import { Module } from '@nestjs/common';
import { JwtUtils } from './jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { Configurations } from '@/config';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [JwtUtils],
  exports: [JwtUtils],
})
export class JwtUtilsModule {}
