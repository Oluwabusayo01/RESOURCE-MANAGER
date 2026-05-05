import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => {
    localStorage.removeItem('rm_token')
    localStorage.removeItem('rm_user')
    set({ user: null, token: null })
  },
}))
