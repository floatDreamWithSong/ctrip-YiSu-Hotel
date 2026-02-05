import { SetMetadata } from '@nestjs/common';
import { JwtPayload } from '@/utils/jwt/types';
import { Realm } from 'prisma-generated';

export const META_USER_TYPE = Symbol('user_type');

export type UserTypeValidator = (user: JwtPayload) => boolean;

const validators = {
  onlyUser: (user: JwtPayload) => user.userType === Realm.MOBILE,
  onlyMerchant: (user: JwtPayload) => user.userType === Realm.MERCHANT,
  onlyAdmin: (user: JwtPayload) => user.userType === Realm.ADMIN,
} satisfies Record<string, UserTypeValidator>;

export const UserType = (validator: UserTypeValidator | keyof typeof validators) => {
  if (typeof validator === 'string') {
    return SetMetadata(META_USER_TYPE, validators[validator]);
  }
  return SetMetadata(META_USER_TYPE, validator);
};
