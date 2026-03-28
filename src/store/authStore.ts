/**
 * Auth Store (Zustand + persist)
 *
 * FIXES APPLIED:
 *  BUG-07 – Tokens were stored in TWO places simultaneously:
 *            1. Zustand's `persist` middleware → localStorage key "auth-storage"
 *            2. Manual `localStorage.setItem('accessToken', ...)` calls
 *
 *            This created confusion because the tokens were redundant, and any
 *            code that read from `localStorage.getItem('accessToken')` (e.g.
 *            the Axios interceptor) was bypassing Zustand entirely.
 *
 *            FIX:
 *              • The store continues to persist { user, isAuthenticated } via
 *                Zustand's persist middleware (unchanged — avoids flash on reload).
 *              • Tokens are stored ONLY in localStorage under their own keys
 *                ('accessToken', 'refreshToken') — exactly as the Axios
 *                interceptor already expects.  The store itself no longer
 *                duplicates them inside the Zustand state slice.
 *              • The `partialize` option explicitly excludes tokens from the
 *                Zustand persist payload so they are not serialised twice.
 *
 *            Net result: one source of truth per token; no redundancy.
 */

import { create } from 'zustand'
import { persist }  from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user:            User | null
  isAuthenticated: boolean
  // Tokens are NOT kept in Zustand state — they live in localStorage directly
  // so the Axios interceptor can read them without coupling to the store.
  setAuth:    (user: User, accessToken: string, refreshToken: string) => void
  updateUser: (user: Partial<User>) => void
  clearAuth:  () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        // BUG-07 FIX: tokens go ONLY to localStorage; not duplicated in Zustand state
        localStorage.setItem('accessToken',  accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, isAuthenticated: true })
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      clearAuth: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      // BUG-07 FIX: only persist user identity, never tokens
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
