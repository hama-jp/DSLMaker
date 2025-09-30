// DSL Linting and Error Checking Utilities
import yaml from 'js-yaml'
import {
  DifyDSLFile,
  DifyNode,
  DifyEdge,
  DifyLLMNode,
  DifyHTTPRequestNode,
} from '@/types/dify-workflow'
import { NODE_TYPES } from '@/constants/node-types'
import { collectDSLStructuralIssues } from '@/utils/dsl-structure-validation'

export interface LintResult {
  isValid: boolean
  errors: LintError[]
  warnings: LintError[]
  suggestions: LintSuggestion[]
}

export interface LintError {
  severity: 'error' | 'warning'
  code: string
  message: string
  nodeId?: string
  edgeId?: string
  line?: number
  column?: number
  context?: string
}

export interface LintSuggestion {
  type: 'performance' | 'best-practice' | 'security' | 'usability'
  message: string
  nodeId?: string
  fix?: string
}

/**
 * Comprehensive DSL linting function
 */
export function lintDSL(dslFile: DifyDSLFile): LintResult {
  const errors: LintError[] = []
  const warnings: LintError[] = []
  const suggestions: LintSuggestion[] = []

  // Validate basic structure
  validateBasicStructure(dslFile, errors)

  // Validate app metadata
  validateAppMetadata(dslFile.app, errors, warnings)

  // Validate workflow structure
  validateWorkflowStructure(dslFile.workflow, errors, warnings)

  // Validate nodes
  validateNodes(dslFile.workflow.graph.nodes, errors, warnings, suggestions)

  // Validate edges
  validateEdges(dslFile.workflow.graph.edges, dslFile.workflow.graph.nodes, errors, warnings)

  // Validate variable references
  validateVariableReferences(dslFile, errors, warnings)

  // Shared structural checks
  const structuralIssues = collectDSLStructuralIssues(dslFile)
  structuralIssues.forEach(issue => {
    const collection = issue.level === 'error' ? errors : warnings
    collection.push({
      severity: issue.level,
      code: issue.code,
      message: issue.message,
      nodeId: issue.nodeId,
      edgeId: issue.edgeId,
    })
  })

  // Generate suggestions
  generateSuggestions(dslFile, suggestions)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

/**
 * Validate basic DSL structure
 */
function validateBasicStructure(dslFile: DifyDSLFile, errors: LintError[]): void {
  if (!dslFile.app) {
    errors.push({
      severity: 'error',
      code: 'MISSING_APP',
      message: 'DSL file must have an "app" section'
    })
  }

  if (dslFile.kind !== 'app') {
    errors.push({
      severity: 'error',
      code: 'INVALID_KIND',
      message: 'DSL kind must be "app"'
    })
  }

  if (!dslFile.version) {
    errors.push({
      severity: 'error',
      code: 'MISSING_VERSION',
      message: 'DSL file must have a version'
    })
  }

  if (!dslFile.workflow) {
    errors.push({
      severity: 'error',
      code: 'MISSING_WORKFLOW',
      message: 'DSL file must have a "workflow" section'
    })
  }
}

/**
 * Validate app metadata
 */
function validateAppMetadata(app: DifyDSLFile['app'], errors: LintError[], warnings: LintError[]): void {
  if (!app.name || app.name.trim().length === 0) {
    errors.push({
      severity: 'error',
      code: 'MISSING_APP_NAME',
      message: 'App must have a non-empty name'
    })
  }

  if (app.name && app.name.length > 100) {
    warnings.push({
      severity: 'warning',
      code: 'LONG_APP_NAME',
      message: 'App name is very long (>100 characters)'
    })
  }

  if (!app.icon) {
    warnings.push({
      severity: 'warning',
      code: 'MISSING_ICON',
      message: 'App should have an icon (emoji recommended)'
    })
  }

  if (app.icon && app.icon.length > 4) {
    warnings.push({
      severity: 'warning',
      code: 'INVALID_ICON',
      message: 'App icon should be a single emoji or short symbol'
    })
  }

  if (!app.icon_background) {
    warnings.push({
      severity: 'warning',
      code: 'MISSING_ICON_BACKGROUND',
      message: 'App should have an icon background color'
    })
  }

  if (app.icon_background && !/^#[0-9A-Fa-f]{6}$/.test(app.icon_background)) {
    warnings.push({
      severity: 'warning',
      code: 'INVALID_ICON_BACKGROUND',
      message: 'Icon background should be a valid hex color (e.g., #EFF1F5)'
    })
  }

  if (app.mode !== 'workflow') {
    warnings.push({
      severity: 'warning',
      code: 'INVALID_MODE',
      message: 'App mode should be "workflow" for this tool'
    })
  }
}

/**
 * Validate workflow structure
 */
function validateWorkflowStructure(
  workflow: DifyDSLFile['workflow'],
  errors: LintError[],
  warnings: LintError[]
): void {
  void warnings
  if (!workflow.graph) {
    errors.push({
      severity: 'error',
      code: 'MISSING_GRAPH',
      message: 'Workflow must have a graph section'
    })
    return
  }

  if (!Array.isArray(workflow.graph.nodes)) {
    errors.push({
      severity: 'error',
      code: 'INVALID_NODES',
      message: 'Workflow graph nodes must be an array'
    })
  }

  if (!Array.isArray(workflow.graph.edges)) {
    errors.push({
      severity: 'error',
      code: 'INVALID_EDGES',
      message: 'Workflow graph edges must be an array'
    })
  }

  if (workflow.graph.nodes.length === 0) {
    errors.push({
      severity: 'error',
      code: 'EMPTY_WORKFLOW',
      message: 'Workflow must have at least one node'
    })
  }

  // Check for required environment variables
  if (!Array.isArray(workflow.environment_variables)) {
    errors.push({
      severity: 'error',
      code: 'INVALID_ENV_VARS',
      message: 'Environment variables must be an array'
    })
  }
}

/**
 * Validate individual nodes
 */
function validateNodes(
  nodes: DifyNode[],
  errors: LintError[],
  warnings: LintError[],
  suggestions: LintSuggestion[]
): void {
  const nodeIds = new Set<string>()
  const nodeTypes = new Map<string, number>()
  let hasStartNode = false
  let hasEndNode = false

  nodes.forEach((node, index) => {
    // Check for required fields
    if (!node.id) {
      errors.push({
        severity: 'error',
        code: 'MISSING_NODE_ID',
        message: `Node at index ${index} must have an ID`
      })
    }

    if (!node.type) {
      errors.push({
        severity: 'error',
        code: 'MISSING_NODE_TYPE',
        message: `Node ${(node as any).id || index} must have a type`
      })
    }

    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      errors.push({
        severity: 'error',
        code: 'INVALID_NODE_POSITION',
        message: `Node ${node.id} must have valid position coordinates`
      })
    }

    if (!node.data || !node.data.title) {
      errors.push({
        severity: 'error',
        code: 'MISSING_NODE_TITLE',
        message: `Node ${node.id} must have data with a title`
      })
    }

    // Check for duplicate IDs
    if (node.id) {
      if (nodeIds.has(node.id)) {
        errors.push({
          severity: 'error',
          code: 'DUPLICATE_NODE_ID',
          message: `Duplicate node ID: ${node.id}`,
          nodeId: node.id
        })
      }
      nodeIds.add(node.id)
    }

    // Count node types
    if (node.type) {
      nodeTypes.set(node.type, (nodeTypes.get(node.type) || 0) + 1)

      if (node.type === NODE_TYPES.START) hasStartNode = true
      if (node.type === NODE_TYPES.END) hasEndNode = true
    }

    // Validate specific node types
    validateSpecificNodeType(node, errors, warnings, suggestions)
  })

  // Check for required node types
  if (!hasStartNode) {
    errors.push({
      severity: 'error',
      code: 'NO_START_NODE',
      message: 'Workflow must have exactly one Start node'
    })
  }

  if (!hasEndNode) {
    errors.push({
      severity: 'error',
      code: 'NO_END_NODE',
      message: 'Workflow must have at least one End node'
    })
  }

  // Check for multiple start nodes
  const startNodeCount = nodeTypes.get(NODE_TYPES.START) || 0
  if (startNodeCount > 1) {
    warnings.push({
      severity: 'warning',
      code: 'MULTIPLE_START_NODES',
      message: `Workflow has ${startNodeCount} Start nodes (should be exactly 1)`
    })
  }

  // Performance suggestions
  const totalNodes = nodes.length
  if (totalNodes > 20) {
    suggestions.push({
      type: 'performance',
      message: `Large workflow with ${totalNodes} nodes. Consider breaking into smaller workflows.`
    })
  }
}

/**
 * Validate specific node types
 */
function validateSpecificNodeType(
  node: DifyNode,
  errors: LintError[],
  warnings: LintError[],
  suggestions: LintSuggestion[]
): void {
  switch (node.type) {
    case NODE_TYPES.LLM:
      validateLLMNode(node, errors, warnings, suggestions)
      break
    case NODE_TYPES.HTTP_REQUEST:
      validateHTTPNode(node, errors, warnings, suggestions)
      break
    case NODE_TYPES.CODE:
      validateCodeNode(node, errors, warnings, suggestions)
      break
    case NODE_TYPES.IF_ELSE:
      validateIfElseNode(node, errors, warnings)
      break
    case NODE_TYPES.START:
      validateStartNode(node, errors, warnings)
      break
    case NODE_TYPES.END:
      validateEndNode(node, errors, warnings)
      break
  }
}

/**
 * Validate LLM node
 */
const isLLMNode = (node: DifyNode): node is DifyLLMNode => node.type === NODE_TYPES.LLM
const isHTTPRequestNode = (node: DifyNode): node is DifyHTTPRequestNode => node.type === NODE_TYPES.HTTP_REQUEST

function validateLLMNode(
  node: DifyNode,
  errors: LintError[],
  warnings: LintError[],
  suggestions: LintSuggestion[]
): void {
  if (!isLLMNode(node)) return

  const { data } = node

  if (!data.model) {
    errors.push({
      severity: 'error',
      code: 'MISSING_LLM_MODEL',
      message: `LLM node ${node.id} must have model configuration`,
      nodeId: node.id
    })
    return
  }

  if (!data.model.provider) {
    errors.push({
      severity: 'error',
      code: 'MISSING_MODEL_PROVIDER',
      message: `LLM node ${node.id} must specify model provider`,
      nodeId: node.id
    })
  }

  if (!data.model.name) {
    errors.push({
      severity: 'error',
      code: 'MISSING_MODEL_NAME',
      message: `LLM node ${node.id} must specify model name`,
      nodeId: node.id
    })
  }

  if (!data.prompt_template || !Array.isArray(data.prompt_template)) {
    errors.push({
      severity: 'error',
      code: 'MISSING_PROMPT_TEMPLATE',
      message: `LLM node ${node.id} must have prompt template array`,
      nodeId: node.id
    })
  }

  // Check temperature range
  const temp = data.model?.completion_params?.temperature
  if (temp !== undefined && (temp < 0 || temp > 2)) {
    warnings.push({
      severity: 'warning',
      code: 'INVALID_TEMPERATURE',
      message: `LLM node ${node.id} temperature should be between 0 and 2`,
      nodeId: node.id
    })
  }

  // Performance suggestions
  if (data.model?.completion_params?.max_tokens && data.model.completion_params.max_tokens > 4000) {
    suggestions.push({
      type: 'performance',
      message: `LLM node ${node.id} has high token limit. Consider if it's necessary.`,
      nodeId: node.id
    })
  }

  // Best practice suggestions
  if (data.prompt_template?.length === 1) {
    suggestions.push({
      type: 'best-practice',
      message: `LLM node ${node.id} could benefit from system + user message structure.`,
      nodeId: node.id
    })
  }
}

/**
 * Validate HTTP request node
 */
function validateHTTPNode(
  node: DifyNode,
  errors: LintError[],
  warnings: LintError[],
  suggestions: LintSuggestion[]
): void {
  if (!isHTTPRequestNode(node)) return

  const { data } = node

  if (!data.url) {
    errors.push({
      severity: 'error',
      code: 'MISSING_HTTP_URL',
      message: `HTTP request node ${node.id} must have URL`,
      nodeId: node.id
    })
  }

  if (!data.method) {
    errors.push({
      severity: 'error',
      code: 'MISSING_HTTP_METHOD',
      message: `HTTP request node ${node.id} must have method`,
      nodeId: node.id
    })
  }

  // Security checks
  if (data.url && data.url.startsWith('http://')) {
    warnings.push({
      severity: 'warning',
      code: 'INSECURE_HTTP',
      message: `HTTP request node ${node.id} uses insecure HTTP. Consider HTTPS.`,
      nodeId: node.id
    })
  }

  // Performance suggestions
  if (!data.timeout || data.timeout > 60) {
    suggestions.push({
      type: 'performance',
      message: `HTTP request node ${node.id} should have reasonable timeout (< 60s).`,
      nodeId: node.id
    })
  }
}

/**
 * Validate edges
 */
function validateEdges(
  edges: DifyEdge[],
  nodes: DifyNode[],
  errors: LintError[],
  warnings: LintError[]
): void {
  void warnings
  const nodeIds = new Set(nodes.map(n => n.id))
  const edgeIds = new Set<string>()

  edges.forEach((edge, index) => {
    // Check required fields
    if (!edge.id) {
      errors.push({
        severity: 'error',
        code: 'MISSING_EDGE_ID',
        message: `Edge at index ${index} must have an ID`
      })
    }

    if (!edge.source) {
      errors.push({
        severity: 'error',
        code: 'MISSING_EDGE_SOURCE',
        message: `Edge ${edge.id || index} must have source`
      })
    }

    if (!edge.target) {
      errors.push({
        severity: 'error',
        code: 'MISSING_EDGE_TARGET',
        message: `Edge ${edge.id || index} must have target`
      })
    }

    // Check for duplicate edge IDs
    if (edge.id) {
      if (edgeIds.has(edge.id)) {
        errors.push({
          severity: 'error',
          code: 'DUPLICATE_EDGE_ID',
          message: `Duplicate edge ID: ${edge.id}`,
          edgeId: edge.id
        })
      }
      edgeIds.add(edge.id)
    }

    // Check if referenced nodes exist
    if (edge.source && !nodeIds.has(edge.source)) {
      errors.push({
        severity: 'error',
        code: 'INVALID_EDGE_SOURCE',
        message: `Edge ${edge.id} references non-existent source node: ${edge.source}`,
        edgeId: edge.id
      })
    }

    if (edge.target && !nodeIds.has(edge.target)) {
      errors.push({
        severity: 'error',
        code: 'INVALID_EDGE_TARGET',
        message: `Edge ${edge.id} references non-existent target node: ${edge.target}`,
        edgeId: edge.id
      })
    }
  })
}

/**
 * Validate variable references in the workflow
 */
function validateVariableReferences(
  dslFile: DifyDSLFile,
  errors: LintError[],
  warnings: LintError[]
): void {
  const nodes = dslFile.workflow.graph.nodes
  const nodeOutputs = new Map<string, string[]>()

  // Build map of node outputs
  nodes.forEach(node => {
    const outputs: string[] = []

    switch (node.type) {
      case NODE_TYPES.START:
        if (node.data.variables) {
          outputs.push(...node.data.variables.map((v: any) => v.variable))
        }
        break
      case NODE_TYPES.LLM:
        outputs.push('text')
        break
      case NODE_TYPES.HTTP_REQUEST:
        outputs.push('body', 'status_code', 'headers')
        break
      case NODE_TYPES.CODE:
        if (node.data.outputs) {
          outputs.push(...Object.keys(node.data.outputs))
        }
        break
    }

    nodeOutputs.set(node.id, outputs)
  })

  // Check variable references in node configurations
  nodes.forEach(node => {
    checkVariableReferencesInNode(node, nodeOutputs, errors, warnings)
  })
}

/**
 * Check variable references within a node
 */
function checkVariableReferencesInNode(
  node: DifyNode,
  nodeOutputs: Map<string, string[]>,
  errors: LintError[],
  warnings: LintError[]
): void {
  const nodeText = JSON.stringify(node.data)
  const variablePattern = /\{\{#([^#]+)#\}\}/g
  let match

  while ((match = variablePattern.exec(nodeText)) !== null) {
    const reference = match[1]
    const parts = reference.split('.')

    if (parts.length >= 2) {
      const nodeId = parts[0]
      const outputName = parts[1]

      if (!nodeOutputs.has(nodeId)) {
        errors.push({
          severity: 'error',
          code: 'INVALID_VARIABLE_REFERENCE',
          message: `Node ${node.id} references unknown node: ${nodeId}`,
          nodeId: node.id,
          context: reference
        })
      } else {
        const outputs = nodeOutputs.get(nodeId) || []
        if (!outputs.includes(outputName)) {
          warnings.push({
            severity: 'warning',
            code: 'UNKNOWN_OUTPUT_REFERENCE',
            message: `Node ${node.id} references unknown output: ${nodeId}.${outputName}`,
            nodeId: node.id,
            context: reference
          })
        }
      }
    }
  }
}

/**
 * Validate workflow flow logic
 */
/**
 * Generate performance and best practice suggestions
 */
function generateSuggestions(dslFile: DifyDSLFile, suggestions: LintSuggestion[]): void {
  const nodes = dslFile.workflow.graph.nodes
  const edges = dslFile.workflow.graph.edges

  // Complex workflow suggestions
  if (nodes.length > 10 && edges.length < nodes.length - 1) {
    suggestions.push({
      type: 'usability',
      message: 'Complex workflow might benefit from more descriptive node titles and comments.'
    })
  }

  // LLM usage suggestions
  const llmNodes = nodes.filter(n => n.type === NODE_TYPES.LLM)
  if (llmNodes.length > 3) {
    suggestions.push({
      type: 'performance',
      message: 'Multiple LLM nodes detected. Consider consolidating prompts for better performance.'
    })
  }

  // Security suggestions
  const httpNodes = nodes.filter(n => n.type === NODE_TYPES.HTTP_REQUEST)
  if (httpNodes.length > 0 && !dslFile.workflow.environment_variables.length) {
    suggestions.push({
      type: 'security',
      message: 'Consider using environment variables for API keys and sensitive data.'
    })
  }
}

// Additional validation functions for specific node types
function validateCodeNode(node: DifyNode, errors: LintError[], warnings: LintError[], suggestions: LintSuggestion[]): void {
  void node
  void errors
  void warnings
  void suggestions
  // Implementation for code node validation
}

function validateIfElseNode(node: DifyNode, errors: LintError[], warnings: LintError[]): void {
  void node
  void errors
  void warnings
  // Implementation for if-else node validation
}

function validateStartNode(node: DifyNode, errors: LintError[], warnings: LintError[]): void {
  void node
  void errors
  void warnings
  // Implementation for start node validation
}

function validateEndNode(node: DifyNode, errors: LintError[], warnings: LintError[]): void {
  void node
  void errors
  void warnings
  // Implementation for end node validation
}

/**
 * Quick validation for basic YAML structure
 */
export function quickValidateYAML(yamlContent: string): { isValid: boolean; error?: string } {
  try {
    yaml.load(yamlContent)
    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid YAML format'
    }
  }
}

/**
 * Format lint results for display
 */
export function formatLintResults(result: LintResult): string {
  let output = ''

  if (result.errors.length > 0) {
    output += '🚫 **Errors:**\n'
    result.errors.forEach(error => {
      output += `  - ${error.code}: ${error.message}\n`
    })
    output += '\n'
  }

  if (result.warnings.length > 0) {
    output += '⚠️ **Warnings:**\n'
    result.warnings.forEach(warning => {
      output += `  - ${warning.code}: ${warning.message}\n`
    })
    output += '\n'
  }

  if (result.suggestions.length > 0) {
    output += '💡 **Suggestions:**\n'
    result.suggestions.forEach(suggestion => {
      output += `  - ${suggestion.type}: ${suggestion.message}\n`
    })
    output += '\n'
  }

  if (result.isValid) {
    output += '✅ **DSL is valid and ready to use!**\n'
  }

  return output
}
