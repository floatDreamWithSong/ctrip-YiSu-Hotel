import { tokenStore } from './request'

interface JwtPayload {
  sub: number
  username: string
  userType: 'MOBILE' | 'MERCHANT' | 'ADMIN'
}

const decodeBase64Url = (input: string) => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  )
  return atob(padded)
}

export const getCurrentUserPayload = (): JwtPayload | null => {
  const token = tokenStore.get()
  if (!token) {
    return null
  }
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }
  try {
    return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload
  } catch {
    return null
  }
}
