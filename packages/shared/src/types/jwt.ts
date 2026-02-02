import { UserType } from "./user";

export type SignatureType = 'access' | 'refresh';

export interface JwtPayload {
  uid: string;
  username: string;
  userType: UserType;
  type: SignatureType;
}