import {
  Body,
  Controller,
  // Get,
  HttpCode,
  HttpStatus,
  Logger,
  // ParseIntPipe,
  Post,
  Put,
  // Put,
  // Query,
  // UploadedFile,
  // UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';

import { Public } from '@/utils/decorators/public.decorator';
import { ApiUserTypes, userFrom } from '@yisu/shared';
import { ZodValidationPipe } from '@/pipes/zod-validate.pipe';
import { Env } from '@/utils/decorators/env.decorator';
import { Throttle } from '@nestjs/throttler';


@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) { }

  @Post('code')
  @HttpCode(HttpStatus.OK)
  @Public()
  // @Throttle({ burst: { ttl: 30_000, limit: 1 } })
  async sendRegisterVerifyCode(@Body(ZodValidationPipe.userCodeSchema) body: ApiUserTypes['UserCode'], @Env() env: userFrom) {
    return await this.userService.sendVerifyCode(env, body);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @Public()
  async register(@Body(ZodValidationPipe.userRegisterSchema) body: ApiUserTypes['UserRegister'], @Env() env: userFrom) {
    return await this.userService.register(env, body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(@Body(ZodValidationPipe.userLoginSchema) body: ApiUserTypes['UserLogin'], @Env() env: userFrom) {
    return await this.userService.login(env, body);
  }
  @Put('forget')
  @Public()
  async forgetPassword(@Body(ZodValidationPipe.userForgetPasswordSchema) body: ApiUserTypes['UserForgetPassword'], @Env() env: userFrom) {
    return await this.userService.forgetPassword(env, body);
  }
}
