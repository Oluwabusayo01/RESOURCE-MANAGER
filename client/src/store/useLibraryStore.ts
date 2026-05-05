import { create } from 'zustand'
import type { LibraryMaterial } from '../types'

interface LibraryState {
  materials: LibraryMaterial[]
  loading: boolean
  setMaterials: (materials: LibraryMaterial[]) => void
  setLoading: (loading: boolean) => void
}

export const useLibraryStore = create<LibraryState>((set) => ({
  materials: [],
  loading: false,
  setMaterials: (materials) => set({ materials }),
  setLoading: (loading) => set({ loading }),
}))
