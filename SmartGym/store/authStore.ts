/**
 * store/authStore.ts
 *
 * Manages authentication state.
 * Listens to Supabase auth state changes and propagates to other stores.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '@/types/auth';

interface AuthStoreState {
  authUser: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  setAuthUser: (user: AuthUser | null) => void;
  clearAuthUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    immer((set) => ({
      authUser: null,
      isLoading: false,
      error: null,

      setAuthUser: (user) =>
        set((state) => {
          state.authUser = user;
          state.error = null;
        }),

      clearAuthUser: () =>
        set((state) => {
          state.authUser = null;
        }),

      setLoading: (loading) =>
        set((state) => { state.isLoading = loading; }),

      setError: (error) =>
        set((state) => { state.error = error; }),
    })),
    {
      name: 'smartgym-auth-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({ authUser: state.authUser }),
    }
  )
);

export const selectAuthUser = (s: AuthStoreState) => s.authUser;
export const selectIsAuthenticated = (s: AuthStoreState) => s.authUser !== null;
