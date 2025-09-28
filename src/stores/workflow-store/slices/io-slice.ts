import { parseWorkflowDSLContent } from '@/utils/workflow-state-helpers'
import { IOSlice, WorkflowSliceCreator } from '../types'
import { performanceMonitor, monitorOperation } from '@/utils/performance-monitor'

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

      // Monitor DSL parsing performance
      const { result: parsed, metrics } = await monitorOperation(
        'dsl-parsing',
        async () => {
          return await parseWorkflowDSLContent(dslContent)
        },
        (() => {
          // Try to parse content for workflow data analysis
          try {
            return JSON.parse(dslContent)
          } catch {
            // If not JSON, return a basic structure for YAML
            return { workflow: { graph: { nodes: [], edges: [] } } }
          }
        })()
      )

      console.log('🔧 importDSL: Parsed workflow:', {
        nodeCount: parsed.nodes.length,
        edgeCount: parsed.edges.length,
      })

      // Log DSL parsing performance metrics
      console.log('📊 DSL Parsing Performance:')
      console.log(`├─ Parse Duration: ${metrics.timing.duration?.toFixed(2)}ms`)
      console.log(`├─ Memory Usage: ${(metrics.memoryUsage.used / 1024 / 1024).toFixed(2)}MB`)
      console.log(`├─ Input Size: ${(dslContent.length / 1024).toFixed(1)}KB`)
      console.log(`├─ Complexity Score: ${metrics.workflowStats.complexityScore}`)
      console.log(`└─ Nodes/Edges: ${parsed.nodes.length}/${parsed.edges.length}`)

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

      // Monitor DSL generation performance
      const { result: yamlContent, metrics } = await monitorOperation(
        'dsl-generation',
        async () => {
          const { generateDSL } = await import('@/utils/dsl-generator')
          return generateDSL(dslFile, {
            includeComments: true,
            validateBeforeGenerate: true,
          })
        },
        dslFile
      )

      // Log DSL generation performance metrics
      console.log('📊 DSL Generation Performance:')
      console.log(`├─ Generation Duration: ${metrics.timing.duration?.toFixed(2)}ms`)
      console.log(`├─ Memory Usage: ${(metrics.memoryUsage.used / 1024 / 1024).toFixed(2)}MB`)
      console.log(`├─ Output Size: ${(yamlContent.length / 1024).toFixed(1)}KB`)
      console.log(`├─ Complexity Score: ${metrics.workflowStats.complexityScore}`)
      console.log(`└─ Workflow Nodes: ${metrics.workflowStats.nodeCount}`)

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
