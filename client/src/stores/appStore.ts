import { create } from 'zustand'

interface AppState {
  selectedUserMotoId: number | null
  setSelectedUserMotoId: (id: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedUserMotoId: null,
  setSelectedUserMotoId: (id) => set({ selectedUserMotoId: id }),
}))
