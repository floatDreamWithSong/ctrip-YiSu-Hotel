export const VERIFICATION_CODE_POSTFIX = {
  USER_REGISTER: ':user_register',
  USER_FORGET_PASSWORD: ':user_forget_password',
} as const;

export type VerificationCodePostfix = (typeof VERIFICATION_CODE_POSTFIX)[keyof typeof VERIFICATION_CODE_POSTFIX];
