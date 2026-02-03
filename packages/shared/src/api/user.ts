import { verifyCodeType } from "../types";
import { emailSchema, passwordSchema, userGenderSchema, usernameSchema, verificationCodeSchema } from "../schema";
import z from "zod";

// const userUpdatePasswordSchema = z.object({
//   newPassword: passwordSchema,
//   oldPassword: passwordSchema
// });
// const userUpdateEmailSchema = z.object({
//   email: emailSchema,
//   verifyCode: verificationCodeSchema
// });


export const ApiUserSchemas = {
  userCode: z.object({
    email: emailSchema,
    type: z.enum(verifyCodeType)
  }),
  userRegister: z.object({
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema,
    verifyCode: verificationCodeSchema,
    isMerchant: z.boolean().default(false)
  }),
  userLogin: z.object({
    username: usernameSchema,
    password: passwordSchema
  }),
  userUpdateInfo: z.object({
    username: usernameSchema.optional(),
    gender: userGenderSchema.optional(),
  }),
  userForgetPassword: z.object({
    email: emailSchema,
    password: passwordSchema,
    verifyCode: verificationCodeSchema
  })
}

export type ApiUserTypes = {
  [key in keyof typeof ApiUserSchemas as `${Capitalize<key>}`]: z.infer<typeof ApiUserSchemas[key]>
};