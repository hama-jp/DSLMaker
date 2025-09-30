import { NODE_TYPES } from '@/constants/node-types'
import { ValidationSlice, WorkflowSliceCreator } from '../types'
import { ValidationError, ValidationResult } from '@/types/dify-workflow'
import { lintDSL } from '@/utils/dsl-linter'
import { parseDSL } from '@/utils/dsl-parser'

export const createValidationSlice: WorkflowSliceCreator<ValidationSlice> = (set, get) => ({
  validationResult: null,
  isValidating: false,

  validateWorkflow: async () => {
    set((state) => {
      state.isValidating = true
    })

    try {
      const { dslFile, exportDSL } = get()
      const errors: ValidationError[] = []
      const warnings: ValidationError[] = []

      // If we have a DSL file, use comprehensive linting
      if (dslFile) {
        try {
          console.log('🔍 Running comprehensive DSL validation...')

          // Run comprehensive linting
          const lintResult = lintDSL(dslFile)

          // Convert lint errors to validation format
          lintResult.errors.forEach(error => {
            errors.push({
              type: 'error',
              code: error.code,
              message: error.message,
              nodeId: error.nodeId,
              edgeId: error.edgeId,
            })
          })

          // Convert lint warnings to validation format
          lintResult.warnings.forEach(warning => {
            warnings.push({
              type: 'warning',
              code: warning.code,
              message: warning.message,
              nodeId: warning.nodeId,
              edgeId: warning.edgeId,
            })
          })

          console.log(`✅ DSL validation complete: ${errors.length} errors, ${warnings.length} warnings`)
        } catch (lintError) {
          console.error('❌ DSL linting failed:', lintError)
          errors.push({
            type: 'error',
            code: 'LINT_ERROR',
            message: `Validation failed: ${lintError instanceof Error ? lintError.message : 'Unknown error'}`,
          })
        }
      } else {
        // Fallback to basic validation if no DSL file
        try {
          console.log('🔍 Running basic workflow validation (no DSL file available)...')

          // Export current workflow to DSL for validation
          const yamlContent = await exportDSL()
          const parseResult = parseDSL(yamlContent)

          if (parseResult.success && parseResult.workflow) {
            // Run comprehensive linting on exported workflow
            const lintResult = lintDSL(parseResult.workflow)

            // Convert lint results
            lintResult.errors.forEach(error => {
              errors.push({
                type: 'error',
                code: error.code,
                message: error.message,
                nodeId: error.nodeId,
                edgeId: error.edgeId,
              })
            })

            lintResult.warnings.forEach(warning => {
              warnings.push({
                type: 'warning',
                code: warning.code,
                message: warning.message,
                nodeId: warning.nodeId,
                edgeId: warning.edgeId,
              })
            })
          } else {
            // DSL parsing failed, add parse errors
            parseResult.errors.forEach(error => {
              errors.push({
                type: 'error',
                code: 'PARSE_ERROR',
                message: error,
              })
            })
          }
        } catch (exportError) {
          console.error('❌ Export-based validation failed:', exportError)
          errors.push({
            type: 'error',
            code: 'EXPORT_ERROR',
            message: `Could not export workflow for validation: ${exportError instanceof Error ? exportError.message : 'Unknown error'}`,
          })
        }
      }

      // Additional runtime checks that don't require DSL
      try {
        const { validateNodeConnections, detectInfiniteLoops } = await import('@/utils/flow-converter')
        const { nodes, edges } = get()

        const connectionValidation = validateNodeConnections(nodes, edges)
        if (!connectionValidation.isValid) {
          connectionValidation.errors.forEach(error => {
            errors.push({
              type: 'error',
              code: 'RUNTIME_CONNECTION_ERROR',
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
      } catch (runtimeError) {
        console.error('🔧 Runtime validation checks failed:', runtimeError)
        warnings.push({
          type: 'warning',
          code: 'RUNTIME_CHECK_FAILED',
          message: 'Some validation checks could not be performed',
        })
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
      }

      set((state) => {
        state.validationResult = result
      })

      console.log(`🎯 Validation complete: ${result.isValid ? 'VALID' : 'INVALID'} (${errors.length} errors, ${warnings.length} warnings)`)
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
