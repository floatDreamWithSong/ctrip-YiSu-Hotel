import { z } from "zod";

export const RejectReasonTypeSchema = z.enum([
  "INFO_INCOMPLETE",
  "INFO_INACCURATE",
  "IMAGE_QUALITY",
  "PRICE_ABNORMAL",
  "DUPLICATE",
  "POLICY_VIOLATION",
  "OTHER",
]);

export const GetPendingHotelsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  merchantName: z.string().optional(),
});

export type GetPendingHotelsType = z.infer<typeof GetPendingHotelsSchema>;

export const RejectHotelSchema = z.object({
  rejectReason: RejectReasonTypeSchema,
  rejectDetail: z.string().max(1000).optional(),
});

export type RejectHotelType = z.infer<typeof RejectHotelSchema>;
