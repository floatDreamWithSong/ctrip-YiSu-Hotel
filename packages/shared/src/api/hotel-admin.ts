import { GetHotelsSchema, RejectHotelSchema, GetReviewRecordsSchema, RejectReasonTypeSchema } from "../schema";
import z from "zod";

export const ApiHotelAdminSchemas = {
  GetHotelsSchema,
  RejectHotelSchema,
  GetReviewRecordsSchema,
  RejectReasonTypeSchema
}

export type ApiHotelAdminTypes = {
  [key in keyof typeof ApiHotelAdminSchemas as `${Capitalize<key>}`]: z.infer<typeof ApiHotelAdminSchemas[key]>
};
