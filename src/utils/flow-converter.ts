import { Node, Edge, Viewport } from '@xyflow/react'
import { NODE_TYPES } from '@/constants/node-types'
import { DifyDSLFile, DifyNode, DifyEdge, DifyViewport } from '@/types/dify-workflow'

/**
 * Convert Dify DSL nodes to React Flow nodes
 */
export function convertDSLNodesToFlow(dslNodes: DifyNode[]): Node[] {
  return dslNodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      ...node.data,
      // Add any React Flow specific data here
      sourcePosition: getSourcePosition(node.type),
      targetPosition: getTargetPosition(node.type),
    },
    // React Flow specific properties
    draggable: true,
    selectable: true,
    deletable: true,
  }))
}

/**
 * Convert Dify DSL edges to React Flow edges
 */
export function convertDSLEdgesToFlow(dslEdges: DifyEdge[]): Edge[] {
  return dslEdges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: edge.type || 'default',
    style: getEdgeStyle(edge),
    animated: false,
    deletable: true,
  }))
}

/**
 * Convert React Flow nodes to Dify DSL nodes
 */
export function convertFlowNodesToDSL(flowNodes: Node[]): DifyNode[] {
  return flowNodes.map(node => {
    // Extract only DSL-relevant data, removing React Flow specific properties
    const { sourcePosition, targetPosition, ...dslData } = node.data
    void sourcePosition
    void targetPosition

    return {
      id: node.id,
      type: node.type || 'unknown',
      position: node.position,
      data: dslData,
    } as DifyNode
  })
}

/**
 * Convert React Flow edges to Dify DSL edges
 */
export function convertFlowEdgesToDSL(flowEdges: Edge[], nodes: Node[]): DifyEdge[] {
  return flowEdges.map(edge => {
    // Find source and target node types for metadata
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'source',
      targetHandle: edge.targetHandle || 'target',
      type: edge.type || 'custom',
      zIndex: 0,
      data: {
        isInIteration: false, // This would need more sophisticated detection
        sourceType: sourceNode?.type || 'unknown',
        targetType: targetNode?.type || 'unknown',
      },
    }
  })
}

/**
 * Get appropriate source handle position for node type
 */
function getSourcePosition(nodeType: string): string {
  switch (nodeType) {
    case NODE_TYPES.START:
      return 'right'
    case NODE_TYPES.END:
      return 'left'
    case 'if-else':
      return 'bottom'
    default:
      return 'right'
  }
}

/**
 * Get appropriate target handle position for node type
 */
function getTargetPosition(nodeType: string): string {
  switch (nodeType) {
    case NODE_TYPES.START:
      return 'left'
    case 'end':
      return 'left'
    case 'if-else':
      return 'top'
    default:
      return 'left'
  }
}

/**
 * Get edge styling based on edge type and data
 */
function getEdgeStyle(edge: DifyEdge): Record<string, unknown> {
  const baseStyle = {
    strokeWidth: 2,
  }

  // Style based on source handle (for conditional nodes)
  if (edge.sourceHandle === 'true') {
    return {
      ...baseStyle,
      stroke: '#22c55e', // green for true branch
      strokeDasharray: '0',
    }
  }

  if (edge.sourceHandle === 'false') {
    return {
      ...baseStyle,
      stroke: '#ef4444', // red for false branch
      strokeDasharray: '0',
    }
  }

  // Style based on source node type
  switch (edge.data.sourceType) {
    case 'start':
      return {
        ...baseStyle,
        stroke: '#3b82f6', // blue for start connections
      }
    case NODE_TYPES.LLM:
      return {
        ...baseStyle,
        stroke: '#8b5cf6', // purple for LLM connections
      }
    case 'tool':
      return {
        ...baseStyle,
        stroke: '#f59e0b', // amber for tool connections
      }
    default:
      return {
        ...baseStyle,
        stroke: '#6b7280', // gray for default connections
      }
  }
}

/**
 * Auto-layout nodes in a workflow using improved algorithm
 */
export function autoLayoutNodes(nodes: DifyNode[], edges: DifyEdge[] = []): DifyNode[] {
  const layoutNodes = [...nodes]
  const nodeSpacing = { x: 250, y: 120 }
  const startX = 100
  const startY = 200

  // Build adjacency map for better positioning
  const adjacencyMap = new Map<string, string[]>()
  const incomingMap = new Map<string, string[]>()

  nodes.forEach(node => {
    adjacencyMap.set(node.id, [])
    incomingMap.set(node.id, [])
  })

  edges.forEach(edge => {
    const outgoing = adjacencyMap.get(edge.source) || []
    outgoing.push(edge.target)
    adjacencyMap.set(edge.source, outgoing)

    const incoming = incomingMap.get(edge.target) || []
    incoming.push(edge.source)
    incomingMap.set(edge.target, incoming)
  })

  // Separate nodes by type and calculate levels
  const startNodes = layoutNodes.filter(n => n.type === NODE_TYPES.START)
  const endNodes = layoutNodes.filter(n => n.type === NODE_TYPES.END)
  const otherNodes = layoutNodes.filter(n => n.type !== NODE_TYPES.START && n.type !== NODE_TYPES.END)
  void endNodes
  void otherNodes

  // Calculate node levels using BFS-like approach
  const nodeLevels = new Map<string, number>()
  const visited = new Set<string>()

  // Start nodes are at level 0
  startNodes.forEach(node => {
    nodeLevels.set(node.id, 0)
    visited.add(node.id)
  })

  // Calculate levels for other nodes
  const queue = [...startNodes.map(n => n.id)]
  while (queue.length > 0) {
    const currentId = queue.shift()!
    const currentLevel = nodeLevels.get(currentId) || 0
    const children = adjacencyMap.get(currentId) || []

    children.forEach(childId => {
      const newLevel = currentLevel + 1
      const existingLevel = nodeLevels.get(childId)

      if (!existingLevel || newLevel > existingLevel) {
        nodeLevels.set(childId, newLevel)
      }

      if (!visited.has(childId)) {
        visited.add(childId)
        queue.push(childId)
      }
    })
  }

  // Group nodes by level
  const levelGroups = new Map<number, DifyNode[]>()
  layoutNodes.forEach(node => {
    const level = nodeLevels.get(node.id) || 0
    if (!levelGroups.has(level)) {
      levelGroups.set(level, [])
    }
    levelGroups.get(level)!.push(node)
  })

  // Position nodes by level
  Array.from(levelGroups.entries()).forEach(([level, nodesInLevel]) => {
    const levelY = startY - ((nodesInLevel.length - 1) * nodeSpacing.y) / 2

    nodesInLevel.forEach((node, index) => {
      node.position = {
        x: startX + (level * nodeSpacing.x),
        y: levelY + (index * nodeSpacing.y)
      }
    })
  })

  // Handle isolated nodes (no connections)
  const isolatedNodes = layoutNodes.filter(node =>
    !nodeLevels.has(node.id) && node.type !== NODE_TYPES.START
  )

  isolatedNodes.forEach((node, index) => {
    const maxLevel = Math.max(...Array.from(nodeLevels.values())) || 0
    node.position = {
      x: startX + ((maxLevel + 2) * nodeSpacing.x),
      y: startY + (index * nodeSpacing.y)
    }
  })

  return layoutNodes
}

/**
 * Validate node connections are valid
 */
export function validateNodeConnections(nodes: DifyNode[], edges: DifyEdge[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  edges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source)
    const targetNode = nodeMap.get(edge.target)

    if (!sourceNode) {
      errors.push(`Edge ${edge.id} has invalid source node: ${edge.source}`)
      return
    }

    if (!targetNode) {
      errors.push(`Edge ${edge.id} has invalid target node: ${edge.target}`)
      return
    }

    // Validate connection rules
    if (sourceNode.type === 'end') {
      errors.push(`End node ${sourceNode.id} cannot have outgoing connections`)
    }

    if (targetNode.type === NODE_TYPES.START) {
      errors.push(`Start node ${targetNode.id} cannot have incoming connections`)
    }

    // Check for specific node type connection rules
    if (sourceNode.type === 'if-else') {
      const validHandles = ['true', 'false', 'else']
      if (!validHandles.includes(edge.sourceHandle)) {
        errors.push(`If-else node ${sourceNode.id} must use valid handle: ${validHandles.join(', ')}`)
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Find orphaned nodes (nodes without connections)
 */
export function findOrphanedNodes(nodes: DifyNode[], edges: DifyEdge[]): DifyNode[] {
  const connectedNodeIds = new Set<string>()

  edges.forEach(edge => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })

  return nodes.filter(node =>
    !connectedNodeIds.has(node.id) &&
    node.type !== NODE_TYPES.START // Start nodes can be disconnected
  )
}

/**
 * Detect potential infinite loops in the workflow
 */
export function detectInfiniteLoops(nodes: DifyNode[], edges: DifyEdge[]): {
  hasLoops: boolean
  loops: string[][]
} {
  const adjacencyList = new Map<string, string[]>()

  // Build adjacency list
  nodes.forEach(node => {
    adjacencyList.set(node.id, [])
  })

  edges.forEach(edge => {
    const neighbors = adjacencyList.get(edge.source) || []
    neighbors.push(edge.target)
    adjacencyList.set(edge.source, neighbors)
  })

  // Use Tarjan's algorithm for strongly connected components
  const index = new Map<string, number>()
  const lowLink = new Map<string, number>()
  const onStack = new Set<string>()
  const stack: string[] = []
  const sccs: string[][] = []
  let indexCounter = 0

  function strongConnect(v: string) {
    index.set(v, indexCounter)
    lowLink.set(v, indexCounter)
    indexCounter++
    stack.push(v)
    onStack.add(v)

    const neighbors = adjacencyList.get(v) || []
    for (const w of neighbors) {
      if (!index.has(w)) {
        strongConnect(w)
        lowLink.set(v, Math.min(lowLink.get(v)!, lowLink.get(w)!))
      } else if (onStack.has(w)) {
        lowLink.set(v, Math.min(lowLink.get(v)!, index.get(w)!))
      }
    }

    if (lowLink.get(v) === index.get(v)) {
      const scc: string[] = []
      let w: string
      do {
        w = stack.pop()!
        onStack.delete(w)
        scc.push(w)
      } while (w !== v)

      if (scc.length > 1) {
        sccs.push(scc)
      }
    }
  }

  for (const nodeId of nodes.map(n => n.id)) {
    if (!index.has(nodeId)) {
      strongConnect(nodeId)
    }
  }

  return {
    hasLoops: sccs.length > 0,
    loops: sccs
  }
}

/**
 * Convert Dify DSL viewport to React Flow viewport
 */
export function convertDSLViewportToFlow(dslViewport?: DifyViewport): Viewport {
  if (!dslViewport) {
    return {
      x: 0,
      y: 0,
      zoom: 1
    }
  }

  return {
    x: dslViewport.x,
    y: dslViewport.y,
    zoom: dslViewport.zoom
  }
}

/**
 * Convert React Flow viewport to Dify DSL viewport
 */
export function convertFlowViewportToDSL(flowViewport: Viewport): DifyViewport {
  return {
    x: Math.round(flowViewport.x),
    y: Math.round(flowViewport.y),
    zoom: Number(flowViewport.zoom.toFixed(2))
  }
}

/**
 * Convert complete DSL workflow to React Flow format
 */
export function convertDSLWorkflowToFlow(dslFile: DifyDSLFile) {
  const nodes = convertDSLNodesToFlow(dslFile.workflow.graph.nodes)
  const edges = convertDSLEdgesToFlow(dslFile.workflow.graph.edges)
  const viewport = convertDSLViewportToFlow(dslFile.workflow.graph.viewport)

  return {
    nodes,
    edges,
    viewport
  }
}

/**
 * Convert React Flow format to complete DSL workflow
 */
export function convertFlowWorkflowToDSL(
  nodes: Node[],
  edges: Edge[],
  viewport: Viewport,
  existingDSL?: DifyDSLFile
): DifyDSLFile {
  const dslNodes = convertFlowNodesToDSL(nodes)
  const dslEdges = convertFlowEdgesToDSL(edges, nodes)
  const dslViewport = convertFlowViewportToDSL(viewport)

  // Use existing DSL metadata or create defaults
  const appMetadata = existingDSL?.app || {
    description: '',
    icon: '🤖',
    icon_background: '#EFF1F5',
    mode: 'workflow' as const,
    name: 'Untitled Workflow'
  }

  return {
    app: appMetadata,
    kind: 'app',
    version: existingDSL?.version || '0.1.5',
    workflow: {
      conversation_variables: existingDSL?.workflow.conversation_variables || [],
      environment_variables: existingDSL?.workflow.environment_variables || [],
      features: existingDSL?.workflow.features || {},
      graph: {
        edges: dslEdges,
        nodes: dslNodes,
        viewport: dslViewport
      }
    }
  }
}

/**
 * Generate default node data for a given node type
 */
export function generateDefaultNodeData(nodeType: string): Record<string, unknown> {
  switch (nodeType) {
    case 'start':
      return {
        title: 'Start',
        variables: []
      }

    case NODE_TYPES.LLM:
      return {
        title: 'LLM',
        model: {
          provider: 'openai',
          name: 'gpt-5-mini',
          mode: 'chat',
          completion_params: {
            temperature: 0.7,
            max_tokens: 1000
          }
        },
        prompt_template: [
          {
            role: 'system',
            text: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            text: '{{#start.user_input#}}'
          }
        ]
      }

    case NODE_TYPES.CODE:
      return {
        title: 'Code',
        code_language: 'python3',
        code: 'def main():\n    return {"result": "Hello World"}',
        inputs: {},
        outputs: {
          result: { type: 'string' }
        }
      }

    case NODE_TYPES.IF_ELSE:
      return {
        title: 'Condition',
        logical_operator: 'and',
        conditions: []
      }

    case 'tool':
      return {
        title: 'Tool',
        provider_type: 'builtin',
        provider_id: '',
        tool_name: '',
        tool_parameters: {},
        tool_configurations: {}
      }

    case NODE_TYPES.HTTP_REQUEST:
      return {
        title: 'HTTP Request',
        method: 'GET',
        url: 'https://api.example.com',
        headers: {},
        timeout: 30,
        max_retries: 3
      }

    case NODE_TYPES.TEMPLATE_TRANSFORM:
      return {
        title: 'Template Transform',
        template: 'Result: {{#input.value#}}',
        variables: []
      }

    case 'parameter-extractor':
      return {
        title: 'Parameter Extractor',
        query: '{{#start.user_input#}}',
        model: {
          provider: 'openai',
          name: 'gpt-5-mini',
          completion_params: {
            temperature: 0.0
          }
        },
        parameters: [],
        inference_mode: 'function_call'
      }

    case 'agent':
      return {
        title: 'Agent',
        agent_mode: 'function_calling',
        model: {
          provider: 'openai',
          name: 'gpt-5-mini',
          completion_params: {
            temperature: 0.1,
            max_tokens: 2000
          }
        },
        tools: [],
        query: '{{#start.user_input#}}',
        instruction: 'You are a helpful assistant.',
        max_iteration: 5
      }

    case 'conversation-variables':
      return {
        title: 'Conversation Variables',
        conversation_variables: [],
        scope: 'session'
      }

    case 'list-operator':
      return {
        title: 'List Operator',
        input_variables: [],
        filter_conditions: [],
        output_variables: []
      }

    case 'document-extractor':
      return {
        title: 'Document Extractor',
        variable_selector: ['start-1', 'document'],
        extraction_mode: 'automatic',
        supported_formats: ['pdf', 'docx', 'txt']
      }

    case 'question-classifier':
      return {
        title: 'Question Classifier',
        model: {
          provider: 'openai',
          name: 'gpt-5-mini',
          completion_params: {
            temperature: 0.1
          }
        },
        query_variable_selector: ['start-1', 'query'],
        classes: []
      }

    case 'loop':
      return {
        title: 'Loop',
        loop_termination_condition: 'false',
        max_iterations: 10,
        loop_variables: [],
        iteration_workflow: {
          nodes: []
        }
      }

    case 'variable-assigner':
      return {
        title: 'Variable Assigner',
        assignments: []
      }

    case 'end':
      return {
        title: 'End',
        outputs: {}
      }

    default:
      return {
        title: nodeType.charAt(0).toUpperCase() + nodeType.slice(1)
      }
  }
}
