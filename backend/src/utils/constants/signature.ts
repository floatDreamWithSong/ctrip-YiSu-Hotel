export const SIGNATURE_TYPE = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export type SignatureType = (typeof SIGNATURE_TYPE)[keyof typeof SIGNATURE_TYPE];