import { env } from '@/env'
import { createAxiosInstance } from '@yisu/front-utils/request'

const tokenKey = 'token'

export const tokenStore = {
  get: () => localStorage.getItem(tokenKey),
  set: (token: string) => localStorage.setItem(tokenKey, token),
  remove: () => localStorage.removeItem(tokenKey),
}

createAxiosInstance({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  onTokenGet: tokenStore.get,
  onTokenRemove: tokenStore.remove,
})
