import { request } from "../request";
import type { GetHotelsType, GetReviewRecordsType, RejectHotelType } from "@yisu/shared";

// These response types can be fleshed out later or imported from a shared types file
interface HotelsResponse {
  items: any[];
  total: number;
}
interface ReviewRecordsResponse {
  items: any[];
  total: number;
}
interface HotelDetailResponse {
  currentVersion: any;
  previousVersion?: any;
  merchant: any;
}

export const hotelApi = {
  getHotels: (params: GetHotelsType) =>
    request<HotelsResponse>({
      url: "/admin/hotels",
      method: 'GET',
      params
    }),

  getReviewRecords: (params: GetReviewRecordsType) =>
    request<ReviewRecordsResponse>({
      url: "/admin/review-records",
      method: 'GET',
      params
    }),

  getHotelDetail: (versionId: number) =>
    request<HotelDetailResponse>({
      url: `/admin/${versionId}/detail`,
      method: 'GET'
    }),

  approveHotel: (versionId: number) =>
    request<void>({
      url: `/admin/${versionId}/approve`,
      method: 'POST'
    }),

  rejectHotel: (versionId: number, data: RejectHotelType) =>
    request<void>({
      url: `/admin/${versionId}/reject`,
      method: 'POST',
      data
    }),

  getReviewHistory: (hotelId: number) =>
    request<any[]>({
      url: `/admin/${hotelId}/review-history`,
      method: 'GET'
    }),

  getRejectReasons: () =>
    request<Array<{ value: string; label: string }>>({
      url: "/admin/reject-reasons",
      method: 'GET'
    }),
};
