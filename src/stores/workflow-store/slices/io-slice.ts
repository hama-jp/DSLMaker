import { parseWorkflowDSLContent } from '@/utils/workflow-state-helpers'
import { IOSlice, WorkflowSliceCreator } from '../types'

export const createIOSlice: WorkflowSliceCreator<IOSlice> = (set, get) => ({
  isImporting: false,
  isExporting: false,
  importError: null,
  exportError: null,

  importDSL: async (dslContent: string) => {
    set((state) => {
      state.isImporting = true
      state.importError = null
    })

    try {
      console.log('🔧 importDSL: Starting import, content length:', dslContent.length)

      const parsed = await parseWorkflowDSLContent(dslContent)

      console.log('🔧 importDSL: Parsed workflow:', {
        nodeCount: parsed.nodes.length,
        edgeCount: parsed.edges.length,
      })

      get().loadDSLFile(parsed.workflow)

      set((state) => {
        state.isImporting = false
      })
    } catch (error) {
      console.error('🔧 importDSL: Error:', error)
      set((state) => {
        state.importError = error instanceof Error ? error.message : 'Unknown import error'
        state.isImporting = false
      })
      throw error
    }
  },

  exportDSL: async () => {
    set((state) => {
      state.isExporting = true
      state.exportError = null
    })

    try {
      const { dslFile } = get()
      if (!dslFile) {
        throw new Error('No workflow to export')
      }

      const { generateDSL } = await import('@/utils/dsl-generator')
      const yamlContent = generateDSL(dslFile, {
        includeComments: true,
        validateBeforeGenerate: true,
      })

      set((state) => {
        state.isExporting = false
      })
      return yamlContent
    } catch (error) {
      set((state) => {
        state.exportError = error instanceof Error ? error.message : 'Unknown export error'
        state.isExporting = false
      })
      throw error
    }
  },
})
