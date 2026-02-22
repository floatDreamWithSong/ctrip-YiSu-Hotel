import { create } from 'zustand'

export type RoomTypeTab = 'HOTEL' | 'HOURLY'

export interface HotelSearchState {
  roomType: RoomTypeTab
  keyword: string
  checkIn?: string
  checkOut?: string
  targetDate?: string
  guestCount: number
  roomCount: number
  slotId?: number
  priceMin?: number
  priceMax?: number
  starLevels: number[]
  tagIds: number[]
  setState: (
    next: Partial<Omit<HotelSearchState, 'setState' | 'reset'>>,
  ) => void
  reset: () => void
}

const initialState: Omit<HotelSearchState, 'setState' | 'reset'> = {
  roomType: 'HOTEL',
  keyword: '',
  checkIn: undefined,
  checkOut: undefined,
  targetDate: undefined,
  guestCount: 1,
  roomCount: 1,
  slotId: undefined,
  priceMin: undefined,
  priceMax: undefined,
  starLevels: [],
  tagIds: [],
}

export const useHotelSearchStore = create<HotelSearchState>((set) => ({
  ...initialState,
  setState: (next) =>
    set((state) => ({
      ...state,
      ...next,
    })),
  reset: () =>
    set({
      ...initialState,
    }),
}))
