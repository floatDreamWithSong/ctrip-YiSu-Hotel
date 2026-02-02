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
