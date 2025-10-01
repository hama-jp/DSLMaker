/**
 * Dify DSL Validation
 * Client-side validation helpers
 */

import { DifyDSL } from '@/types'

export function validateDifyDSL(dsl: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check required fields
  if (!dsl.app) {
    errors.push('Missing required field: app')
  }
  if (!dsl.app?.name) {
    errors.push('Missing required field: app.name')
  }
  if (!dsl.app?.mode) {
    errors.push('Missing required field: app.mode')
  }

  // Check version
  if (dsl.version && dsl.version !== '0.4.0') {
    errors.push(`Unsupported version: ${dsl.version} (expected 0.4.0)`)
  }

  // Check workflow structure for workflow modes
  if (dsl.app?.mode === 'workflow' || dsl.app?.mode === 'advanced-chat') {
    if (!dsl.workflow) {
      errors.push('Missing required field: workflow')
    }
    if (!dsl.workflow?.graph) {
      errors.push('Missing required field: workflow.graph')
    }
    if (!Array.isArray(dsl.workflow?.graph?.nodes)) {
      errors.push('workflow.graph.nodes must be an array')
    }
    if (!Array.isArray(dsl.workflow?.graph?.edges)) {
      errors.push('workflow.graph.edges must be an array')
    }
  }

  // Check model_config for chat modes
  if (dsl.app?.mode === 'chat' || dsl.app?.mode === 'agent-chat') {
    if (!dsl.model_config) {
      errors.push('Missing required field: model_config')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
