import z from 'zod'
import { HotelReviewStatus, PriceMode, RejectReasonType } from '../types/hotel'
import { pageQuerySchema } from './common'

export const reviewStatusSchema = z.enum(HotelReviewStatus)
export const rejectReasonTypeSchema = z.enum(RejectReasonType)
export const priceModeSchema = z.enum(PriceMode)
const merchantReviewStatusFilterSchema = z.enum([
  HotelReviewStatus.DRAFT,
  HotelReviewStatus.PENDING,
  HotelReviewStatus.APPROVED,
  HotelReviewStatus.REJECTED,
])
const adminReviewStatusFilterSchema = z.enum([
  HotelReviewStatus.PENDING,
  HotelReviewStatus.APPROVED,
  HotelReviewStatus.REJECTED,
])

export const hotelQuerySchema = pageQuerySchema.extend({
  keyword: z.string().trim().optional(),
})

export const hotelCreateSchema = z.object({
  hotelNickname: z.string().trim().min(1, '酒店昵称不能为空').max(64, '酒店昵称最多64个字符'),
})

export const hotelUpdateHomeAdSchema = z.object({
  isHomeAdEnabled: z.boolean(),
})

export const imageInputSchema = z.object({
  url: z.url('图片链接格式不正确'),
  sortOrder: z.number().int().min(0),
  caption: z.string().trim().max(200).optional(),
})

export const roomTypeInputSchema = z.object({
  name: z.string().trim().min(1, '房型名称不能为空').max(64),
  count: z.number().int().min(0),
  price: z.number().nonnegative(),
  priceMode: priceModeSchema.default(PriceMode.PER_NIGHT),
  bedType: z.string().trim().max(64).optional(),
  maxGuests: z.number().int().min(1),
  area: z.number().nonnegative().optional(),
  imageUrl: z.url('房型图片链接格式不正确').optional(),
  sortOrder: z.number().int().min(0),
})

export const locationInputSchema = z.object({
  lng: z.number(),
  lat: z.number(),
})

export const hotelInfoCreateSchema = z.object({
  infoNickname: z.string().trim().min(1, '信息昵称不能为空').max(64),
  name: z.string().trim().min(1, '酒店名称不能为空').max(128),
  enName: z.string().trim().max(128).optional(),
  starLevel: z.number().int().min(1).max(5),
  phone: z.string().trim().max(32).optional(),
  description: z.string().trim().max(2000).optional(),
  province: z.string().trim().max(64).optional(),
  city: z.string().trim().max(64).optional(),
  district: z.string().trim().max(64).optional(),
  address: z.string().trim().min(1, '详细地址不能为空').max(256),
  location: locationInputSchema.optional(),
  openedAt: z.iso.datetime().optional(),
  homeAdImage: z.url('首页广告图链接格式不正确').optional(),
  tags: z.array(z.string().trim().min(1).max(32)).default([]),
  images: z.array(imageInputSchema).default([]),
  roomTypes: z.array(roomTypeInputSchema).default([]),
})

export const hotelInfoUpdateSchema = hotelInfoCreateSchema

export const hotelInfoQuerySchema = pageQuerySchema.extend({
  reviewStatus: merchantReviewStatusFilterSchema.optional(),
})

export const adminReviewQuerySchema = pageQuerySchema.extend({
  reviewStatus: adminReviewStatusFilterSchema.optional(),
})

export const reviewRecordQuerySchema = pageQuerySchema.extend({
  startAt: z.iso.datetime().optional(),
  endAt: z.iso.datetime().optional(),
  action: reviewStatusSchema.optional(),
  rejectReason: rejectReasonTypeSchema.optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const adminReviewActionSchema = z
  .object({
    action: z.enum([HotelReviewStatus.APPROVED, HotelReviewStatus.REJECTED]),
    rejectReason: rejectReasonTypeSchema.optional(),
    rejectDetail: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === HotelReviewStatus.REJECTED && !value.rejectReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rejectReason'],
        message: '拒绝审核时必须填写拒绝原因',
      })
    }
    if (value.rejectReason && value.rejectReason !== RejectReasonType.OTHER && value.rejectDetail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rejectDetail'],
        message: '仅当拒绝原因为 OTHER 时可填写备注',
      })
    }
  })
