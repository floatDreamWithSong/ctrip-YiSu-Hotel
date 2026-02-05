import { JwtPayload } from '@/utils/jwt/types';
import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { USER_FROM_HEADER, userFrom } from '@yisu/shared';
import { Request } from 'express';

type RequestWithUser = Request & { user?: JwtPayload };

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);

  // 获取IP地址（考虑代理情况？）
  private getClientIp = (req: Request): string => {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  };
  
  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const clientIp = this.getClientIp(request);
    
    // 检查用户是否登录
    const user = request.user;
    
    this.logger.log(`rule: ${name} ip: ${clientIp}, user: ${user?.sub}`);

    const route = `${request.method}:${request.path}`;
    const env = request.headers[USER_FROM_HEADER] as userFrom;

    if (user?.sub) {
      return `${env}:user-${user.sub}-${route}-${name}-${suffix}`;
    } else {
      return `${env}:ip-${clientIp}-${route}-${name}-${suffix}`;
    }
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    
    const message = user?.sub 
      ? `用户${user?.sub}请求过于频繁，请稍后再试`
      : `IP${this.getClientIp(request)}请求过于频繁，请稍后再试`;
      
    throw new ThrottlerException(message);
  }
} 