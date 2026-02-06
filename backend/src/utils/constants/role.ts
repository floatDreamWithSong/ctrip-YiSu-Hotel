// import { UserType } from "@yisu/shared";

// export const USER_ROLE = {
//   USER: 1,
//   MERCHANT: 2,
//   ADMIN: 4,
// } as const;

// export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

// export const hasUserRole = (role: number) => (role & USER_ROLE.USER) === USER_ROLE.USER

// export const hasMerchantRole = (role: number) => (role & USER_ROLE.MERCHANT) === USER_ROLE.MERCHANT

// export const hasAdminRole = (role: number) => (role & USER_ROLE.ADMIN) === USER_ROLE.ADMIN

// export const mapRole2Type = (role: UserRole) => {
//   if(role === USER_ROLE.USER) return UserType.USER;
//   if(role === USER_ROLE.MERCHANT) return UserType.MERCHANT;
//   return UserType.ADMIN;
// }
// export const mapType2Role = (type: UserType) => {
//   if(type === UserType.USER) return USER_ROLE.USER;
//   if(type === UserType.MERCHANT) return USER_ROLE.MERCHANT;
//   return USER_ROLE.ADMIN;
// }