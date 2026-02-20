import { create } from 'zustand'
import { authApi } from '../api/auth.api'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,

  login: async (credentials) => {
    const { data } = await authApi.login(credentials)
    localStorage.setItem('token', data.token)
    set({ token: data.token, user: data.user })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null })
  },
}))