import { UserGender } from '../types';
import { z } from 'zod';

export const emailSchema = z.email({ error: '请输入有效的邮箱地址' });

export const usernameSchema = z.string({ error: '用户名不能为空' })
  .min(3, { error: '用户名至少需要3个字符' })
  .max(18, { error: '用户名最多18个字符' })

export const passwordSchema = z.string({ error: '密码不能为空' })
  .min(6, { error: '密码至少需要6个字符' })
  .max(32, { error: '密码最多32个字符' })
  //.regex(/[A-Z]/, { error: '密码必须包含至少一个大写字母' })
  //.regex(/[a-z]/, { error: '密码必须包含至少一个小写字母' })
  .regex(/[0-9]/, { error: '密码必须包含至少一个数字' });

export const verificationCodeSchema = z.string({ error: '验证码不能为空' })
  .length(6, { error: '验证码必须是6位字符' })

export const userGenderSchema = z.enum(UserGender);