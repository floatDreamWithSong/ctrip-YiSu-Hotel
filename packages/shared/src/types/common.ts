import { pageQuerySchema } from "../schema/common";
import z from "zod";

export type PageQuery = z.infer<typeof pageQuerySchema>;

export const Realm = {
  MOBILE: 'MOBILE',
  MERCHANT: 'MERCHANT',
  ADMIN: 'ADMIN',
} as const;

export type Realm = (typeof Realm)[keyof typeof Realm];