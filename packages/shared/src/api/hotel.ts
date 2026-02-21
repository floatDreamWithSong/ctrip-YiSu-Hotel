import z from 'zod'
import {
  adminReviewActionSchema,
  adminReviewQuerySchema,
  hotelCreateSchema,
  hotelInfoCreateSchema,
  hotelInfoQuerySchema,
  hotelInfoUpdateSchema,
  hotelQuerySchema,
  hotelUpdateHomeAdSchema,
  reviewRecordQuerySchema,
} from '../schema/hotel'

export const ApiHotelSchemas = {
  hotelQuery: hotelQuerySchema,
  hotelCreate: hotelCreateSchema,
  hotelUpdateHomeAd: hotelUpdateHomeAdSchema,
  hotelInfoQuery: hotelInfoQuerySchema,
  hotelInfoCreate: hotelInfoCreateSchema,
  hotelInfoUpdate: hotelInfoUpdateSchema,
  adminReviewQuery: adminReviewQuerySchema,
  adminReviewAction: adminReviewActionSchema,
  reviewRecordQuery: reviewRecordQuerySchema,
}

export type ApiHotelTypes = {
  [key in keyof typeof ApiHotelSchemas as `${Capitalize<key>}`]: z.infer<(typeof ApiHotelSchemas)[key]>
}
