import { create } from 'zustand'
import { authApi } from '../api/auth.api'

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user:  JSON.parse(localStorage.getItem('user') || 'null'),

  register: async (credentials) => {
    await authApi.register(credentials)
    const { data } = await authApi.login({ login: credentials.email, password: credentials.password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    set({ token: data.token, user: data.user })
  },

  login: async (credentials) => {
    const { data } = await authApi.login(credentials)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    set({ token: data.token, user: data.user })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },
}))