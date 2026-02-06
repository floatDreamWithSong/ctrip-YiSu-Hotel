import type { ApiUserTypes } from "@yisu/shared";
import { ApiUserSchemas } from "@yisu/shared";
import { request } from "../request";

export interface AuthRequestResponse {
  accessToken: string;
  refreshToken: string;
}

export const AuthRequest = {
  login: (data: ApiUserTypes['UserLogin']) => {
    return request<AuthRequestResponse>({
      url: '/user/login',
      method: 'POST',
      data,
      dataValidator: ApiUserSchemas.userLogin,
    });
  },
  register: (data: ApiUserTypes['UserRegister']) => {
    return request<AuthRequestResponse>({
      url: '/user/register',
      method: 'POST',
      data,
      dataValidator: ApiUserSchemas.userRegister,
    });
  },
  forgetPassword: (data: ApiUserTypes['UserForgetPassword']) => {
    return request({
      url: '/user/forget',
      method: 'PUT',
      data,
      dataValidator: ApiUserSchemas.userForgetPassword,
    });
  },
  sendVerifyCode: (data: ApiUserTypes['UserCode']) => {
    return request({
      url: '/user/code',
      method: 'POST',
      data,
      dataValidator: ApiUserSchemas.userCode,
    });
  },
};
