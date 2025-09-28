// Dify Workflow Node Types and Definitions
// Based on analysis of https://github.com/langgenius/dify

export type DifyNodeType =
  // Basic Nodes
  | 'start'
  | 'end'
  | 'answer'

  // AI/LLM Nodes
  | 'llm'
  | 'agent'

  // Data Processing Nodes
  | 'code'
  | 'template-transform'
  | 'parameter-extractor'
  | 'variable-aggregator'
  | 'variable-assigner'

  // Knowledge & Information Nodes
  | 'knowledge-retrieval'
  | 'knowledge-index'
  | 'document-extractor'
  | 'datasource'

  // Control Flow Nodes
  | 'if-else'
  | 'loop'
  | 'iteration'
  | 'question-classifier'

  // External Integration Nodes
  | 'http-request'
  | 'tool'

  // List Operation Nodes
  | 'list-operator'

export interface DifyNodeConfig {
  id: string
  type: DifyNodeType
  title?: string
  description?: string
  position: {
    x: number
    y: number
  }
  data: DifyNodeData
}

export interface DifyNodeData {
  // Common properties
  title?: string
  desc?: string

  // Error handling
  error_strategy?: 'fail' | 'continue' | 'retry'
  retry_config?: {
    max_attempts: number
    retry_interval: number
  }

  // Node-specific data will be defined in individual interfaces
  [key: string]: unknown
}

// Start Node
export interface StartNodeData extends DifyNodeData {
  type: 'start'
  inputs?: Record<string, unknown>
  outputs?: string[]
}

// LLM Node
export interface LLMNodeData extends DifyNodeData {
  type: 'llm'
  model_config: {
    provider: string
    model: string
    temperature?: number
    max_tokens?: number
    top_p?: number
  }
  prompt_template: string
  memory_config?: {
    enabled: boolean
    window_size?: number
  }
  inputs: string[]
  outputs: string[]
}

// Code Node
export interface CodeNodeData extends DifyNodeData {
  type: 'code'
  code: string
  language: 'python' | 'javascript'
  inputs: string[]
  outputs: string[]
}

// HTTP Request Node
export interface HttpRequestNodeData extends DifyNodeData {
  type: 'http-request'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: string
  timeout?: number
  inputs: string[]
  outputs: string[]
}

// If/Else Node
export interface IfElseNodeData extends DifyNodeData {
  type: 'if-else'
  conditions: Array<{
    variable: string
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than'
    value: string | number | boolean
  }>
  logical_operator?: 'and' | 'or'
  inputs: string[]
  outputs: string[]
}

// Tool Node
export interface ToolNodeData extends DifyNodeData {
  type: 'tool'
  tool_name: string
  tool_parameters: Record<string, unknown>
  inputs: string[]
  outputs: string[]
}

// Answer Node
export interface AnswerNodeData extends DifyNodeData {
  type: 'answer'
  answer_template: string
  inputs: string[]
}

// End Node
export interface EndNodeData extends DifyNodeData {
  type: 'end'
  outputs?: Record<string, unknown>
}

// Union type for all node data types
export type DifyNodeDataUnion =
  | StartNodeData
  | LLMNodeData
  | CodeNodeData
  | HttpRequestNodeData
  | IfElseNodeData
  | ToolNodeData
  | AnswerNodeData
  | EndNodeData

// Edge/Connection definition
export interface DifyEdge {
  id: string
  source: string
  target: string
  source_output?: string
  target_input?: string
}

// Complete workflow definition
export interface DifyWorkflow {
  version: string
  kind: 'workflow'
  metadata: {
    name: string
    description?: string
    created_at?: string
    updated_at?: string
  }
  spec: {
    nodes: DifyNodeConfig[]
    edges: DifyEdge[]
    variables?: Record<string, unknown>
  }
}

// Node metadata for UI
export interface DifyNodeMetadata {
  type: DifyNodeType
  label: string
  description: string
  category: 'basic' | 'ai' | 'data' | 'knowledge' | 'control' | 'external' | 'list'
  icon: string
  inputs: Array<{
    key: string
    label: string
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    required: boolean
    description?: string
  }>
  outputs: Array<{
    key: string
    label: string
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    description?: string
  }>
  config: Array<{
    key: string
    label: string
    type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'code'
    required: boolean
    default?: unknown
    options?: Array<{ value: string | number; label: string }>
    description?: string
  }>
}