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
import { ApiUserTypes, JwtPayload, verifyCodeType, } from '@yisu/shared';
import { ZodValidationPipe } from '@/pipes/zod-validate.pipe';
// import { User } from '@/utils/decorators/user.decorator';
import { VERIFICATION_CODE_POSTFIX, VerificationCodePostfix } from '@/utils/constants';
import { User } from '@/utils/decorators/user.decorator';
// import { UploadFilter } from '@/utils/upload/upload.filter';
// import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';


@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) { }

  @Post('code')
  @HttpCode(HttpStatus.OK)
  @Public()
  async sendRegisterVerifyCode(@Body(ZodValidationPipe.userCodeSchema) body: ApiUserTypes['UserCode']) {
    const { email, type } = body;
    let postfix: VerificationCodePostfix = VERIFICATION_CODE_POSTFIX.USER_REGISTER
    if (type === verifyCodeType.FORGET_PASSWORD) {
      postfix = VERIFICATION_CODE_POSTFIX.USER_FORGET_PASSWORD;
    }
    return await this.userService.sendVerifyCode(email, postfix);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @Public()
  async register(@Body(ZodValidationPipe.userRegisterSchema) body: ApiUserTypes['UserRegister']) {
    return await this.userService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(@Body(ZodValidationPipe.userLoginSchema) body: ApiUserTypes['UserLogin']) {
    return await this.userService.login(body);
  }
  // @Get('info')
  // @Public()
  // async info(@Query('uid', ParseIntPipe) uid: string) {
  //   return await this.userService.publicInfo(uid);
  // }
  // @Get('self')
  // async self(@User() user: JwtPayload){
  //   return await this.userService.privateInfo(user.uid)
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
  async forgetPassword(@Body(ZodValidationPipe.userForgetPasswordSchema) body: ApiUserTypes['UserForgetPassword']) {
    return await this.userService.forgetPassword({ ...body });
  }
  // @Put('avatar')
  // @UseInterceptors(FileInterceptor('avatar', {
  //   fileFilter: (req, file, callback) => UploadFilter.fileFilter(file.fieldname, file, callback)
  // }))
  // async updateAvatar(@UploadedFile() file: Express.Multer.File, @User() user: JwtPayload) {
  //   return await this.userService.updateAvatar(file, user.uid);
  // }

}
