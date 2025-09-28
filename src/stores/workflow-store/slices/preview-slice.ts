import {
  createPreviewTransition,
  parseWorkflowDSLContent,
  restoreStateFromPreviewSnapshot,
} from '@/utils/workflow-state-helpers'
import { syncGraphReferences } from '../shared'
import { PreviewSlice, WorkflowSliceCreator } from '../types'

export const createPreviewSlice: WorkflowSliceCreator<PreviewSlice> = (set, get) => ({
  isPreviewing: false,
  activePreviewId: null,
  previewSnapshot: null,

  previewDSL: async (dslContent, previewId) => {
    try {
      const parsed = await parseWorkflowDSLContent(dslContent)

      const currentState = get()
      const { snapshot, nextDSLFile } = createPreviewTransition({
        currentState: {
          dslFile: currentState.dslFile,
          nodes: currentState.nodes,
          edges: currentState.edges,
          validationResult: currentState.validationResult,
          selectedNodeId: currentState.selectedNodeId,
          selectedEdgeId: currentState.selectedEdgeId,
          isDirty: currentState.isDirty,
          previewSnapshot: currentState.previewSnapshot,
          isPreviewing: currentState.isPreviewing,
        },
        parsed,
      })

      set((state) => {
        state.previewSnapshot = snapshot
        state.isPreviewing = true
        state.activePreviewId = previewId
        state.dslFile = nextDSLFile
        syncGraphReferences(state)
        state.selectedNodeId = null
        state.selectedEdgeId = null
        state.validationResult = null
        state.isDirty = false
        state.importError = null
      })
    } catch (error) {
      console.error('🔧 previewDSL: Error:', error)
      set((state) => {
        state.importError = error instanceof Error ? error.message : 'Unknown preview error'
      })
      throw error
    }
  },

  commitPreview: () => {
    const { isPreviewing } = get()
    if (!isPreviewing) return

    set((state) => {
      state.previewSnapshot = null
      state.isPreviewing = false
      state.activePreviewId = null
      state.isDirty = true
    })
  },

  discardPreview: () => {
    const { previewSnapshot, isPreviewing } = get()
    if (!isPreviewing || !previewSnapshot) return

    const restoredState = restoreStateFromPreviewSnapshot(previewSnapshot)

    set((state) => {
      state.dslFile = restoredState.dslFile
      if (state.dslFile) {
        syncGraphReferences(state)
      } else {
        state.nodes = restoredState.nodes
        state.edges = restoredState.edges
      }
      state.selectedNodeId = restoredState.selectedNodeId
      state.selectedEdgeId = restoredState.selectedEdgeId
      state.validationResult = restoredState.validationResult
      state.isDirty = restoredState.isDirty
      state.previewSnapshot = null
      state.isPreviewing = false
      state.activePreviewId = null
    })
  },
})
