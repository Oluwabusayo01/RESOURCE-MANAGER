import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

const getInitialUser = (): User | null => {
  const user = localStorage.getItem('rm_user')
  if (!user) return null
  try {
    const parsed = JSON.parse(user) as any
    if (parsed && !parsed.id && parsed._id) {
      parsed.id = parsed._id
    }
    return parsed as User
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  token: localStorage.getItem('rm_token') || null,
  setUser: (user) => {
    if (user) {
      const u = user as any
      if (!u.id && u._id) {
        u.id = u._id
      }
      localStorage.setItem('rm_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('rm_user')
    }
    set({ user })
  },
  setToken: (token) => {
    if (token) {
      localStorage.setItem('rm_token', token)
    } else {
      localStorage.removeItem('rm_token')
    }
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('rm_token')
    localStorage.removeItem('rm_user')
    set({ user: null, token: null })
  },
}))
