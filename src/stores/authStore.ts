import { create } from 'zustand'
import { api } from '../services/api'

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  init: () => {
    const token = localStorage.getItem('token')
    if (token) {
      api.setToken(token)
      // In a real app, you'd verify the token with the server
      // For now, we'll just keep it
    }
  },

  login: async (email, password, turnstileToken) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.login(email, password, turnstileToken)
      if (res.success) {
        localStorage.setItem('token', res.data.token)
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
        localStorage.setItem('token', res.data.token)
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
    localStorage.removeItem('token')
    api.setToken(null)
    set({ user: null, token: null, error: null })
  },
}))
