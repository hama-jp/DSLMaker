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
    case NODE_TYPES.IF_ELSE:
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
    case NODE_TYPES.END:
      return 'left'
    case NODE_TYPES.IF_ELSE:
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
    case NODE_TYPES.START:
      return {
        ...baseStyle,
        stroke: '#3b82f6', // blue for start connections
      }
    case NODE_TYPES.LLM:
      return {
        ...baseStyle,
        stroke: '#8b5cf6', // purple for LLM connections
      }
    case NODE_TYPES.TOOL:
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
  const defaultRetryConfig = {
    retry_enabled: false,
    max_retries: 0,
    retry_interval: 1000,
    backoff_multiplier: 1
  }

  switch (nodeType) {
    case NODE_TYPES.START:
      return {
        title: '🚀 Workflow Entry Point',
        variables: [],
        // Debug test data for Step Run
        __debug_test_inputs__: {
          user_input: "Hello, I need help with data analysis",
          session_id: "test-session-123",
          files: []
        },
        // Variable Inspector metadata for debugging
        __variable_inspector__: {
          output_variables: {
            user_input: {
              type: "string",
              description: "User's input text or query",
              format: "plain_text",
              validation_rules: ["required", "min_length:1"],
              expected_usage: "Referenced in downstream nodes as {{#start.user_input#}}"
            },
            session_id: {
              type: "string",
              description: "Unique session identifier",
              format: "uuid_or_string",
              validation_rules: ["required"],
              expected_usage: "Used for conversation tracking and context"
            },
            files: {
              type: "array",
              description: "Uploaded files or documents",
              format: "file_objects_array",
              validation_rules: ["optional"],
              expected_usage: "Processed by document extraction nodes"
            }
          },
          variable_dependencies: [],
          transformation_rules: [],
          debugging_hints: [
            "Entry point variables are available globally as {{#start.variable_name#}}",
            "Check that user input is properly captured and not empty",
            "Verify file uploads are correctly formatted if using document processing"
          ]
        }
      }

    case NODE_TYPES.LLM:
      return {
        title: '🤖 AI Processing Node',
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
        ],
        memory: {
          enabled: false,
          window: {
            enabled: true,
            size: 5
          }
        },
        vision: {
          enabled: false
        },
        error_strategy: 'none',
        default_value: '',
        retry_config: defaultRetryConfig,
        // Debug test data for Step Run
        __debug_test_inputs__: {
          user_input: "Analyze this data and provide insights",
          context: "Sales data for Q3 2024",
          expected_output: "A structured analysis with key insights and recommendations"
        },
        // Variable Inspector metadata for debugging
        __variable_inspector__: {
          input_variables: {
            user_input: {
              type: "string",
              description: "Input prompt or question for AI processing",
              format: "plain_text",
              validation_rules: ["required", "max_length:4000"],
              source: "{{#start.user_input#}}",
              transformation: "Used in prompt template"
            },
            context: {
              type: "string",
              description: "Additional context for AI processing",
              format: "structured_text",
              validation_rules: ["optional", "max_length:2000"],
              source: "upstream_nodes",
              transformation: "Injected into system prompt"
            }
          },
          output_variables: {
            text: {
              type: "string",
              description: "Generated AI response text",
              format: "structured_response",
              validation_rules: ["response_format_check"],
              expected_usage: "Referenced as {{#llm-node-id.text#}} in downstream nodes"
            },
            usage: {
              type: "object",
              description: "Token usage and model metrics",
              format: "usage_statistics",
              validation_rules: ["optional"],
              expected_usage: "For cost and performance monitoring"
            }
          },
          variable_dependencies: [
            "start.user_input",
            "previous_node.context"
          ],
          transformation_rules: [
            "Input variables are inserted into prompt template",
            "Temperature controls response creativity",
            "Max tokens limits response length"
          ],
          debugging_hints: [
            "Check prompt template for correct variable references {{#node.variable#}}",
            "Verify model provider and API credentials are configured",
            "Monitor token usage to avoid exceeding limits",
            "Use temperature 0.0 for consistent outputs, higher for creativity"
          ]
        }
      }

    case NODE_TYPES.CODE:
      return {
        title: '⚙️ Custom Code Execution',
        code_language: 'python3',
        code: 'def main():\n    return {"result": "Hello World"}',
        inputs: {},
        outputs: {
          result: { type: 'string' }
        },
        error_strategy: 'none',
        default_value: '',
        retry_config: defaultRetryConfig,
        // Debug test data for Step Run
        __debug_test_inputs__: {
          data: '{"values": [1, 2, 3, 4, 5]}',
          parameters: '{"operation": "sum"}',
          expected_output: '{"result": 15}'
        }
      }

    case NODE_TYPES.IF_ELSE:
      return {
        title: '🔀 Decision Branch Logic',
        logical_operator: 'and',
        conditions: [],
        error_strategy: 'continue',
        // Debug test data for Step Run
        __debug_test_inputs__: {
          condition_value: "high",
          comparison_data: '{"score": 85, "threshold": 70}',
          expected_branch: "true_branch"
        },
        // Variable Inspector metadata for debugging
        __variable_inspector__: {
          input_variables: {
            condition_variables: {
              type: "mixed",
              description: "Variables used in conditional expressions",
              format: "variable_references",
              validation_rules: ["required_if_conditions_present"],
              source: "{{#upstream_node.output#}}",
              transformation: "Evaluated in logical expressions"
            }
          },
          output_variables: {
            branch_result: {
              type: "boolean",
              description: "Result of conditional evaluation",
              format: "true_false",
              validation_rules: ["boolean_only"],
              expected_usage: "Determines which downstream path to take"
            },
            evaluation_context: {
              type: "object",
              description: "Context information about the evaluation",
              format: "condition_metadata",
              validation_rules: ["optional"],
              expected_usage: "For debugging conditional logic"
            }
          },
          variable_dependencies: [
            "upstream_node.output_values",
            "condition_parameters"
          ],
          transformation_rules: [
            "All conditions are evaluated using the specified logical operator (AND/OR)",
            "Variable references are resolved at runtime",
            "Missing variables cause evaluation errors unless default values are set"
          ],
          debugging_hints: [
            "Verify all variable references in conditions are valid: {{#node.variable#}}",
            "Check logical operator (and/or) matches intended behavior",
            "Test both true and false branches to ensure proper flow",
            "Use error_strategy: 'continue' to handle missing variables gracefully",
            "Enable debugging to see actual vs expected condition values"
          ]
        },
        default_value: ''
      }

    case NODE_TYPES.TOOL:
      return {
        title: '🔧 External Tool Integration',
        provider_type: 'builtin',
        provider_id: '',
        tool_name: '',
        tool_parameters: {},
        tool_configurations: {},
        error_strategy: 'default_value',
        default_value: '',
        retry_config: defaultRetryConfig
      }

    case NODE_TYPES.HTTP_REQUEST:
      return {
        title: '🌐 API Request Handler',
        method: 'GET',
        url: 'https://api.example.com',
        headers: {},
        params: {},
        body: {
          type: 'json',
          data: {}
        },
        timeout: 30,
        error_strategy: 'none',
        default_value: '',
        retry_config: { ...defaultRetryConfig, retry_interval: 2000 },
        // Debug test data for Step Run
        __debug_test_inputs__: {
          test_url: "https://jsonplaceholder.typicode.com/posts/1",
          test_headers: '{"Content-Type": "application/json"}',
          test_params: '{"userId": 1}',
          expected_response: '{"id": 1, "title": "Sample Post", "body": "Lorem ipsum..."}'
        }
      }

    case NODE_TYPES.TEMPLATE_TRANSFORM:
      return {
        title: '📝 Data Template Processor',
        template: 'Result: {{#input.value#}}',
        variables: [],
        error_strategy: 'default_value',
        default_value: 'Template processing failed'
      }

    case NODE_TYPES.KNOWLEDGE_RETRIEVAL:
      return {
        title: '📚 Knowledge Base Search',
        query_variable_selector: ['start-1', 'user_input'],
        dataset_ids: [],
        retrieval_mode: 'multiWay',
        multiple_retrieval_config: {
          top_k: 3,
          score_threshold: 0.5,
          reranking_enable: false
        },
        error_strategy: 'default_value',
        default_value: 'No knowledge found',
        retry_config: { ...defaultRetryConfig, max_retries: 2, retry_interval: 1500 },
        // Debug test data for Step Run
        __debug_test_inputs__: {
          test_query: "What is machine learning?",
          test_context: "AI and technology documentation",
          expected_results: "Relevant documents about ML concepts, algorithms, and applications",
          similarity_threshold: 0.7
        }
      }

    case NODE_TYPES.PARAMETER_EXTRACTOR:
      return {
        title: '🔍 Data Parameter Extractor',
        query: '{{#start.user_input#}}',
        model: {
          provider: 'openai',
          name: 'gpt-5-mini',
          completion_params: {
            temperature: 0.0
          }
        },
        parameters: [],
        instruction: 'Extract the required parameters from the input text.',
        inference_mode: 'function_call',
        error_strategy: 'default_value',
        default_value: {},
        retry_config: { ...defaultRetryConfig, max_retries: 1 }
      }

    case NODE_TYPES.AGENT:
      return {
        title: '🤖 Intelligent Agent',
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
        max_iteration: 5,
        error_strategy: 'none',
        default_value: '',
        retry_config: defaultRetryConfig
      }

    case NODE_TYPES.CONVERSATION_VARIABLES:
      return {
        title: '💬 Session Data Manager',
        conversation_variables: [
          {
            variable: 'session_context',
            type: 'object',
            description: 'Stores session-scoped attributes',
            default_value: {}
          }
        ],
        scope: 'session'
      }

    case NODE_TYPES.VARIABLE_AGGREGATOR:
      return {
        title: '📊 Data Aggregation Logic',
        variables: [],
        output_type: 'object',
        advanced_settings: {
          group_enabled: false,
          groups: []
        },
        error_strategy: 'default_value',
        default_value: {},
        // Variable Inspector metadata for debugging
        __variable_inspector__: {
          input_variables: {
            aggregation_sources: {
              type: "array",
              description: "List of variables to aggregate",
              format: "variable_selector_array",
              validation_rules: ["required", "min_items:1"],
              source: "Multiple upstream nodes",
              transformation: "Combined into single output object/array"
            },
            grouping_keys: {
              type: "array",
              description: "Keys used for grouping aggregation",
              format: "string_array",
              validation_rules: ["optional"],
              source: "Configuration",
              transformation: "Used to organize aggregated data"
            }
          },
          output_variables: {
            aggregated_result: {
              type: "mixed",
              description: "Combined result of all input variables",
              format: "structured_data",
              validation_rules: ["matches_output_type"],
              expected_usage: "Referenced as {{#aggregator-node-id.aggregated_result#}}"
            },
            aggregation_metadata: {
              type: "object",
              description: "Information about the aggregation process",
              format: "metadata_object",
              validation_rules: ["optional"],
              expected_usage: "For debugging and monitoring aggregation"
            }
          },
          variable_dependencies: [
            "source_node_1.output",
            "source_node_2.output",
            "additional_upstream_variables"
          ],
          transformation_rules: [
            "Variables are combined based on output_type configuration",
            "Grouping creates nested structure if group_enabled is true",
            "Missing variables use default_value if error_strategy allows",
            "Data types are preserved unless explicit conversion is configured"
          ],
          debugging_hints: [
            "Check that all input variable selectors are valid and point to existing nodes",
            "Verify output_type matches the intended data structure (object/array/string)",
            "Use grouping to organize related variables into logical clusters",
            "Monitor for type conflicts when aggregating mixed data types",
            "Test with missing inputs to verify error_strategy behavior"
          ]
        }
      }

    case NODE_TYPES.LIST_OPERATOR:
      return {
        title: '📋 List Processing Engine',
        input_variables: [],
        filter_conditions: [],
        sorting: [],
        extract_attributes: [],
        output_variables: [],
        error_strategy: 'default_value',
        default_value: []
      }

    case NODE_TYPES.DOCUMENT_EXTRACTOR:
      return {
        title: '📄 Document Content Extractor',
        variable_selector: ['start-1', 'document'],
        extraction_mode: 'automatic',
        supported_formats: ['pdf', 'docx', 'txt'],
        outputs: {
          text: 'extracted_text',
          segments: 'document_segments',
          metadata: 'document_metadata'
        },
        error_strategy: 'default_value',
        default_value: { text: '', segments: [], metadata: {} },
        retry_config: { ...defaultRetryConfig, max_retries: 1, retry_interval: 2000 }
      }

    case NODE_TYPES.QUESTION_CLASSIFIER:
      return {
        title: '🎯 Intent Classification Engine',
        model: {
          provider: 'openai',
          name: 'gpt-5-mini',
          completion_params: {
            temperature: 0.1
          }
        },
        query_variable_selector: ['start-1', 'query'],
        classes: [],
        instructions: 'Classify the incoming request and choose a branch.',
        error_strategy: 'default_value',
        default_value: 'unclassified',
        retry_config: { ...defaultRetryConfig, max_retries: 1 }
      }

    case NODE_TYPES.LOOP:
      return {
        title: '🔄 Iterative Processing Loop',
        loop_termination_condition: 'false',
        max_iterations: 10,
        loop_variables: [],
        iteration_workflow: {
          nodes: []
        },
        error_strategy: 'continue on error'
      }

    case NODE_TYPES.VARIABLE_ASSIGNER:
      return {
        title: '📌 Variable Assignment Logic',
        assignments: [],
        advanced_settings: {
          group_enabled: false
        },
        error_strategy: 'default_value',
        default_value: {},
        // Variable Inspector metadata for debugging
        __variable_inspector__: {
          input_variables: {
            assignment_sources: {
              type: "array",
              description: "Source variables and values for assignments",
              format: "assignment_config_array",
              validation_rules: ["required", "valid_assignments"],
              source: "Configuration and upstream nodes",
              transformation: "Mapped to output variables based on assignment rules"
            }
          },
          output_variables: {
            assigned_variables: {
              type: "object",
              description: "New variables created by assignments",
              format: "key_value_pairs",
              validation_rules: ["matches_assignment_config"],
              expected_usage: "Referenced as {{#assigner-node-id.variable_name#}}"
            },
            assignment_results: {
              type: "object",
              description: "Results of each assignment operation",
              format: "assignment_metadata",
              validation_rules: ["optional"],
              expected_usage: "For debugging assignment operations"
            }
          },
          variable_dependencies: [
            "source_variables_for_assignments",
            "literal_values",
            "expression_inputs"
          ],
          transformation_rules: [
            "Each assignment creates a new variable with specified value",
            "Variable references are resolved from upstream nodes",
            "Literal values are assigned directly",
            "Expressions are evaluated using available context",
            "Failed assignments use default_value if error_strategy allows"
          ],
          debugging_hints: [
            "Verify all source variable references in assignments are valid",
            "Check assignment expressions for correct syntax and variable references",
            "Test with missing source variables to verify error handling",
            "Use descriptive variable names for assigned outputs",
            "Monitor assignment order when variables depend on each other",
            "Validate data types match expected formats for downstream nodes"
          ]
        }
      }

    case NODE_TYPES.END:
      return {
        title: '🏁 Workflow Completion Point',
        outputs: {}
      }

    default:
      return {
        title: 'Unknown',
        description: `Default configuration for ${nodeType}`,
        error_strategy: 'none',
        default_value: ''
      }
  }
}
