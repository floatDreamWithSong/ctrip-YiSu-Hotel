export const UserType = {
  USER: 0,
  MERCHANT: 1,
  ADMIN: 2
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];


export const UserGender = {
  UNKNOWN: 0,
  MALE: 1,
  FEMALE: 2,
} as const;

export type UserGender = (typeof UserGender)[keyof typeof UserGender];


export interface UserInfo {
  username: string
  avatar: string
  userType: UserType
  email: string
  gender: UserGender
  registerTime: string
  _count: {
    Passage: number
  }
  uid: string
}

export const verifyCodeType = {
  REGISTER: 'register',
  FORGET_PASSWORD: 'forget_password',
} as const;

export type verifyCodeType = (typeof verifyCodeType)[keyof typeof verifyCodeType];

export const userFrom = {
  MOBILE: 'mobile',
  ADMIN: 'admin',
} as const;

export type userFrom = (typeof userFrom)[keyof typeof userFrom];

export const USER_FROM_HEADER = 'x-from-env'