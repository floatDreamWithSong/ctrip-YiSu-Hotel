import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ApiUserSchemas, emailSchema, pageQuerySchema } from '@yisu/shared';
import { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: ZodType<T>) { }

  transform(value: unknown, _: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      console.log(result.error.message);
      throw new BadRequestException('Zod Validation failed');
    }
    return result.data;
  }
  static emailSchema = new ZodValidationPipe(emailSchema);
  static pageQuerySchema = new ZodValidationPipe(pageQuerySchema);
  static userRegisterSchema = new ZodValidationPipe(ApiUserSchemas.userRegister);
  static userLoginSchema = new ZodValidationPipe(ApiUserSchemas.userLogin)
  static userUpdateInfoSchema = new ZodValidationPipe(ApiUserSchemas.userUpdateInfo);
  static userForgetPasswordSchema = new ZodValidationPipe(ApiUserSchemas.userForgetPassword);
}
