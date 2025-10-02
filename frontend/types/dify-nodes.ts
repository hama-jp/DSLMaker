/**
 * Dify DSL Node Type Definitions
 * Based on Dify 0.4.0 real exports
 *
 * All 15 node types with their specific data structures
 */

import { DifyVariableSelector } from './dify-base'

// =============================================================================
// START NODE
// =============================================================================

export interface DifyStartVariable {
  variable: string
  label: string
  type: string // text-input, paragraph, select, number-input, file
  required?: boolean
  max_length?: number
  options?: string[]
}

export interface DifyStartNodeData {
  type: 'start'
  title: string
  desc?: string
  selected?: boolean
  variables: DifyStartVariable[]
}

// =============================================================================
// END NODE
// =============================================================================

export interface DifyEndOutput {
  variable: string
  value_selector: DifyVariableSelector
}

export interface DifyEndNodeData {
  type: 'end'
  title: string
  desc?: string
  selected?: boolean
  outputs: DifyEndOutput[]
}

// =============================================================================
// LLM NODE
// =============================================================================

export interface DifyLLMPrompt {
  id: string // UUID
  role: string // system, user, assistant
  text: string // Can contain {{#node_id.field#}} references
}

export interface DifyLLMModel {
  provider: string // openai, anthropic, etc.
  name: string // gpt-4, claude-3, etc.
  mode: string // chat, completion
  completion_params: Record<string, any>
}

export interface DifyLLMContext {
  enabled?: boolean
  variable_selector?: any[]
}

export interface DifyLLMVision {
  enabled?: boolean
  configs?: Record<string, string> // {"detail": "high"}
}

export interface DifyLLMNodeData {
  type: 'llm'
  title: string
  desc?: string
  selected?: boolean
  model: DifyLLMModel
  prompt_template: DifyLLMPrompt[]
  variables?: any[]
  context: DifyLLMContext
  vision: DifyLLMVision

  // Iteration-specific fields
  isInIteration?: boolean
  iteration_id?: string
}

// =============================================================================
// IF-ELSE NODE
// =============================================================================

export interface DifyIfElseCondition {
  id: string
  variable_selector: DifyVariableSelector
  comparison_operator: string // is, is not, contains, not contains, etc.
  value: string
}

export interface DifyIfElseNodeData {
  type: 'if-else'
  title: string
  desc?: string
  selected?: boolean
  logical_operator?: string // and, or
  conditions: DifyIfElseCondition[]
}

// =============================================================================
// CODE NODE
// =============================================================================

export interface DifyCodeVariable {
  variable: string
  value_selector: DifyVariableSelector
}

export interface DifyCodeOutput {
  type: string // string, number, object, array[string], etc.
  children?: any
}

export interface DifyCodeNodeData {
  type: 'code'
  title: string
  desc?: string
  selected?: boolean
  code: string // Python code
  code_language?: string // default: python3
  variables: DifyCodeVariable[]
  outputs: Record<string, DifyCodeOutput>
}

// =============================================================================
// ITERATION NODE
// =============================================================================

export interface DifyIterationNodeData {
  type: 'iteration'
  title: string
  desc?: string
  selected?: boolean
  iterator_selector: DifyVariableSelector // array to iterate
  output_selector: DifyVariableSelector // last node in iteration
  output_type: string // array[string], array[object], etc.
  startNodeType: string // Type of first node in iteration
  start_node_id: string // ID of iteration-start node
  width?: number
  height?: number
}

export interface DifyIterationStartNodeData {
  type: 'iteration-start'
  title?: string
  desc?: string
  isInIteration?: boolean
}

// =============================================================================
// TEMPLATE TRANSFORM NODE
// =============================================================================

export interface DifyTemplateVariable {
  variable: string
  value_selector: DifyVariableSelector
}

export interface DifyTemplateTransformNodeData {
  type: 'template-transform'
  title: string
  desc?: string
  selected?: boolean
  template: string // Jinja2-like template
  variables: DifyTemplateVariable[]

  // Iteration-specific fields
  isInIteration?: boolean
  iteration_id?: string
}

// =============================================================================
// TOOL NODE
// =============================================================================

export interface DifyToolParameter {
  type: string // mixed, string, number, etc.
  value: string // Can contain {{#node_id.field#}} references
}

export interface DifyToolNodeData {
  type: 'tool'
  title: string
  desc?: string
  selected?: boolean
  provider_id: string // tavily, jina, etc.
  provider_name: string
  provider_type: string // builtin, api
  tool_name: string // tavily_search, jina_reader, etc.
  tool_label: string
  tool_parameters: Record<string, DifyToolParameter>
  tool_configurations: Record<string, any>

  // Iteration-specific fields
  isInIteration?: boolean
  iteration_id?: string
}

// =============================================================================
// ANSWER NODE (for advanced-chat mode)
// =============================================================================

export interface DifyAnswerNodeData {
  type: 'answer'
  title: string
  desc?: string
  selected?: boolean
  answer: string // Variable reference like {{#llm.text#}}
  variables?: any[]
}

// =============================================================================
// VARIABLE ASSIGNER NODE (for conversation variables)
// =============================================================================

export interface DifyAssignerItem {
  variable_selector: DifyVariableSelector // ["conversation", var_name]
  input_type: string // variable, constant
  value: DifyVariableSelector | string | number // Can be selector or literal
  operation: string // over-write, append, clear
  write_mode?: string // default: over-write
}

export interface DifyAssignerNodeData {
  type: 'assigner'
  title: string
  desc?: string
  selected?: boolean
  version?: string // default: "2"
  items: DifyAssignerItem[]

  // Iteration-specific fields
  isInIteration?: boolean
  iteration_id?: string
}

// =============================================================================
// VARIABLE AGGREGATOR NODE
// =============================================================================

export interface DifyVariableAggregatorNodeData {
  type: 'variable-aggregator'
  title: string
  desc?: string
  selected?: boolean
  output_type: string // string, array[string], etc.
  variables: DifyVariableSelector[] // List of [node_id, field_name] selectors

  // Iteration-specific fields
  isInIteration?: boolean
  iteration_id?: string
}

// =============================================================================
// DOCUMENT EXTRACTOR NODE
// =============================================================================

export interface DifyDocumentExtractorNodeData {
  type: 'document-extractor'
  title: string
  desc?: string
  selected?: boolean
  variable_selector: DifyVariableSelector // file input
  is_array_file?: boolean
}

// =============================================================================
// HTTP REQUEST NODE
// =============================================================================

export interface DifyHttpRequestHeader {
  key: string
  value: string
  type?: string // text, variable
}

export interface DifyHttpRequestNodeData {
  type: 'http-request'
  title: string
  desc?: string
  selected?: boolean
  method: string // GET, POST, PUT, DELETE, PATCH
  url: string
  headers?: DifyHttpRequestHeader[]
  params?: Record<string, string>
  body?: any
  timeout?: number

  // Iteration-specific fields
  isInIteration?: boolean
  iteration_id?: string
}

// =============================================================================
// QUESTION CLASSIFIER NODE
// =============================================================================

export interface DifyQuestionClassifierClass {
  id: string
  name: string
  description: string
}

export interface DifyQuestionClassifierNodeData {
  type: 'question-classifier'
  title: string
  desc?: string
  selected?: boolean
  model: DifyLLMModel
  classes: DifyQuestionClassifierClass[]
  query_variable_selector: DifyVariableSelector
}

// =============================================================================
// CUSTOM NOTE (not a functional node, just annotation)
// =============================================================================

export interface DifyCustomNoteNodeData {
  type: ''
  title?: string
  desc?: string
  selected?: boolean
  text: string // Rich text JSON
  author: string
  showAuthor?: boolean
  theme?: string // blue, yellow, pink, etc.
  width?: number
  height?: number
}

// =============================================================================
// UNION TYPE FOR ALL NODE DATA
// =============================================================================

export type DifyNodeData =
  | DifyStartNodeData
  | DifyEndNodeData
  | DifyLLMNodeData
  | DifyIfElseNodeData
  | DifyCodeNodeData
  | DifyIterationNodeData
  | DifyIterationStartNodeData
  | DifyTemplateTransformNodeData
  | DifyToolNodeData
  | DifyAnswerNodeData
  | DifyAssignerNodeData
  | DifyVariableAggregatorNodeData
  | DifyDocumentExtractorNodeData
  | DifyHttpRequestNodeData
  | DifyQuestionClassifierNodeData
  | DifyCustomNoteNodeData

// =============================================================================
// NODE TYPE CONSTANTS
// =============================================================================

export const DIFY_NODE_TYPES = {
  START: 'start',
  END: 'end',
  LLM: 'llm',
  IF_ELSE: 'if-else',
  CODE: 'code',
  ITERATION: 'iteration',
  ITERATION_START: 'iteration-start',
  TEMPLATE_TRANSFORM: 'template-transform',
  TOOL: 'tool',
  ANSWER: 'answer',
  ASSIGNER: 'assigner',
  VARIABLE_AGGREGATOR: 'variable-aggregator',
  DOCUMENT_EXTRACTOR: 'document-extractor',
  HTTP_REQUEST: 'http-request',
  QUESTION_CLASSIFIER: 'question-classifier',
  CUSTOM_NOTE: '',
} as const

export type DifyNodeType = typeof DIFY_NODE_TYPES[keyof typeof DIFY_NODE_TYPES]

// =============================================================================
// NODE TYPE COLORS (Dify UI convention)
// =============================================================================

export const DIFY_NODE_COLORS: Record<string, string> = {
  start: '#10B981', // green
  end: '#EF4444', // red
  llm: '#8B5CF6', // purple
  'if-else': '#F59E0B', // amber
  code: '#3B82F6', // blue
  iteration: '#EC4899', // pink
  'iteration-start': '#EC4899', // pink
  'template-transform': '#06B6D4', // cyan
  tool: '#14B8A6', // teal
  answer: '#10B981', // green
  assigner: '#6366F1', // indigo
  'variable-aggregator': '#8B5CF6', // purple
  'document-extractor': '#F59E0B', // amber
  'http-request': '#3B82F6', // blue
  'question-classifier': '#EC4899', // pink
  '': '#6B7280', // gray (custom note)
}
