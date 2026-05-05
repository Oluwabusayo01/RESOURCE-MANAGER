import { create } from 'zustand'
import type { Resource } from '../types'

interface ResourceState {
  resources: Resource[]
  loading: boolean
  setResources: (resources: Resource[]) => void
  setLoading: (loading: boolean) => void
}

export const useResourceStore = create<ResourceState>((set) => ({
  resources: [],
  loading: false,
  setResources: (resources) => set({ resources }),
  setLoading: (loading) => set({ loading }),
}))
