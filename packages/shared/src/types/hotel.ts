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

export const HotelSearchRoomType = {
  HOTEL: 'HOTEL',
  HOURLY: 'HOURLY',
} as const

export type HotelSearchRoomType = (typeof HotelSearchRoomType)[keyof typeof HotelSearchRoomType]

export const HotelSortBy = {
  PRICE: 'price',
  DISTANCE: 'distance',
  STAR_LEVEL: 'starLevel',
} as const

export type HotelSortBy = (typeof HotelSortBy)[keyof typeof HotelSortBy]

export const PoiCategory = {
  SCENIC: 'scenic',
  FOOD: 'food',
  ENTERTAINMENT: 'entertainment',
  TRAFFIC: 'traffic',
} as const

export type PoiCategory = (typeof PoiCategory)[keyof typeof PoiCategory]
