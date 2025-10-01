/**
 * Custom Node Components for Dify Workflow
 * Exports all custom node types and configuration
 */

import { NodeTypes } from '@xyflow/react'
import { DIFY_NODE_COMPONENTS } from './dify'
import { GenericNode } from './GenericNode'

/**
 * React Flow node types mapping
 * Maps Dify node types to React Flow custom components
 * Now using complete Dify-style components (15 types)
 */
export const nodeTypes: NodeTypes = {
  // All 15 Dify node types
  ...DIFY_NODE_COMPONENTS,

  // Legacy aliases for backward compatibility
  'knowledge-retrieval': GenericNode,
  'parameter-extractor': GenericNode,
  'conversation-variable-assigner': DIFY_NODE_COMPONENTS.assigner,

  // Default fallback
  default: GenericNode,
}

/**
 * Get React Flow node type for a Dify node type
 * Returns the node type string to use in React Flow
 */
export function getNodeType(difyNodeType: string): string {
  // All supported Dify node types
  const supportedTypes = [
    'start', 'end', 'llm', 'if-else', 'code', 'iteration',
    'tool', 'answer', 'template-transform', 'http-request',
    'question-classifier', 'assigner', 'variable-aggregator',
    'document-extractor', 'knowledge-retrieval', 'parameter-extractor',
    'conversation-variable-assigner'
  ]

  // Check if we have a specific component for this type
  if (supportedTypes.includes(difyNodeType)) {
    return difyNodeType
  }

  // Default fallback
  return 'default'
}

// Re-export Dify node components
export * from './dify'
export { GenericNode } from './GenericNode'

// Re-export legacy nodes for backward compatibility
export { StartNode } from './StartNode'
export { EndNode } from './EndNode'
export { LLMNode } from './LLMNode'
export { IfElseNode } from './IfElseNode'
export { CodeNode } from './CodeNode'
export { HttpRequestNode } from './HttpRequestNode'
export { IterationNode } from './IterationNode'
export { BaseNode } from './BaseNode'
export type { BaseNodeData, BaseNodeProps } from './BaseNode'
