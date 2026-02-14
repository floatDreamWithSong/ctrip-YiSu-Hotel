import z from 'zod'
import { pageQuerySchema } from './common'
import { PriceMode } from '../types/hotel'

export const hotelSearchRoomTypeSchema = z.enum(['HOTEL', 'HOURLY'])
export const hotelSortBySchema = z.enum(['price', 'distance', 'starLevel'])
export const poiCategorySchema = z.enum(['scenic', 'food', 'entertainment', 'traffic'])

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD')

export const mobileHomeBannerQuerySchema = z.object({
  city: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(10).default(3),
})

export const mobileHotelSearchQuerySchema = pageQuerySchema.extend({
  roomType: hotelSearchRoomTypeSchema.default('HOTEL'),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  keyword: z.string().trim().optional(),
  checkIn: dateSchema.optional(),
  checkOut: dateSchema.optional(),
  targetDate: dateSchema.optional(),
  guestCount: z.coerce.number().int().min(1).default(1),
  roomCount: z.coerce.number().int().min(1).default(1),
  slotId: z.coerce.number().int().positive().optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  starLevels: z.string().trim().optional(), // CSV, e.g. "3,4,5"
  tagIds: z.string().trim().optional(), // CSV, e.g. "1,2,3"
  distanceKm: z.coerce.number().positive().optional(),
  sortBy: hotelSortBySchema.default('price'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  userLng: z.coerce.number().optional(),
  userLat: z.coerce.number().optional(),
})

export const mobileHotelListItemSchema = z.object({
  hotelId: z.number().int().positive(),
  infoId: z.number().int().positive(),
  name: z.string(),
  enName: z.string().nullable(),
  starLevel: z.number().int().min(1).max(5),
  city: z.string().nullable(),
  district: z.string().nullable(),
  address: z.string(),
  coverImage: z.string().nullable(),
  minPrice: z.number().nullable(),
  distanceMeters: z.number().nullable(),
  tags: z.array(z.string()),
  hasHourlyRoom: z.boolean(),
})

export const mobileHotelSearchResponseSchema = z.object({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  items: z.array(mobileHotelListItemSchema),
})

export const mobileHourlyRoomSlotSchema = z.object({
  id: z.number().int().positive(),
  startTime: z.string(), // HH:mm
  endTime: z.string(), // HH:mm
})

export const mobileRoomTypeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  count: z.number().int().min(0),
  price: z.number().nonnegative(),
  priceMode: z.enum([PriceMode.PER_NIGHT, PriceMode.PER_HOUR]),
  duration: z.number().int().min(1),
  bedType: z.string().nullable(),
  maxGuests: z.number().int().min(1),
  area: z.number().nullable(),
  imageUrl: z.string().nullable(),
  sortOrder: z.number().int().min(0),
  slots: z.array(mobileHourlyRoomSlotSchema),
})

export const mobileHotelDetailResponseSchema = z.object({
  hotelId: z.number().int().positive(),
  infoId: z.number().int().positive(),
  name: z.string(),
  enName: z.string().nullable(),
  starLevel: z.number().int().min(1).max(5),
  phone: z.string().nullable(),
  description: z.string().nullable(),
  province: z.string().nullable(),
  city: z.string().nullable(),
  district: z.string().nullable(),
  address: z.string(),
  location: z
    .object({
      lng: z.number(),
      lat: z.number(),
    })
    .nullable(),
  openedAt: z.string().nullable(),
  images: z.array(
    z.object({
      id: z.number().int().positive(),
      url: z.string(),
      sortOrder: z.number().int().min(0),
      caption: z.string().nullable(),
    }),
  ),
  tags: z.array(z.string()),
  roomTypes: z.array(mobileRoomTypeSchema),
})

export const mobileNearbyHotelsQuerySchema = z.object({
  hotelId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
  radiusKm: z.coerce.number().positive().max(20).default(5),
  roomType: hotelSearchRoomTypeSchema.default('HOTEL'),
  guestCount: z.coerce.number().int().min(1).default(1),
  roomCount: z.coerce.number().int().min(1).default(1),
  userLng: z.coerce.number().optional(),
  userLat: z.coerce.number().optional(),
})

export const mobileNearbyPoisQuerySchema = z.object({
  hotelId: z.coerce.number().int().positive(),
  categories: z.string().trim().optional(), // CSV scenic,food,entertainment
  radiusMeters: z.coerce.number().int().positive().max(10000).default(3000),
  limitPerCategory: z.coerce.number().int().min(1).max(20).default(8),
})

export const mobilePoiItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  location: z.string().nullable(),
  distance: z.number().nullable(),
  category: poiCategorySchema,
})

export const mobileNearbyPoisResponseSchema = z.object({
  scenic: z.array(mobilePoiItemSchema),
  food: z.array(mobilePoiItemSchema),
  entertainment: z.array(mobilePoiItemSchema),
  traffic: z.array(mobilePoiItemSchema),
})

export const mobileHotelTagListResponseSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    name: z.string(),
    category: z.string(),
    icon: z.string().nullable(),
  }),
)
