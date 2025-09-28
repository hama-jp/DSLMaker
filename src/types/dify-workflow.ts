// Dify Workflow DSL Types based on the reference manual

import { NODE_TYPES, NodeType } from '@/constants/node-types'

export interface DifyApp {
  description?: string
  icon: string
  icon_background: string
  mode: 'workflow' | 'advanced-chat' | 'agent-chat' | 'chat'
  name: string
  use_icon_as_answer_icon?: boolean
}

export interface DifyEnvironmentVariable {
  variable: string
  name: string
  type?: 'string' | 'number' | 'boolean' | 'secret'
  value: string
}

export interface DifyFeatures {
  file_upload?: {
    enabled?: boolean
    image?: {
      enabled: boolean
      number_limits: number
      transfer_methods: ('local_file' | 'remote_url')[]
      max_size_mb?: number
    }
    number_limits?: number
    max_size_mb?: number
  }
  opening_statement?: string
  retriever_resource?: {
    enabled: boolean
    top_k?: number
  }
  sensitive_word_avoidance?: {
    enabled: boolean
    type: 'moderation'
  }
  speech_to_text?: {
    enabled: boolean
    provider: string
  }
  text_to_speech?: {
    enabled: boolean
    provider: string
    voice?: string
  }
  suggested_questions?: string[]
}

export interface DifyPosition {
  x: number
  y: number
}

export interface DifyEdge {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
  type: string
  zIndex?: number
  data: {
    isInIteration: boolean
    sourceType: string
    targetType: string
  }
}

export interface DifyVariable {
  variable: string
  name?: string
  type: 'text-input' | 'number' | 'select' | 'file' | 'file-list' | 'object' | 'string' | 'boolean' | 'array[string]' | 'array[number]' | 'array[object]'
  label: string
  description?: string
  max_length?: number
  default?: string | number | boolean
  required?: boolean
  options?: Array<{ value: string | number; label: string }>
  enum?: (string | number)[]
}

export interface DifyModelConfig {
  provider: string
  name: string
  mode: 'chat' | 'completion'
  completion_params?: {
    temperature?: number
    top_p?: number
    max_tokens?: number
    presence_penalty?: number
    frequency_penalty?: number
    response_format?: 'text' | 'json_object'
  }
}

export interface DifyPromptMessage {
  role: 'system' | 'user' | 'assistant'
  text: string
}

export interface DifyMemoryConfig {
  enabled: boolean
  role_prefix?: {
    user: string
    assistant: string
  }
  window?: {
    enabled: boolean
    size: number
  }
}

export interface DifyCondition {
  id: string
  variable_selector: string[]
  comparison_operator:
    | 'contains' | 'not_contains' | 'is' | 'is_not' | 'in' | 'not_in'
    | 'empty' | 'not_empty' | 'greater_than' | 'less_than'
    | 'greater_than_or_equal' | 'less_than_or_equal'
  value: string | number | boolean
}

export interface DifyRetrievalConfig {
  top_k: number
  score_threshold: number
  reranking_enable?: boolean
  reranking_model?: {
    provider: string
    model: string
  }
}

export interface DifyMetadataFilter {
  key: string
  operator: 'equals' | 'not_equals' | 'contains' | 'gte' | 'lte'
  value: string | number
}

export interface DifyCodeInput {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  default?: unknown
}

export interface DifyCodeOutput {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
}

export interface DifyVariableAssignment {
  variable: string
  value_selector: string[]
}

export interface DifyVariableGroup {
  group_name: string
  variables: DifyVariableAssignment[]
}

export interface DifyOutput {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array[file]'
  value_selector: string[]
}

// Base node interface
export interface DifyNodeBase {
  id: string
  type: NodeType | string
  position: DifyPosition
  data: {
    title: string
    [key: string]: unknown
  }
}

// Specific node types
export interface DifyStartNode extends DifyNodeBase {
  type: typeof NODE_TYPES.START
  data: {
    title: string
    variables?: DifyVariable[]
  }
}

export interface DifyLLMNode extends DifyNodeBase {
  type: typeof NODE_TYPES.LLM
  data: {
    title: string
    model: DifyModelConfig
    prompt_template: DifyPromptMessage[] | string
    memory?: DifyMemoryConfig
    vision?: {
      enabled: boolean
    }
  }
}

export interface DifyKnowledgeRetrievalNode extends DifyNodeBase {
  type: typeof NODE_TYPES.KNOWLEDGE_RETRIEVAL
  data: {
    title: string
    query_variable_selector: string[]
    dataset_ids: string[]
    retrieval_mode: 'multiWay' | 'oneWay'
    multiple_retrieval_config?: DifyRetrievalConfig
    metadata_filters?: DifyMetadataFilter[]
  }
}

export interface DifyCodeNode extends DifyNodeBase {
  type: typeof NODE_TYPES.CODE
  data: {
    title: string
    code_language: 'python3' | 'javascript'
    code: string
    inputs: Record<string, DifyCodeInput>
    outputs: Record<string, DifyCodeOutput>
  }
}

export interface DifyToolNode extends DifyNodeBase {
  type: 'tool'
  data: {
    title: string
    provider_type: 'builtin' | 'app' | 'workflow'
    provider_id: string
    tool_name: string
    tool_parameters: Record<string, unknown>
    tool_configurations?: Record<string, unknown>
    error_strategy?: 'default_value' | 'fail_branch'
    default_value?: string
  }
}

export interface DifyIfElseNode extends DifyNodeBase {
  type: typeof NODE_TYPES.IF_ELSE
  data: {
    title: string
    logical_operator: 'and' | 'or'
    conditions: DifyCondition[]
  }
}

export interface DifyIterationNode extends DifyNodeBase {
  type: 'iteration'
  data: {
    title: string
    iterator_selector: string[]
    is_parallel?: boolean
    parallel_nums?: number
    error_strategy?: 'terminated' | 'continue on error' | 'remove abnormal output'
  }
}

export interface DifyTemplateNode extends DifyNodeBase {
  type: typeof NODE_TYPES.TEMPLATE_TRANSFORM
  data: {
    title: string
    template: string
    variables: string[][]
  }
}

export interface DifyVariableAssignerNode extends DifyNodeBase {
  type: 'variable-assigner'
  data: {
    title: string
    variables: DifyVariableAssignment[]
  }
}

export interface DifyVariableAggregatorNode extends DifyNodeBase {
  type: 'variable-aggregator'
  data: {
    title: string
    groups: DifyVariableGroup[]
  }
}

export interface DifyEndNode extends DifyNodeBase {
  type: typeof NODE_TYPES.END
  data: {
    title: string
    outputs: Record<string, DifyOutput>
  }
}

// Additional node types from technical reference
export interface DifyHTTPRequestNode extends DifyNodeBase {
  type: typeof NODE_TYPES.HTTP_REQUEST
  data: {
    title: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'
    url: string
    headers?: Record<string, string>
    params?: Record<string, unknown>
    body?: {
      type: 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw'
      data: unknown
    }
    auth?: {
      type: 'bearer_token' | 'api_key' | 'basic_auth' | 'custom'
      config: Record<string, string>
    }
    timeout?: number
    max_retries?: number
    retry_interval?: number
  }
}

export interface DifyTemplateTransformNode extends DifyNodeBase {
  type: 'template-transform'
  data: {
    title: string
    template: string
    variables: Array<{
      variable: string
      value_selector: string[]
    }>
  }
}

export interface DifyParameterExtractorNode extends DifyNodeBase {
  type: 'parameter-extractor'
  data: {
    title: string
    query: string
    model: DifyModelConfig
    parameters: Array<{
      name: string
      type: 'string' | 'number' | 'boolean' | 'array[string]' | 'array[number]' | 'object'
      required: boolean
      description: string
      enum?: (string | number)[]
    }>
    instruction?: string
    inference_mode: 'function_call' | 'prompt'
  }
}

export interface DifyAgentNode extends DifyNodeBase {
  type: 'agent'
  data: {
    title: string
    agent_mode: 'function_calling' | 'react'
    model: DifyModelConfig
    tools: Array<{
      type: 'builtin_tool' | 'api_tool' | 'workflow_tool'
      provider_id: string
      provider_type: string
      tool_name: string
      tool_parameters: Record<string, unknown>
    }>
    query: string
    instruction: string
    max_iteration: number
    memory?: DifyMemoryConfig
  }
}

export interface DifyConversationVariablesNode extends DifyNodeBase {
  type: 'conversation-variables'
  data: {
    title: string
    conversation_variables: Array<{
      variable: string
      type: 'string' | 'number' | 'boolean' | 'object' | 'array[object]'
      description: string
      default_value: unknown
    }>
    scope: 'session' | 'user'
  }
}

export interface DifyListOperatorNode extends DifyNodeBase {
  type: 'list-operator'
  data: {
    title: string
    input_variables: string[]
    filter_conditions?: Array<{
      attribute: string
      operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'less_than' | 'greater_than'
      value: unknown
    }>
    sorting?: Array<{
      field: string
      order: 'asc' | 'desc'
    }>
    limit?: number
    extract_attributes?: string[]
    output_variables: string[]
  }
}

export interface DifyDocumentExtractorNode extends DifyNodeBase {
  type: 'document-extractor'
  data: {
    title: string
    variable_selector: string[]
    extraction_mode: 'automatic' | 'manual'
    supported_formats?: string[]
    outputs?: {
      text?: string
      segments?: string
      metadata?: string
    }
  }
}

export interface DifyQuestionClassifierNode extends DifyNodeBase {
  type: 'question-classifier'
  data: {
    title: string
    model: DifyModelConfig
    query_variable_selector: string[]
    classes: Array<{
      id: string
      name: string
      description: string
    }>
    instructions?: string
    memory?: DifyMemoryConfig
  }
}

export interface DifyLoopNode extends DifyNodeBase {
  type: 'loop'
  data: {
    title: string
    loop_termination_condition: string
    max_iterations: number
    loop_variables: Array<{
      name: string
      type: 'string' | 'number' | 'boolean' | 'array' | 'object'
      default_value: unknown
    }>
    iteration_workflow: {
      nodes: DifyNode[]
    }
  }
}

export type DifyNode =
  | DifyStartNode
  | DifyLLMNode
  | DifyKnowledgeRetrievalNode
  | DifyCodeNode
  | DifyToolNode
  | DifyIfElseNode
  | DifyIterationNode
  | DifyTemplateNode
  | DifyVariableAssignerNode
  | DifyVariableAggregatorNode
  | DifyHTTPRequestNode
  | DifyTemplateTransformNode
  | DifyParameterExtractorNode
  | DifyAgentNode
  | DifyConversationVariablesNode
  | DifyListOperatorNode
  | DifyDocumentExtractorNode
  | DifyQuestionClassifierNode
  | DifyLoopNode
  | DifyEndNode

export interface DifyViewport {
  x: number
  y: number
  zoom: number
}

export interface DifyWorkflowGraph {
  edges: DifyEdge[]
  nodes: DifyNode[]
  viewport?: DifyViewport
}

export interface DifyWorkflow {
  conversation_variables?: unknown[]
  environment_variables: DifyEnvironmentVariable[]
  features: DifyFeatures
  graph: DifyWorkflowGraph
}

export interface DifyDSLFile {
  app: DifyApp
  kind: 'app'
  version: string
  workflow: DifyWorkflow
}

// Validation types
export interface ValidationError {
  type: 'error' | 'warning'
  code: string
  message: string
  nodeId?: string
  edgeId?: string
  details?: Record<string, unknown>
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

// DSL Parsing and Generation types
export interface DSLParseResult {
  success: boolean
  workflow?: DifyDSLFile
  errors: string[]
}

export interface DSLGenerateOptions {
  format?: 'yaml' | 'json'
  includeComments?: boolean
  validateBeforeGenerate?: boolean
}
