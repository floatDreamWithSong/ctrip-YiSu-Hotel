/**
 * 酒店 API 响应类型定义
 * 这些类型对应后端 API 的实际返回数据结构
 */

import type { HotelReviewStatus, PriceMode, RejectReasonType } from './hotel'

/**
 * 分页结果通用结构
 */
export interface PaginatedResult<T> {
  total: number
  page: number
  limit: number
  items: T[]
}

/**
 * 位置信息
 */
export interface Location {
  lng: number
  lat: number
}

/**
 * 图片信息
 */
export interface HotelImage {
  id: number
  url: string
  sortOrder: number
  caption?: string
}

/**
 * 房型信息
 */
export interface RoomType {
  id: number
  name: string
  count: number
  price: number
  priceMode: PriceMode
  bedType?: string
  maxGuests: number
  area?: number
  imageUrl?: string
  sortOrder: number
}

/**
 * 用户基本信息
 */
export interface UserBasicInfo {
  id: number
  username: string
  email: string
}

/**
 * 商家基本信息
 */
export interface MerchantBasicInfo {
  id: number
  username: string
  email: string
}

/**
 * 酒店基本信息（用于列表展示）
 */
export interface HotelBasicInfo {
  id: number
  hotelNickname: string
}

/**
 * 酒店信息列表项（商家端）
 */
export interface MerchantHotelItem {
  id: number
  hotelNickname: string
  isHomeAdEnabled: boolean
  publishedInfoId: number | null
  publishedInfo: {
    id: number
    infoNickname: string
    name: string
    reviewStatus: HotelReviewStatus
  } | null
  _count: {
    infos: number
  }
  createdAt: string
  updatedAt: string
}

/**
 * 酒店详情（商家端）
 */
export interface MerchantHotelDetail {
  id: number
  hotelNickname: string
  isHomeAdEnabled: boolean
  merchantId: number
  publishedInfoId: number | null
  createdAt: string
  updatedAt: string
  infoCount: number
}

/**
 * 酒店信息列表项（商家端）
 */
export interface HotelInfoItem {
  id: number
  infoNickname: string
  name: string
  reviewStatus: HotelReviewStatus
  starLevel?: number
  address?: string
  createdAt: string
  updatedAt: string
}

/**
 * 酒店信息详情
 */
export interface HotelInfoDetail {
  id: number
  hotelId: number
  infoNickname: string
  name: string
  enName?: string
  starLevel: number
  phone?: string
  description?: string
  province?: string
  city?: string
  district?: string
  address: string
  openedAt?: string
  homeAdImage?: string
  reviewStatus: HotelReviewStatus
  images: HotelImage[]
  roomTypes: RoomType[]
  tags: string[]
  location: Location | null
  createdAt?: string
  updatedAt?: string
}

/**
 * 审核信息列表项（管理员端）
 */
export interface AdminReviewHotelInfoItem {
  id: number
  infoNickname: string
  name: string
  reviewStatus: HotelReviewStatus
  createdAt: string
  updatedAt: string
  hotel: {
    id: number
    hotelNickname: string
    merchant: {
      user: UserBasicInfo
    }
  }
}

/**
 * 审核信息详情（管理员端）
 */
export interface AdminReviewHotelInfoDetail extends HotelInfoDetail {
  hotel: {
    id: number
    hotelNickname: string
    merchant: MerchantBasicInfo
  }
  reviewRecords?: ReviewRecordItem[]
}

/**
 * 审核记录项
 */
export interface ReviewRecordItem {
  id: number
  action: HotelReviewStatus
  rejectReason: RejectReasonType | null
  rejectDetail: string | null
  createdAt: string
  reviewer: UserBasicInfo
  hotel: HotelBasicInfo
  info: {
    id: number
    infoNickname: string
    name: string
  }
}

/**
 * 审核操作结果
 */
export interface ReviewActionResult {
  success: boolean
  message?: string
}
