import { EXCEPTIONS } from "@/exceptions";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { USER_FROM_HEADER, userFrom } from "@yisu/shared";

export const Env = createParamDecorator((data: keyof userFrom, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const env = request.headers[USER_FROM_HEADER] as userFrom | undefined;
  if (!env || !Object.values(userFrom).includes(env)) {
    throw EXCEPTIONS.ILLEGAL_ENV;
  }
  return env;
});