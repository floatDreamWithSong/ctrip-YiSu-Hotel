import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CosModule } from '@/modules/cos/cos.module';
import { EmailModule } from '@/utils/email/email.module';
import { JwtUtilsModule } from '@/utils/jwt/jwt.module';
import { VerificationCodeService } from './verification-code.service';

@Module({
  imports: [CosModule, EmailModule, JwtUtilsModule],
  providers: [UserService, VerificationCodeService],
  controllers: [UserController],
})
export class UserModule { }
