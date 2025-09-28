import yaml from 'js-yaml'
import { NODE_TYPES } from '@/constants/node-types'
import { collectDSLStructuralIssues } from '@/utils/dsl-structure-validation'
import { DifyDSLFile, DSLParseResult, ValidationError } from '@/types/dify-workflow'

/**
 * Parse YAML content and validate DSL structure
 */
export function parseDSL(yamlContent: string): DSLParseResult {
  const errors: string[] = []

  try {
    // Parse YAML
    const parsed = yaml.load(yamlContent) as unknown

    // Validate basic structure
    if (!parsed || typeof parsed !== 'object') {
      errors.push('Invalid YAML format: Root must be an object')
      return { success: false, errors }
    }

    const data = parsed as Record<string, unknown>

    // Validate required top-level fields
    if (!data.app) {
      errors.push('Missing required field: app')
    }

    if (!data.kind) {
      errors.push('Missing required field: kind')
    } else if (data.kind !== 'app') {
      errors.push('Invalid kind: must be "app"')
    }

    if (!data.version) {
      errors.push('Missing required field: version')
    }

    if (!data.workflow) {
      errors.push('Missing required field: workflow')
    }

    // Validate app section
    if (data.app && typeof data.app === 'object') {
      const app = data.app as Record<string, unknown>

      if (!app.name || typeof app.name !== 'string') {
        errors.push('app.name is required and must be a string')
      }

      if (!app.icon || typeof app.icon !== 'string') {
        errors.push('app.icon is required and must be a string')
      }

      if (!app.icon_background || typeof app.icon_background !== 'string') {
        errors.push('app.icon_background is required and must be a string')
      }

      if (!app.mode || typeof app.mode !== 'string') {
        errors.push('app.mode is required and must be a string')
      } else if (!['workflow', 'advanced-chat', 'agent-chat', 'chat'].includes(app.mode as string)) {
        errors.push('app.mode must be one of: workflow, advanced-chat, agent-chat, chat')
      }
    }

    // Validate workflow section
    if (data.workflow && typeof data.workflow === 'object') {
      const workflow = data.workflow as Record<string, unknown>

      if (!workflow.graph) {
        errors.push('workflow.graph is required')
      } else if (typeof workflow.graph === 'object') {
        const graph = workflow.graph as Record<string, unknown>

        if (!Array.isArray(graph.nodes)) {
          errors.push('workflow.graph.nodes must be an array')
        }

        if (!Array.isArray(graph.edges)) {
          errors.push('workflow.graph.edges must be an array')
        }

        // Validate nodes
        if (Array.isArray(graph.nodes)) {
          graph.nodes.forEach((node, index) => {
            if (!node || typeof node !== 'object') {
              errors.push(`Node at index ${index} must be an object`)
              return
            }

            const nodeObj = node as Record<string, unknown>

            if (!nodeObj.id || typeof nodeObj.id !== 'string') {
              errors.push(`Node at index ${index} must have a string id`)
            }

            if (!nodeObj.type || typeof nodeObj.type !== 'string') {
              errors.push(`Node at index ${index} must have a string type`)
            }

            if (!nodeObj.position || typeof nodeObj.position !== 'object') {
              errors.push(`Node at index ${index} must have a position object`)
            } else {
              const position = nodeObj.position as Record<string, unknown>
              if (typeof position.x !== 'number' || typeof position.y !== 'number') {
                errors.push(`Node at index ${index} position must have numeric x and y`)
              }
            }

            if (!nodeObj.data || typeof nodeObj.data !== 'object') {
              errors.push(`Node at index ${index} must have a data object`)
            } else {
              const nodeData = nodeObj.data as Record<string, unknown>
              if (!nodeData.title || typeof nodeData.title !== 'string') {
                errors.push(`Node at index ${index} data must have a string title`)
              }
            }
          })
        }

        // Validate edges
        if (Array.isArray(graph.edges)) {
          graph.edges.forEach((edge, index) => {
            if (!edge || typeof edge !== 'object') {
              errors.push(`Edge at index ${index} must be an object`)
              return
            }

            const edgeObj = edge as Record<string, unknown>

            if (!edgeObj.id || typeof edgeObj.id !== 'string') {
              errors.push(`Edge at index ${index} must have a string id`)
            }

            if (!edgeObj.source || typeof edgeObj.source !== 'string') {
              errors.push(`Edge at index ${index} must have a string source`)
            }

            if (!edgeObj.target || typeof edgeObj.target !== 'string') {
              errors.push(`Edge at index ${index} must have a string target`)
            }
          })
        }
      }
    }

    if (errors.length > 0) {
      return { success: false, errors }
    }

    // If validation passed, cast to DifyDSLFile
    const dslFile = data as DifyDSLFile

    // Additional semantic validation
    const semanticErrors = validateSemantics(dslFile)
    if (semanticErrors.length > 0) {
      return { success: false, errors: semanticErrors }
    }

    return { success: true, workflow: dslFile, errors: [] }

  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      errors.push(`YAML parsing error: ${error.message}`)
    } else {
      errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { success: false, errors }
  }
}

/**
 * Validate semantic constraints of the DSL
 */
function validateSemantics(dslFile: DifyDSLFile): string[] {
  const errors: string[] = []
  const nodes = dslFile.workflow.graph.nodes
  const edges = dslFile.workflow.graph.edges

  const structuralIssues = collectDSLStructuralIssues(dslFile)
  structuralIssues
    .filter(issue => issue.level === 'error')
    .forEach(issue => errors.push(issue.message))

  // Check node ID uniqueness
  const nodeIds = new Set<string>()
  nodes.forEach(node => {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`)
    }
    nodeIds.add(node.id)
  })

  // Check edge ID uniqueness
  const edgeIds = new Set<string>()
  edges.forEach(edge => {
    if (edgeIds.has(edge.id)) {
      errors.push(`Duplicate edge ID: ${edge.id}`)
    }
    edgeIds.add(edge.id)
  })

  // Check edge references valid nodes
  edges.forEach(edge => {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`)
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`)
    }
  })

  // Check for cycles (simple DFS-based detection)
  const cycleResult = detectCycles(nodes, edges)
  if (cycleResult.hasCycles) {
    errors.push(`Cycle detected in workflow: ${cycleResult.cycleNodes.join(' -> ')}`)
  }

  // Check workflow connectivity
  const connectivityErrors = validateWorkflowConnectivity(nodes, edges)
  errors.push(...connectivityErrors)

  return errors
}

/**
 * Detect cycles in the workflow graph
 */
function detectCycles(nodes: DifyDSLFile['workflow']['graph']['nodes'], edges: DifyDSLFile['workflow']['graph']['edges']) {
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

  // DFS cycle detection
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const cycleNodes: string[] = []

  function dfs(nodeId: string, path: string[]): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = adjacencyList.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path, nodeId])) {
          return true
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor)
        cycleNodes.push(...path.slice(cycleStart), nodeId, neighbor)
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id, [])) {
        return { hasCycles: true, cycleNodes }
      }
    }
  }

  return { hasCycles: false, cycleNodes: [] }
}

/**
 * Validate workflow connectivity
 */
function validateWorkflowConnectivity(nodes: DifyDSLFile['workflow']['graph']['nodes'], edges: DifyDSLFile['workflow']['graph']['edges']): string[] {
  const errors: string[] = []

  if (nodes.length === 0) {
    return errors
  }

  // Find start and end nodes
  const startNodes = nodes.filter(node => node.type === 'start')
  const endNodes = nodes.filter(node => node.type === 'end')

  if (startNodes.length === 0) {
    errors.push('Workflow must have at least one start node')
  }

  if (endNodes.length === 0) {
    errors.push('Workflow must have at least one end node')
  }

  // Build adjacency maps
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()

  nodes.forEach(node => {
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
  })

  edges.forEach(edge => {
    const sourceTargets = outgoing.get(edge.source) || []
    sourceTargets.push(edge.target)
    outgoing.set(edge.source, sourceTargets)

    const targetSources = incoming.get(edge.target) || []
    targetSources.push(edge.source)
    incoming.set(edge.target, targetSources)
  })

  // Check for isolated nodes (no incoming AND no outgoing connections)
  nodes.forEach(node => {
    const hasIncoming = (incoming.get(node.id) || []).length > 0
    const hasOutgoing = (outgoing.get(node.id) || []).length > 0

    // Start nodes should have outgoing but not incoming
    if (node.type === 'start') {
      if (!hasOutgoing) {
        errors.push(`Start node ${node.id} has no outgoing connections`)
      }
    }
    // End nodes should have incoming but not outgoing
    else if (node.type === 'end') {
      if (!hasIncoming) {
        errors.push(`End node ${node.id} has no incoming connections`)
      }
    }
    // All other nodes should have both, with special cases
    else {
      if (!hasIncoming && !hasOutgoing) {
        errors.push(`Node ${node.id} is completely isolated (no connections)`)
      } else if (!hasIncoming) {
        errors.push(`Node ${node.id} has no incoming connections`)
      } else if (!hasOutgoing) {
        errors.push(`Node ${node.id} has no outgoing connections`)
      }

      // Special validation for if-else nodes - they should have multiple outputs for branching
      if (node.type === 'if-else' || node.type === 'if_else') {
        const outgoingCount = (outgoing.get(node.id) || []).length
        if (outgoingCount < 2) {
          errors.push(`If-else node ${node.id} should have at least 2 outgoing connections for branching`)
        }
      }

      // Special validation for aggregator nodes - they can have multiple inputs
      if (node.type === 'variable-aggregator' || node.type === 'variable_aggregator' ||
          node.type === 'variable-assigner' || node.type === 'variable_assigner') {
        const incomingCount = (incoming.get(node.id) || []).length
        if (incomingCount < 2) {
          errors.push(`Aggregator node ${node.id} should have at least 2 incoming connections to merge data`)
        }
      }
    }
  })

  // Check if all nodes are reachable from start node
  if (startNodes.length > 0) {
    const visited = new Set<string>()
    const queue = [startNodes[0].id]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue

      visited.add(current)
      const targets = outgoing.get(current) || []
      targets.forEach(target => {
        if (!visited.has(target)) {
          queue.push(target)
        }
      })
    }

    // Check if any nodes are unreachable
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        errors.push(`Node ${node.id} is not reachable from the start node`)
      }
    })
  }

  return errors
}

/**
 * Validate node-specific constraints
 */
export function validateNode(node: DifyDSLFile['workflow']['graph']['nodes'][0]): ValidationError[] {
  const errors: ValidationError[] = []

  switch (node.type) {
    case NODE_TYPES.START:
      // Start node specific validation
      if (node.data.variables) {
        node.data.variables.forEach((variable, index) => {
          if (!variable.name || typeof variable.name !== 'string') {
            errors.push({
              type: 'error',
              code: 'INVALID_VARIABLE_NAME',
              message: `Variable at index ${index} must have a valid name`,
              nodeId: node.id
            })
          }

          if (!variable.type || !['text-input', 'number', 'select', 'file', 'file-list', 'object'].includes(variable.type)) {
            errors.push({
              type: 'error',
              code: 'INVALID_VARIABLE_TYPE',
              message: `Variable "${variable.name}" has invalid type`,
              nodeId: node.id
            })
          }

          if (variable.type === 'select' && !variable.options) {
            errors.push({
              type: 'error',
              code: 'MISSING_SELECT_OPTIONS',
              message: `Select variable "${variable.name}" must have options`,
              nodeId: node.id
            })
          }
        })
      }
      break

    case NODE_TYPES.LLM:
      // LLM node specific validation
      if (!node.data.model) {
        errors.push({
          type: 'error',
          code: 'MISSING_MODEL_CONFIG',
          message: 'LLM node must have model configuration',
          nodeId: node.id
        })
      } else {
        const model = node.data.model as Record<string, unknown>
        if (!model.provider || typeof model.provider !== 'string') {
          errors.push({
            type: 'error',
            code: 'MISSING_MODEL_PROVIDER',
            message: 'LLM node must specify model provider',
            nodeId: node.id
          })
        }

        if (!model.name || typeof model.name !== 'string') {
          errors.push({
            type: 'error',
            code: 'MISSING_MODEL_NAME',
            message: 'LLM node must specify model name',
            nodeId: node.id
          })
        }
      }

      if (!node.data.prompt_template) {
        errors.push({
          type: 'error',
          code: 'MISSING_PROMPT_TEMPLATE',
          message: 'LLM node must have prompt template',
          nodeId: node.id
        })
      }
      break

    case NODE_TYPES.CODE:
      // Code node specific validation
      if (!node.data.code || typeof node.data.code !== 'string') {
        errors.push({
          type: 'error',
          code: 'MISSING_CODE',
          message: 'Code node must have code content',
          nodeId: node.id
        })
      }

      if (!node.data.code_language || !['python3', 'javascript'].includes(node.data.code_language as string)) {
        errors.push({
          type: 'error',
          code: 'INVALID_CODE_LANGUAGE',
          message: 'Code node must specify valid language (python3 or javascript)',
          nodeId: node.id
        })
      }

      if (!node.data.outputs || typeof node.data.outputs !== 'object') {
        errors.push({
          type: 'error',
          code: 'MISSING_CODE_OUTPUTS',
          message: 'Code node must define outputs',
          nodeId: node.id
        })
      }
      break

    case NODE_TYPES.IF_ELSE:
      // If-else node specific validation
      if (!node.data.conditions || !Array.isArray(node.data.conditions)) {
        errors.push({
          type: 'error',
          code: 'MISSING_CONDITIONS',
          message: 'If-else node must have conditions array',
          nodeId: node.id
        })
      } else {
        node.data.conditions.forEach((condition, index) => {
          if (!condition.variable_selector || !Array.isArray(condition.variable_selector)) {
            errors.push({
              type: 'error',
              code: 'INVALID_CONDITION_VARIABLE',
              message: `Condition at index ${index} must have valid variable selector`,
              nodeId: node.id
            })
          }

          if (!condition.comparison_operator) {
            errors.push({
              type: 'error',
              code: 'MISSING_COMPARISON_OPERATOR',
              message: `Condition at index ${index} must have comparison operator`,
              nodeId: node.id
            })
          }
        })
      }
      break

    case NODE_TYPES.HTTP_REQUEST:
      // HTTP Request node validation
      if (!node.data.method || typeof node.data.method !== 'string') {
        errors.push({
          type: 'error',
          code: 'MISSING_HTTP_METHOD',
          message: 'HTTP Request node must have method',
          nodeId: node.id
        })
      }

      if (!node.data.url || typeof node.data.url !== 'string') {
        errors.push({
          type: 'error',
          code: 'MISSING_HTTP_URL',
          message: 'HTTP Request node must have URL',
          nodeId: node.id
        })
      }
      break

    case NODE_TYPES.TEMPLATE_TRANSFORM:
      // Template Transform node validation
      if (!node.data.template || typeof node.data.template !== 'string') {
        errors.push({
          type: 'error',
          code: 'MISSING_TEMPLATE',
          message: 'Template Transform node must have template',
          nodeId: node.id
        })
      }
      break

    case 'parameter-extractor':
      // Parameter Extractor node validation
      if (!node.data.model) {
        errors.push({
          type: 'error',
          code: 'MISSING_EXTRACTOR_MODEL',
          message: 'Parameter Extractor node must have model configuration',
          nodeId: node.id
        })
      }

      if (!node.data.parameters || !Array.isArray(node.data.parameters)) {
        errors.push({
          type: 'error',
          code: 'MISSING_EXTRACTOR_PARAMETERS',
          message: 'Parameter Extractor node must have parameters array',
          nodeId: node.id
        })
      }
      break

    case 'agent':
      // Agent node validation
      if (!node.data.model) {
        errors.push({
          type: 'error',
          code: 'MISSING_AGENT_MODEL',
          message: 'Agent node must have model configuration',
          nodeId: node.id
        })
      }

      if (!node.data.tools || !Array.isArray(node.data.tools)) {
        errors.push({
          type: 'error',
          code: 'MISSING_AGENT_TOOLS',
          message: 'Agent node must have tools array',
          nodeId: node.id
        })
      }
      break

    case 'question-classifier':
      // Question Classifier node validation
      if (!node.data.classes || !Array.isArray(node.data.classes)) {
        errors.push({
          type: 'error',
          code: 'MISSING_CLASSIFIER_CLASSES',
          message: 'Question Classifier node must have classes array',
          nodeId: node.id
        })
      }
      break

    case 'loop':
      // Loop node validation
      if (!node.data.loop_termination_condition) {
        errors.push({
          type: 'error',
          code: 'MISSING_LOOP_CONDITION',
          message: 'Loop node must have termination condition',
          nodeId: node.id
        })
      }

      if (!node.data.max_iterations || typeof node.data.max_iterations !== 'number') {
        errors.push({
          type: 'error',
          code: 'MISSING_LOOP_MAX_ITERATIONS',
          message: 'Loop node must have max_iterations number',
          nodeId: node.id
        })
      }
      break

    case 'document-extractor':
      // Document Extractor node validation
      if (!node.data.variable_selector || !Array.isArray(node.data.variable_selector)) {
        errors.push({
          type: 'error',
          code: 'MISSING_DOCUMENT_SELECTOR',
          message: 'Document Extractor node must have variable_selector',
          nodeId: node.id
        })
      }
      break

    case 'conversation-variables':
      // Conversation Variables node validation
      if (!node.data.conversation_variables || !Array.isArray(node.data.conversation_variables)) {
        errors.push({
          type: 'error',
          code: 'MISSING_CONVERSATION_VARIABLES',
          message: 'Conversation Variables node must have conversation_variables array',
          nodeId: node.id
        })
      }
      break

    case 'variable-assigner':
      // Variable Assigner node validation
      if (!node.data.assignments || !Array.isArray(node.data.assignments)) {
        errors.push({
          type: 'error',
          code: 'MISSING_VARIABLE_ASSIGNMENTS',
          message: 'Variable Assigner node must have assignments array',
          nodeId: node.id
        })
      }
      break

    case 'list-operator':
      // List Operator node validation
      if (!node.data.input_variables || !Array.isArray(node.data.input_variables)) {
        errors.push({
          type: 'error',
          code: 'MISSING_LIST_INPUT_VARIABLES',
          message: 'List Operator node must have input_variables array',
          nodeId: node.id
        })
      }
      break

    // Add more node type validations as needed
  }

  return errors
}
