'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { api } from '@/lib/api-client'

interface User {
  id: string
  email: string
  nickname: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null

  login: (email: string, password: string, turnstileToken?: string) => Promise<boolean>
  register: (email: string, password: string, nickname?: string, turnstileToken?: string) => Promise<boolean>
  logout: () => void
  init: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      init: () => {
        const token = get().token
        if (token) {
          api.setToken(token)
        }
      },

      login: async (email, password, turnstileToken) => {
        set({ isLoading: true, error: null })
        try {
          const res = await api.login(email, password, turnstileToken)
          if (res.success) {
            api.setToken(res.data.token)
            set({ user: res.data.user, token: res.data.token, isLoading: false })
            return true
          }
          return false
        } catch (err: any) {
          set({ error: err.message || '登录失败', isLoading: false })
          return false
        }
      },

      register: async (email, password, nickname, turnstileToken) => {
        set({ isLoading: true, error: null })
        try {
          const res = await api.register(email, password, nickname, turnstileToken)
          if (res.success) {
            api.setToken(res.data.token)
            set({ user: res.data.user, token: res.data.token, isLoading: false })
            return true
          }
          return false
        } catch (err: any) {
          set({ error: err.message || '注册失败', isLoading: false })
          return false
        }
      },

      logout: () => {
        api.setToken(null)
        set({ user: null, token: null, error: null })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      skipHydration: true,
    }
  )
)
