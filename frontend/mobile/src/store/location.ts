import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LocationState {
  city?: string;
  address?: string;
  location?: {
    lng: number;
    lat: number;
  };
  updateLocation: (data: {
    city?: string;
    address?: string;
    location?: { lng: number; lat: number };
  }) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      city: undefined,
      address: undefined,
      location: undefined,
      updateLocation: (data) => {
        set((state) => ({
          ...state,
          ...data,
        }));
      },
      clearLocation: () => {
        set({
          city: undefined,
          address: undefined,
          location: undefined,
        });
      },
    }),
    {
      name: 'location-storage',
    },
  ),
);
