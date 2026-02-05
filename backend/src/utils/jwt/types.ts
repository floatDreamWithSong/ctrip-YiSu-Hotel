import { Realm } from "prisma-generated";
import { SignatureType } from "../constants";



export interface JwtPayload {
  sub: number;
  username: string;
  userType: Realm;
  type: SignatureType;
}