import { Injectable, Logger } from '@nestjs/common';
import { CosService } from '@/modules/cos/cos.service';
import { PrismaService } from '@/utils/prisma/prisma.service';
import { EmailService } from '@/utils/email/email.service';
import { VerificationCodeService } from './verification-code.service';
import { EXCEPTIONS } from '@/exceptions';
import { JwtUtils } from '@/utils/jwt/jwt.service';
import { ApiUserTypes, emailSchema, userFrom, UserType, verifyCodeType } from '@yisu/shared';
import { VERIFICATION_CODE_POSTFIX, VerificationCodePostfix } from '@/utils/constants';
import { generateUid } from '@/utils/generators/uid';
import { Prisma, Realm } from 'prisma-generated';
import { CryptoUtils } from '@/utils/jwt/utils';
import { Configurations } from '@/config';
import bcrypt from "bcrypt";

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
  /**
   * Hash a plain password using bcrypt.
   * @param password - plain text password
   * @param cost - bcrypt cost factor (10~14 typical). Default 12.
   */
  private async getPasswordHash(password: string, cost: number = 12): Promise<string> {

    if (!Number.isInteger(cost) || cost < 10 || cost > 15) {
      throw new Error("cost must be an integer between 10 and 15");
    }

    const salt = await bcrypt.genSalt(cost);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify a plain password against a bcrypt hash.
   */
  private verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  private checkEmail(email: string) {
    this.logger.debug(`checking email: ${email}`);
    if (!emailSchema.safeParse(email).success) {
      throw EXCEPTIONS.INVALID_EMAIL;
    }
  }
  private getTargetRealm(from: userFrom, isMerchant: boolean) {
    if (from === userFrom.MOBILE) {
      return Realm.MOBILE;
    }
    return isMerchant ? Realm.MERCHANT : Realm.ADMIN;
  }
  private findUserByEmail(email: string, from: userFrom, isMerchant?: boolean) {
    if (isMerchant !== void 0) {
      return this.prismaService.user.findUnique({
        where: {
          uniq_realm_email: {
            email: email,
            realm: this.getTargetRealm(from, isMerchant),
          },
        },
      });
    }
    if (from === userFrom.MOBILE) {
      return this.prismaService.user.findUnique({
        where: {
          uniq_realm_email: {
            email: email,
            realm: Realm.MOBILE,
          },
        },
      });
    }
    // 后台用户在验证码注册之前，已检查邮箱是否已绑定，保证邮箱查找唯一
    return this.prismaService.user.findFirst({
      where: {
        email: email,
        realm: { in: [Realm.MERCHANT, Realm.ADMIN] },
      },
    })

  }
  private findUserByUsername(username: string, from: userFrom) {
    if (from === userFrom.MOBILE) {
      return this.prismaService.user.findUnique({
        where: {
          uniq_realm_username: {
            username: username,
            realm: Realm.MOBILE,
          },
        },
      });
    }
    /**
     * backend\prisma\migrations\20260205064346_add_staff_username_unique\migration.sql
     * 保证后台用户之间的用户名唯一
     * CREATE UNIQUE INDEX IF NOT EXISTS uniq_staff_username
     * ON "users" ("username")
     * WHERE "realm" IN ('MERCHANT','ADMIN');
     */
    return this.prismaService.user.findFirst({
      where: {
        username: username,
        realm: { in: [Realm.MERCHANT, Realm.ADMIN] },
      },
    });
  }
  private generateTokenPair(sub: number, userType: Realm, username: string) {
    return this.jwtUtils.generateTokenPair({
      sub: sub,
      username: username,
      userType: userType,
      type: 'access',
    })
  }
  /**
   *  发送验证码
   * @param email 
   */
  async sendVerifyCode(from: userFrom, body: ApiUserTypes['UserCode']): Promise<void> {
    const { email, type } = body;
    let postfix: string = `:${from}_${VERIFICATION_CODE_POSTFIX.USER_REGISTER}`
    if (type === verifyCodeType.FORGET_PASSWORD) {
      postfix = `:${from}_${VERIFICATION_CODE_POSTFIX.USER_FORGET_PASSWORD}`;
    }
    const user = await this.findUserByEmail(email, from);
    if (body.type === verifyCodeType.REGISTER) {
      // 在管理端，一个邮箱只能注册为商家或者管理员
      if (user)
        throw EXCEPTIONS.EMAIL_ALREADY_BOUND;
    } else {
      if (!user) {
        throw EXCEPTIONS.USER_NOT_FOUND;
      }
    }
    if (await this.verificationCodeService.isCodeFrequent(email, postfix)) {
      throw EXCEPTIONS.VERIFY_CODE_SEND_TOO_FREQUENTLY;
    }
    // 发送验证码
    const code = crypto.randomUUID().slice(0, 6);
    await this.emailService.sendVerificationCode(email, code);
    // 缓存验证码，有效期为 5 分钟
    await this.verificationCodeService.setCode(email, code, postfix);
  }

  /**
   *  用户登录
   * @param body 
   * @returns 
   */
  async login(from: userFrom, body: ApiUserTypes['UserLogin']) {
    // 检查用户是否存在
    const user = await this.findUserByUsername(body.username, from);
    if (!user) {
      throw EXCEPTIONS.USER_NOT_FOUND;
    }
    // 检查密码
    const isSame = await this.verifyPassword(body.password, user.password);
    if (!isSame) {
      throw EXCEPTIONS.PASSWORD_ERROR;
    }
    return {
      ...this.generateTokenPair(user.id, user.realm, user.username),
    }
  }
  /**
   *  用户注册
   * @param body 
   * @returns 
   */
  async register(from: userFrom, body: ApiUserTypes['UserRegister']) {
    // 检查邮箱格式
    this.checkEmail(body.email);
    // 检查邮箱是否已绑定
    const user = await this.findUserByEmail(body.email, from, body.isMerchant);
    if (user) {
      throw EXCEPTIONS.EMAIL_ALREADY_BOUND;
    }

    // 检查验证码
    const code = await this.verificationCodeService.getCode(body.email, `:${from}_${VERIFICATION_CODE_POSTFIX.USER_REGISTER}`);
    if (!code) {
      throw EXCEPTIONS.NO_CODE_FOUND;
    }
    if (code !== body.verifyCode) {
      throw EXCEPTIONS.VERIFY_CODE_ERROR;
    }
    // 创建用户
    try {
      const passwordHash = await this.getPasswordHash(body.password);
      const newUser = await this.prismaService.user.create({
        data: {
          email: body.email,
          password: passwordHash,
          username: body.username,
          realm: this.getTargetRealm(from, body.isMerchant),
        },
      });
      return {
        ...this.generateTokenPair(newUser.id, newUser.realm, newUser.username),
      }
    } catch (error) {
      const isPrismaError = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
        error instanceof Prisma.PrismaClientKnownRequestError;

      if (isPrismaError(error)) {
        if (error.code === 'P2002') {
          throw EXCEPTIONS.USERNAME_ALREADY_BOUND;
        }
      }
      throw error;
    }
  }

  async forgetPassword(from: userFrom, body: ApiUserTypes['UserForgetPassword']) {
    const user = await this.findUserByEmail(body.email, from);
    if (!user) {
      throw EXCEPTIONS.USER_NOT_FOUND;
    }
    const code = await this.verificationCodeService.getCode(body.email, `:${from}_${VERIFICATION_CODE_POSTFIX.USER_FORGET_PASSWORD}`);
    if (code !== body.verifyCode) {
      throw EXCEPTIONS.VERIFY_CODE_ERROR;
    }
    const passwordHash = await this.getPasswordHash(body.password);
    await this.prismaService.user.update({
      where: {
        id: user.id
      },
      data: {
        password: passwordHash,
      },
    });
    await this.verificationCodeService.deleteCode(body.email, `:${from}_${VERIFICATION_CODE_POSTFIX.USER_FORGET_PASSWORD}`);
  }
}
