/**
 * Dify DSL Base Type Definitions
 * Based on Dify 0.4.0 real exports
 *
 * These types represent the ACTUAL structure of Dify DSL,
 * extracted from real workflow exports.
 */

// =============================================================================
// CORE STRUCTURES
// =============================================================================

export interface DifyPosition {
  x: number
  y: number
}

export interface DifyViewport {
  x: number
  y: number
  zoom: number
}

// =============================================================================
// NODE BASE STRUCTURE
// =============================================================================

export interface DifyNodeBase {
  id: string
  type: string // Usually "custom", but can be "custom-note", "custom-iteration-start"
  position: DifyPosition
  positionAbsolute?: DifyPosition // Optional for simplified format
  selected?: boolean
  sourcePosition?: string // default: "right"
  targetPosition?: string // default: "left"
  height?: number // Optional for simplified format
  width?: number // Optional for simplified format
  data: Record<string, any> // Node-specific data, typed in dify-nodes.ts

  // Optional fields for special cases
  zIndex?: number
  parentId?: string // For nodes inside iteration
  extent?: string // "parent" for iteration children
  draggable?: boolean // false for iteration-start
  selectable?: boolean // false for iteration-start
}

// =============================================================================
// EDGE STRUCTURE
// =============================================================================

export interface DifyEdgeData {
  sourceType: string // start, llm, if-else, etc.
  targetType: string
  isInIteration?: boolean
  iteration_id?: string
}

export interface DifyEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string // "source", "true", "false"
  targetHandle?: string // default: "target"
  type?: string // default: "custom"
  data?: DifyEdgeData // Optional for simplified format
  selected?: boolean
  zIndex?: number
}

// =============================================================================
// GRAPH STRUCTURE
// =============================================================================

export interface DifyGraph {
  nodes: DifyNodeBase[]
  edges: DifyEdge[]
  viewport?: DifyViewport // Optional for simplified format
}

// =============================================================================
// CONVERSATION VARIABLES (for advanced-chat mode)
// =============================================================================

export interface DifyConversationVariable {
  id: string
  name: string
  value_type: string // string, number, array[string], array[object], etc.
  value: any // Default value
  description?: string
  selector: string[] // ["conversation", var_name]
}

// =============================================================================
// VARIABLE REFERENCE HELPERS
// =============================================================================

/**
 * Variable reference format in Dify: {{#node_id.field#}}
 */
export type DifyVariableSelector = string[] // [node_id, field_name]

/**
 * Create a variable reference string
 */
export function makeDifyVariableReference(nodeId: string, field: string): string {
  return `{{#${nodeId}.${field}#}}`
}

/**
 * Parse a variable reference string
 */
export function parseDifyVariableReference(ref: string): DifyVariableSelector | null {
  const match = ref.match(/{{#([^.]+)\.([^#]+)#}}/)
  if (match) {
    return [match[1], match[2]]
  }
  return null
}
