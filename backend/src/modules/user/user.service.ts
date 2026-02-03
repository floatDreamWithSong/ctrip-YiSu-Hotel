import { Injectable, Logger } from '@nestjs/common';
import { CosService } from '@/utils/cos/cos.service';
import { PrismaService } from '@/utils/prisma/prisma.service';
import { EmailService } from '@/utils/email/email.service';
import { VerificationCodeService } from './verification-code.service';
import { EXCEPTIONS } from '@/exceptions';
import { JwtUtils } from '@/utils/jwt/jwt.service';
import { ApiUserTypes, emailSchema, UserType } from '@yisu/shared';
import { VERIFICATION_CODE_POSTFIX, VerificationCodePostfix } from '@/utils/constants';
import { generateUid } from '@/utils/generators/uid';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly cosService: CosService,
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtUtils: JwtUtils,
    private readonly verificationCodeService: VerificationCodeService,
  ) { }
  // async updateAvatar(file: Express.Multer.File, uid: string) {
  //   const user = await this.prismaService.user.findUnique({
  //     where: {
  //       uid: uid,
  //     },
  //   });
  //   if (!user) {
  //     throw EXCEPTIONS.USER_NOT_FOUND;
  //   }
  //   const avatarUrl = `https://${await this.cosService.uploadFile(file)}`;
  //   const oldAvatarUrl = user.avatar;
  //   await this.prismaService.user.update({
  //     where: {
  //       uid: uid,
  //     },
  //     data: {
  //       avatar: avatarUrl,
  //     },
  //   });
  //   if (oldAvatarUrl) {
  //     await this.cosService.deleteFileByUrl(oldAvatarUrl);
  //   }
  //   return {
  //     avatar: avatarUrl,
  //   }
  // }
  async updateInfo(body: ApiUserTypes['UserUpdateInfo'] & { uid: string }) {
    await this.prismaService.user.update({
      where: {
        uid: body.uid,
      },
      data: body,
    });
  }
  async forgetPassword(body: ApiUserTypes['UserForgetPassword']) {
    const user = await this.findUserByEmail(body.email);
    if (!user) {
      throw EXCEPTIONS.USER_NOT_FOUND;
    }
    const code = await this.verificationCodeService.getCode(body.email, VERIFICATION_CODE_POSTFIX.USER_FORGET_PASSWORD);
    if (code !== body.verifyCode) {
      throw EXCEPTIONS.VERIFY_CODE_ERROR;
    }
    await this.prismaService.user.update({
      where: {
        id: user.id
      },
      data: {
        password: body.password,
      },
    });
    await this.verificationCodeService.deleteCode(body.email, VERIFICATION_CODE_POSTFIX.USER_FORGET_PASSWORD);
  }


  private checkEmail(email: string) {
    this.logger.debug(`checking email: ${email}`);
    if (!emailSchema.safeParse(email).success) {
      throw EXCEPTIONS.INVALID_EMAIL;
    }
  }
  private findUserByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });
  }
  private generateTokenPair(uid: string, userType: number, username: string) {
    return this.jwtUtils.generateTokenPair({
      uid: uid,
      username: username,
      userType: userType,
      type: 'access',
    })
  }
  /**
   *  发送验证码
   * @param email 
   */
  async sendVerifyCode(email: string, postfixType: VerificationCodePostfix): Promise<void> {
    // 检查邮箱格式
    this.checkEmail(email)
    // 检查邮箱是否已绑定
    if (postfixType === VERIFICATION_CODE_POSTFIX.USER_REGISTER) {
      const user = await this.findUserByEmail(email);
      if (user) {
        throw EXCEPTIONS.EMAIL_ALREADY_BOUND;
      }
    }
    let code = await this.verificationCodeService.getCode(email, postfixType);
    if (code) {
      throw EXCEPTIONS.VERIFY_CODE_SEND_TOO_FREQUENTLY;
    }
    // 发送验证码
    code = crypto.randomUUID().slice(0, 6);
    await this.emailService.sendVerificationCode(email, code);
    // 缓存验证码，有效期为 5 分钟
    await this.verificationCodeService.setCode(email, code, postfixType);
  }

  /**
   *  用户登录
   * @param body 
   * @returns 
   */
  async login(body: ApiUserTypes['UserLogin']) {
    // 检查用户是否存在
    const user = await this.prismaService.user.findUnique({
      where: {
        username: body.username,
      },
    })
    if (!user) {
      throw EXCEPTIONS.USER_NOT_FOUND;
    }
    // 检查密码
    if (user.password !== body.password) {
      throw EXCEPTIONS.PASSWORD_ERROR;
    }
    // 生成 token
    return {
      ...this.generateTokenPair(user.uid, user.userType, user.username),
    }
  }
  /**
   *  用户注册
   * @param body 
   * @returns 
   */
  async register(body: ApiUserTypes['UserRegister']) {
    // 检查邮箱格式
    this.checkEmail(body.email);
    // 检查邮箱是否已绑定
    const user = await this.findUserByEmail(body.email);
    if (user) {
      throw EXCEPTIONS.EMAIL_ALREADY_BOUND;
    }
    // 检查验证码
    const code = await this.verificationCodeService.getCode(body.email, VERIFICATION_CODE_POSTFIX.USER_REGISTER);

    if (code !== body.verifyCode) {
      throw EXCEPTIONS.VERIFY_CODE_ERROR;
    }
    // 创建用户
    const newUser = await this.prismaService.user.create({
      data: {
        email: body.email,
        password: body.password,
        username: body.username,
        uid: generateUid(),
      },
    });
    // 生成 token
    const userType = body.isMerchant ? UserType.MERCHANT : UserType.USER;
    return {
      ...this.generateTokenPair(newUser.uid, userType, newUser.username),
    }
  }
}
