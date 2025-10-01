/**
 * Custom Node Components for Dify Workflow
 * Exports all custom node types and configuration
 */

import { NodeTypes } from '@xyflow/react'
import { StartNode } from './StartNode'
import { EndNode } from './EndNode'
import { LLMNode } from './LLMNode'
import { IfElseNode } from './IfElseNode'
import { CodeNode } from './CodeNode'
import { HttpRequestNode } from './HttpRequestNode'
import { IterationNode } from './IterationNode'
import { GenericNode } from './GenericNode'

/**
 * React Flow node types mapping
 * Maps Dify node types to React Flow custom components
 */
export const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  llm: LLMNode,
  'if-else': IfElseNode,
  code: CodeNode,
  'http-request': HttpRequestNode,
  iteration: IterationNode,

  // Generic node handles all other types
  'knowledge-retrieval': GenericNode,
  'question-classifier': GenericNode,
  'variable-aggregator': GenericNode,
  'template-transform': GenericNode,
  'parameter-extractor': GenericNode,
  tool: GenericNode,
  assigner: GenericNode,
  'conversation-variable-assigner': GenericNode,

  // Default fallback
  default: GenericNode,
}

/**
 * Get React Flow node type for a Dify node type
 * Returns the node type string to use in React Flow
 */
export function getNodeType(difyNodeType: string): string {
  // Check if we have a specific component for this type
  if (nodeTypes[difyNodeType]) {
    return difyNodeType
  }

  // Check if generic node supports it
  if (
    [
      'knowledge-retrieval',
      'question-classifier',
      'variable-aggregator',
      'template-transform',
      'parameter-extractor',
      'tool',
      'assigner',
      'conversation-variable-assigner',
    ].includes(difyNodeType)
  ) {
    return difyNodeType
  }

  // Default fallback
  return 'default'
}

// Re-export node components for direct use
export { StartNode } from './StartNode'
export { EndNode } from './EndNode'
export { LLMNode } from './LLMNode'
export { IfElseNode } from './IfElseNode'
export { CodeNode } from './CodeNode'
export { HttpRequestNode } from './HttpRequestNode'
export { IterationNode } from './IterationNode'
export { GenericNode } from './GenericNode'
export { BaseNode } from './BaseNode'
export type { BaseNodeData, BaseNodeProps } from './BaseNode'
