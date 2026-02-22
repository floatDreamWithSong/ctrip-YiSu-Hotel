import { env } from '@/env'
import { createAxiosInstance } from '@yisu/front-utils/request'
import { USER_FROM_HEADER, userFrom } from '@yisu/shared'

const tokenKey = 'token'
const refreshTokenKey = 'refreshToken'

export const tokenStore = {
  get: () => localStorage.getItem(tokenKey),
  set: (token: string) => localStorage.setItem(tokenKey, token),
  remove: () => {
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(refreshTokenKey)
  },
}

export const refreshTokenStore = {
  get: () => localStorage.getItem(refreshTokenKey),
  set: (token: string) => localStorage.setItem(refreshTokenKey, token),
}

createAxiosInstance({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    [USER_FROM_HEADER]: userFrom.ADMIN,
  },
  timeout: 10000,
  onTokenGet: tokenStore.get,
  onTokenRemove: tokenStore.remove,
})
