export const HotelReviewStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DEPRECATED: 'DEPRECATED',
} as const

export type HotelReviewStatus = (typeof HotelReviewStatus)[keyof typeof HotelReviewStatus]

export const RejectReasonType = {
  INFO_INCOMPLETE: 'INFO_INCOMPLETE',
  INFO_INACCURATE: 'INFO_INACCURATE',
  IMAGE_QUALITY: 'IMAGE_QUALITY',
  PRICE_ABNORMAL: 'PRICE_ABNORMAL',
  DUPLICATE: 'DUPLICATE',
  POLICY_VIOLATION: 'POLICY_VIOLATION',
  OTHER: 'OTHER',
} as const

export type RejectReasonType = (typeof RejectReasonType)[keyof typeof RejectReasonType]

export const PriceMode = {
  PER_NIGHT: 'PER_NIGHT',
  PER_HOUR: 'PER_HOUR',
} as const

export type PriceMode = (typeof PriceMode)[keyof typeof PriceMode]
