import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module, OnModuleInit } from '@nestjs/common';
import ms from 'ms';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true, // 配置模块全局可用
      envFilePath: [ 
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        (console.log(process.env.NODE_ENV),'.env.local'),
        '.env',
      ],
      
    }),
  ],
})
export class Configurations implements OnModuleInit {
  private static configService: ConfigService;


  static get PORT() {
    return this.configService.getOrThrow<number>('PORT');
  }

  // 静态字段，用于直接访问环境变量
  static get HTTP_TIMEOUT() {
    return this.configService.get<number>('HTTP_TIMEOUT') ?? 5000;
  }
  static get HTTP_MAX_REDIRECTS() {
    return this.configService.get<number>('HTTP_MAX_REDIRECTS') ?? 5;
  }
  static get DATABASE_URL() {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }
  static get JWT_SECRET() {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }
  static get ACCESS_TOKEN_EXPIRATION_TIME() {
    return this.configService.getOrThrow<ms.StringValue>('ACCESS_TOKEN_EXPIRATION_TIME')
  }
  static get REFRESH_TOKEN_EXPIRATION_TIME() {
    return this.configService.getOrThrow<ms.StringValue>('REFRESH_TOKEN_EXPIRATION_TIME')
  }
  static get MAIL_HOST() {
    return this.configService.getOrThrow<string>('MAIL_HOST');
  }
  static get MAIL_PORT() {
    return this.configService.getOrThrow<number>('MAIL_PORT');
  }
  static get MAIL_USER() {
    return this.configService.getOrThrow<string>('MAIL_USER');
  }
  static get MAIL_PASS() {
    return this.configService.getOrThrow<string>('MAIL_PASS');
  }
  static get COS_SECRET_ID() {
    return this.configService.getOrThrow<string>('COS_SECRET_ID');
  }
  static get COS_SECRET_KEY() {
    return this.configService.getOrThrow<string>('COS_SECRET_KEY');
  }
  static get COS_BUCKET() {
    return this.configService.getOrThrow<string>('COS_BUCKET');
  }
  static get COS_REGION() {
    return this.configService.getOrThrow<string>('COS_REGION');
  }
  static get CRYPTO_SECRET() {
    return this.configService.getOrThrow<string>('CRYPTO_SECRET');
  }

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    Configurations.configService = this.configService;
    console.log('PORT', Configurations.PORT);
    console.log("DATABASE_URL", Configurations.DATABASE_URL);
    console.log('Configurations.BUCKET', Configurations.COS_BUCKET);
    console.log('access token expiration time', Configurations.ACCESS_TOKEN_EXPIRATION_TIME);
    console.log('refresh token expiration time', Configurations.REFRESH_TOKEN_EXPIRATION_TIME);
  }
}
