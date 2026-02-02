import { SetMetadata } from '@nestjs/common';
import { JwtPayload, UserType } from '@yisu/shared';

export const META_USER_TYPE = Symbol('user_type');

export type UserTypeValidator = (user: JwtPayload) => boolean;

const validators = {
  onlyUser: (user: JwtPayload) => user.userType === UserType.USER,
  onlyMerchant: (user: JwtPayload) => user.userType === UserType.MERCHANT,
  onlyAdmin: (user: JwtPayload) => user.userType === UserType.ADMIN,
  beyondMerchant: (user: JwtPayload) => user.userType > UserType.MERCHANT,
} satisfies Record<string, UserTypeValidator>;

export const UserRole = (validator: UserTypeValidator | keyof typeof validators) => {
  if (typeof validator === 'string') {
    return SetMetadata(META_USER_TYPE, validators[validator]);
  }
  return SetMetadata(META_USER_TYPE, validator);
};
