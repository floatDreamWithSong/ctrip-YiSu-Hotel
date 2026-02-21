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
  // @Get('info')
  // @Public()
  // async info(@Query('uid', ParseIntPipe) uid: string) {
  //   return await this.userService.publicInfo(uid);
  // }
  // @Get('self')
  // async self(@User() user: JwtPayload){
  //   return await this.userService.privateInfo(user.sub)
  // }
  // @Put('info')
  // async updateInfo(@Body(ZodValidationPipe.userUpdateInfoSchema) body: ApiUserTypes['UserUpdateInfo'], @User() user: JwtPayload) {
  //   return await this.userService.updateInfo({...body, uid: user.uid});
  // }
  // @Put('password')
  // async updatePassword(@Body(ZodValidationPipe.userUpdatePasswordSchema) body: UserUpdatePassword, @User() user: JwtPayload) {
  //   return await this.userService.updatePassword({...body, uid: user.uid});
  // }
  // @Put('email')
  // async updateEmail(@Body(ZodValidationPipe.userUpdateEmailSchema) body: UserUpdateEmail, @User() user: JwtPayload) {
  //   return await this.userService.updateEmail({...body, uid: user.uid});
  // }
  @Put('forget')
  @Public()
  async forgetPassword(@Body(ZodValidationPipe.userForgetPasswordSchema) body: ApiUserTypes['UserForgetPassword'], @Env() env: userFrom) {
    return await this.userService.forgetPassword(env, body);
  }
  // @Put('avatar')
  // @UseInterceptors(FileInterceptor('avatar', {
  //   fileFilter: (req, file, callback) => UploadFilter.fileFilter(file.fieldname, file, callback)
  // }))
  // async updateAvatar(@UploadedFile() file: Express.Multer.File, @User() user: JwtPayload) {
  //   return await this.userService.updateAvatar(file, user.uid);
  // }

}
