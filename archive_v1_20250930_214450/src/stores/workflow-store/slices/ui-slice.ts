import { UISlice, WorkflowSliceCreator } from '../types'

export const createUISlice: WorkflowSliceCreator<UISlice> = (set) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  isDirty: false,

  selectNode: (id) => {
    set((state) => {
      state.selectedNodeId = id
      state.selectedEdgeId = null
    })
  },

  selectEdge: (id) => {
    set((state) => {
      state.selectedEdgeId = id
      state.selectedNodeId = null
    })
  },

  clearSelection: () => {
    set((state) => {
      state.selectedNodeId = null
      state.selectedEdgeId = null
    })
  },

  applyAISuggestion: (suggestionData) => {
    console.log('Applying AI suggestion:', suggestionData)
  },
})
