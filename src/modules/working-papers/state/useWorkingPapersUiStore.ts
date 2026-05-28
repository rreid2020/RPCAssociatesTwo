import { create } from 'zustand'

type WorkingPapersUiState = {
  selectedEngagementIds: string[]
  bulkTransitionStatus: string
  setBulkTransitionStatus: (value: string) => void
  resetSelection: () => void
  setSelectedEngagementIds: (ids: string[]) => void
}

export const useWorkingPapersUiStore = create<WorkingPapersUiState>((set) => ({
  selectedEngagementIds: [],
  bulkTransitionStatus: '',
  setBulkTransitionStatus: (value) => set({ bulkTransitionStatus: value }),
  resetSelection: () => set({ selectedEngagementIds: [], bulkTransitionStatus: '' }),
  setSelectedEngagementIds: (ids) => set({ selectedEngagementIds: ids })
}))

