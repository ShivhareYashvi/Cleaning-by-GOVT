import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User } from '../lib/types';

export const SESSION_STORAGE_KEY = 'ecosync-session';

type SessionState = {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null })
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export function getSessionToken(): string | null {
  return useSessionStore.getState().token;
}
