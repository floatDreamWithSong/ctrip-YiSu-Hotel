import type { ApiUserTypes } from "@yisu/shared";
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
    });
  },
  register: (data: ApiUserTypes['UserRegister']) => {
    return request<AuthRequestResponse>({
      url: '/user/register',
      method: 'POST',
      data,
    });
  },
  forgetPassword: (data: ApiUserTypes['UserForgetPassword']) => {
    return request({
      url: '/user/forget',
      method: 'PUT',
      data,
    });
  },
  sendVerifyCode: (data: ApiUserTypes['UserCode']) => {
    return request({
      url: '/user/code',
      method: 'POST',
      data,
    });
  },
};
