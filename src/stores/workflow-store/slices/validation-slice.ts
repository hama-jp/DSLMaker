import { NODE_TYPES } from '@/constants/node-types'
import { ValidationSlice, WorkflowSliceCreator } from '../types'
import { ValidationError, ValidationResult } from '@/types/dify-workflow'

export const createValidationSlice: WorkflowSliceCreator<ValidationSlice> = (set, get) => ({
  validationResult: null,
  isValidating: false,

  validateWorkflow: async () => {
    set((state) => {
      state.isValidating = true
    })

    try {
      const { nodes, edges } = get()
      const errors: ValidationError[] = []
      const warnings: ValidationError[] = []

      const startNodes = nodes.filter(node => node.type === NODE_TYPES.START)
      const endNodes = nodes.filter(node => node.type === NODE_TYPES.END)

      if (startNodes.length === 0) {
        errors.push({
          type: 'error',
          code: 'NO_START_NODE',
          message: 'Workflow must have at least one Start node',
        })
      }

      if (startNodes.length > 1) {
        warnings.push({
          type: 'warning',
          code: 'MULTIPLE_START_NODES',
          message: 'Workflow has multiple Start nodes',
        })
      }

      if (endNodes.length === 0) {
        warnings.push({
          type: 'warning',
          code: 'NO_END_NODE',
          message: 'Workflow should have at least one End node',
        })
      }

      const connectedNodeIds = new Set<string>()
      edges.forEach(edge => {
        connectedNodeIds.add(edge.source)
        connectedNodeIds.add(edge.target)
      })

      nodes.forEach(node => {
        if (!connectedNodeIds.has(node.id) && node.type !== NODE_TYPES.START) {
          warnings.push({
            type: 'warning',
            code: 'DISCONNECTED_NODE',
            message: `Node "${node.data.title}" is not connected to the workflow`,
            nodeId: node.id,
          })
        }
      })

      try {
        const { validateNodeConnections, detectInfiniteLoops } = await import('@/utils/flow-converter')

        const connectionValidation = validateNodeConnections(nodes, edges)
        if (!connectionValidation.isValid) {
          connectionValidation.errors.forEach(error => {
            errors.push({
              type: 'error',
              code: 'INVALID_CONNECTION',
              message: error,
            })
          })
        }

        const loopDetection = detectInfiniteLoops(nodes, edges)
        if (loopDetection.hasLoops) {
          loopDetection.loops.forEach((loop, index) => {
            errors.push({
              type: 'error',
              code: 'INFINITE_LOOP',
              message: `Infinite loop detected: ${loop.join(' → ')}`,
              details: { loop, index },
            })
          })
        }
      } catch (error) {
        console.error('🔧 validateWorkflow: advanced checks failed', error)
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
      }

      set((state) => {
        state.validationResult = result
      })
      return result
    } finally {
      set((state) => {
        state.isValidating = false
      })
    }
  },

  setValidationResult: (result) => {
    set((state) => {
      state.validationResult = result
    })
  },
})
