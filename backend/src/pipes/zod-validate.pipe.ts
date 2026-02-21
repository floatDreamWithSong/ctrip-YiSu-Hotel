import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ApiUserSchemas, ApiLocationSchemas, ApiHotelSchemas, emailSchema, pageQuerySchema } from '@yisu/shared';
import { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: ZodType<T>) { }

  transform(value: unknown, _: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      let message = 'Zod Validation failed'
      if (result.error.issues.length > 0) {
        message = result.error.issues[0].message
      }
      throw new BadRequestException(message);
    }
    return result.data;
  }
  static emailSchema = new ZodValidationPipe(emailSchema);
  static pageQuerySchema = new ZodValidationPipe(pageQuerySchema);
  static userRegisterSchema = new ZodValidationPipe(ApiUserSchemas.userRegister);
  static userLoginSchema = new ZodValidationPipe(ApiUserSchemas.userLogin)
  static userUpdateInfoSchema = new ZodValidationPipe(ApiUserSchemas.userUpdateInfo);
  static userForgetPasswordSchema = new ZodValidationPipe(ApiUserSchemas.userForgetPassword);
  static userCodeSchema = new ZodValidationPipe(ApiUserSchemas.userCode);
  static regeocodeRequestSchema = new ZodValidationPipe(ApiLocationSchemas.regeocodeRequest);
  static inputTipsRequestSchema = new ZodValidationPipe(ApiLocationSchemas.inputTipsRequest);
  static geocodeRequestSchema = new ZodValidationPipe(ApiLocationSchemas.geocodeRequest);
  static hotelQuerySchema = new ZodValidationPipe(ApiHotelSchemas.hotelQuery);
  static hotelCreateSchema = new ZodValidationPipe(ApiHotelSchemas.hotelCreate);
  static hotelUpdateHomeAdSchema = new ZodValidationPipe(ApiHotelSchemas.hotelUpdateHomeAd);
  static hotelInfoQuerySchema = new ZodValidationPipe(ApiHotelSchemas.hotelInfoQuery);
  static hotelInfoCreateSchema = new ZodValidationPipe(ApiHotelSchemas.hotelInfoCreate);
  static hotelInfoUpdateSchema = new ZodValidationPipe(ApiHotelSchemas.hotelInfoUpdate);
  static adminReviewQuerySchema = new ZodValidationPipe(ApiHotelSchemas.adminReviewQuery);
  static adminReviewActionSchema = new ZodValidationPipe(ApiHotelSchemas.adminReviewAction);
  static reviewRecordQuerySchema = new ZodValidationPipe(ApiHotelSchemas.reviewRecordQuery);
}
