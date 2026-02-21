import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Realm } from '@yisu/shared';

interface UserState {
  id: number | null;
  username: string | null;
  email: string | null;
  realm: Realm | null;
  setUser: (user: Partial<UserState>) => void;
  clearUser: () => void;
}

const initialState = {
  id: null,
  username: null,
  email: null,
  realm: null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => set((state) => ({ ...state, ...user })),
      clearUser: () => set({ ...initialState }),
    }),
    {
      name: 'user-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);
