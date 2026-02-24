export type ClientMessage =
  | { type: 'auth'; token?: string }
  | { type: 'sync_viewing_hotels'; hotelIds?: number[] }

export type HotelDetailRealtimeEvent = { type: 'hotel_info_updated'; hotelId: number; infoId: number }

export type ServerMessage =
  | { type: 'authed' }
  | { type: 'error'; message: string }
  | HotelDetailRealtimeEvent