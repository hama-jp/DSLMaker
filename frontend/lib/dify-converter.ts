/**
 * Dify DSL Converter
 * Convert between Dify DSL and React Flow format
 */

import { Node, Edge } from '@xyflow/react'
import {
  DifyDSL,
  DifyNodeBase,
  DifyEdge,
  DifyNodeData,
  getDifyNodes,
  getDifyEdges,
  createEmptyDifyDSL,
  DIFY_NODE_COLORS,
} from '@/types'

// =============================================================================
// DIFY DSL → REACT FLOW
// =============================================================================

/**
 * Convert Dify node to React Flow node
 */
export function difyNodeToReactFlow(difyNode: DifyNodeBase): Node {
  const nodeData = difyNode.data as DifyNodeData
  const nodeType = nodeData.type || 'generic'

  return {
    id: difyNode.id,
    type: nodeType || 'generic', // Use generic as fallback
    position: difyNode.position,
    data: {
      ...difyNode.data,
      label: nodeData.title || nodeType,
      color: DIFY_NODE_COLORS[nodeType] || '#6B7280',
    },
    ...(difyNode.parentId && { parentId: difyNode.parentId }),
    ...(difyNode.extent && { extent: difyNode.extent as any }),
    // Set consistent dimensions for Dify-style nodes
    style: {
      width: 280,
      height: 'auto',
    },
    draggable: difyNode.draggable ?? true,
    selectable: difyNode.selectable ?? true,
  }
}

/**
 * Convert Dify edge to React Flow edge
 */
export function difyEdgeToReactFlow(difyEdge: DifyEdge): Edge {
  return {
    id: difyEdge.id,
    source: difyEdge.source,
    target: difyEdge.target,
    sourceHandle: difyEdge.sourceHandle || 'source',
    targetHandle: difyEdge.targetHandle || 'target',
    type: 'smoothstep', // Use smoothstep for curved edges with better routing
    animated: false,
    style: {
      strokeWidth: 2,
      stroke: '#94a3b8', // Slate gray color for edges
    },
    markerEnd: {
      type: 'arrowclosed' as const,
      width: 20,
      height: 20,
      color: '#94a3b8',
    },
    data: difyEdge.data as any,
  }
}

/**
 * Convert complete Dify DSL to React Flow format
 */
export function difyDSLToReactFlow(dsl: DifyDSL): {
  nodes: Node[]
  edges: Edge[]
  metadata: {
    name: string
    description: string
    mode: string
    icon: string
    icon_background: string
  }
} {
  const difyNodes = getDifyNodes(dsl)
  const difyEdges = getDifyEdges(dsl)

  const nodes = difyNodes.map(difyNodeToReactFlow)
  const edges = difyEdges.map(difyEdgeToReactFlow)

  return {
    nodes,
    edges,
    metadata: {
      name: dsl.app.name,
      description: dsl.app.description || '',
      mode: dsl.app.mode,
      icon: dsl.app.icon || '🤖',
      icon_background: dsl.app.icon_background || '#FFEAD5',
    },
  }
}

// =============================================================================
// REACT FLOW → DIFY DSL
// =============================================================================

/**
 * Generate timestamp-based ID (Dify convention)
 */
export function generateDifyNodeId(): string {
  return Date.now().toString()
}

/**
 * Convert React Flow node to Dify node
 */
export function reactFlowNodeToDify(node: Node): DifyNodeBase {
  const nodeType = node.type || 'generic'
  const isCustomNote = nodeType === 'custom-note'

  // Determine the Dify node type
  let difyType = 'custom'
  if (isCustomNote) {
    difyType = 'custom-note'
  } else if (nodeType === 'iteration-start') {
    difyType = 'custom-iteration-start'
  }

  const difyNode: DifyNodeBase = {
    id: node.id,
    type: difyType,
    position: node.position,
    positionAbsolute: node.position, // React Flow doesn't separate these
    selected: false,
    sourcePosition: 'right',
    targetPosition: 'left',
    data: {
      ...node.data,
      type: isCustomNote ? '' : nodeType,
    },
  }

  // Add optional fields
  if (node.parentId) {
    difyNode.parentId = node.parentId
    difyNode.extent = 'parent'
  }

  if (node.width) difyNode.width = node.width
  if (node.height) difyNode.height = node.height

  if (nodeType === 'iteration-start') {
    difyNode.draggable = false
    difyNode.selectable = false
  }

  return difyNode
}

/**
 * Convert React Flow edge to Dify edge
 */
export function reactFlowEdgeToDify(edge: Edge, nodes: Node[]): DifyEdge {
  const sourceNode = nodes.find((n) => n.id === edge.source)
  const targetNode = nodes.find((n) => n.id === edge.target)

  const sourceType = sourceNode?.type || 'unknown'
  const targetType = targetNode?.type || 'unknown'

  // Check if edge is inside iteration
  const isInIteration = !!(sourceNode?.parentId || targetNode?.parentId)
  const iterationId = sourceNode?.parentId || targetNode?.parentId

  return {
    id: edge.id || `${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || 'source',
    targetHandle: edge.targetHandle || 'target',
    type: 'custom',
    selected: false,
    data: {
      sourceType,
      targetType,
      isInIteration,
      ...(iterationId && { iteration_id: iterationId }),
    },
  }
}

/**
 * Convert React Flow format to complete Dify DSL
 */
export function reactFlowToDifyDSL(
  nodes: Node[],
  edges: Edge[],
  metadata: {
    name: string
    description?: string
    mode?: string
    icon?: string
    icon_background?: string
  }
): DifyDSL {
  const dsl = createEmptyDifyDSL(metadata.name, (metadata.mode as any) || 'workflow')

  // Update app metadata
  dsl.app.description = metadata.description || ''
  dsl.app.icon = metadata.icon || '🤖'
  dsl.app.icon_background = metadata.icon_background || '#FFEAD5'

  // Convert nodes and edges
  const difyNodes = nodes.map(reactFlowNodeToDify)
  const difyEdges = edges.map((edge) => reactFlowEdgeToDify(edge, nodes))

  // Set workflow graph
  if (dsl.workflow) {
    dsl.workflow.graph.nodes = difyNodes
    dsl.workflow.graph.edges = difyEdges
  }

  return dsl
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate Dify DSL structure
 */
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
  if (
    dsl.app?.mode === 'workflow' ||
    dsl.app?.mode === 'advanced-chat'
  ) {
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

/**
 * Get node statistics from DSL
 */
export function getDifyDSLStats(dsl: DifyDSL) {
  const nodes = getDifyNodes(dsl)
  const edges = getDifyEdges(dsl)

  const nodeTypes = new Set(nodes.map((n) => (n.data as DifyNodeData).type))

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeTypes: Array.from(nodeTypes),
    hasIteration: nodes.some(
      (n) => (n.data as DifyNodeData).type === 'iteration'
    ),
    hasConversationVariables:
      (dsl.workflow?.conversation_variables?.length || 0) > 0,
    hasDependencies: (dsl.dependencies?.length || 0) > 0,
  }
}
