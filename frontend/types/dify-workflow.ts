/**
 * Dify DSL Workflow and Complete DSL Type Definitions
 * Based on Dify 0.4.0 real exports
 */

import { DifyGraph, DifyConversationVariable } from './dify-base'

// =============================================================================
// FEATURES
// =============================================================================

export interface DifyFileUploadImage {
  enabled?: boolean
  number_limits?: number
  transfer_methods?: string[]
}

export interface DifyFileUploadConfig {
  audio_file_size_limit?: number
  batch_count_limit?: number
  file_size_limit?: number
  image_file_size_limit?: number
  video_file_size_limit?: number
  workflow_file_upload_limit?: number
}

export interface DifyFileUpload {
  image: DifyFileUploadImage
  enabled?: boolean
  allowed_file_types?: string[]
  allowed_file_extensions?: string[]
  allowed_file_upload_methods?: string[]
  fileUploadConfig?: DifyFileUploadConfig
  number_limits?: number
}

export interface DifyRetrieverResource {
  enabled?: boolean
}

export interface DifySensitiveWordAvoidance {
  enabled?: boolean
}

export interface DifySpeechToText {
  enabled?: boolean
}

export interface DifyTextToSpeech {
  enabled?: boolean
  language?: string
  voice?: string
}

export interface DifySuggestedQuestionsAfterAnswer {
  enabled?: boolean
}

export interface DifyFeatures {
  file_upload: DifyFileUpload
  opening_statement?: string
  retriever_resource?: DifyRetrieverResource
  sensitive_word_avoidance?: DifySensitiveWordAvoidance
  speech_to_text?: DifySpeechToText
  suggested_questions?: string[]
  suggested_questions_after_answer?: DifySuggestedQuestionsAfterAnswer
  text_to_speech?: DifyTextToSpeech
}

// =============================================================================
// WORKFLOW STRUCTURE
// =============================================================================

export interface DifyWorkflow {
  conversation_variables?: DifyConversationVariable[]
  environment_variables?: any[]
  features: DifyFeatures
  graph: DifyGraph
  rag_pipeline_variables?: any[]
}

// =============================================================================
// DEPENDENCIES
// =============================================================================

export interface DifyDependencyValue {
  marketplace_plugin_unique_identifier: string // e.g., "langgenius/openai:0.2.6@hash"
}

export interface DifyDependency {
  current_identifier?: string
  type?: string // default: "marketplace"
  value: DifyDependencyValue
}

// =============================================================================
// APP STRUCTURE
// =============================================================================

export interface DifyApp {
  name: string
  description?: string
  icon?: string // default: "🤖"
  icon_background?: string // default: "#FFEAD5"
  mode: string // workflow, advanced-chat, agent-chat, chat
  use_icon_as_answer_icon?: boolean
}

// =============================================================================
// MODEL CONFIG (for chat/agent-chat modes)
// =============================================================================

export interface DifyModelConfig {
  agent_mode?: Record<string, any>
  annotation_reply?: Record<string, any>
  chat_prompt_config?: Record<string, any>
  completion_prompt_config?: Record<string, any>
  dataset_configs?: Record<string, any>
  dataset_query_variable?: string
  external_data_tools?: any[]
  file_upload?: Record<string, any>
  model?: Record<string, any>
  more_like_this?: Record<string, any>
  opening_statement?: string
  pre_prompt?: string
  prompt_config?: Record<string, any>
  prompt_type?: string
  retriever_resource?: Record<string, any>
  sensitive_word_avoidance?: Record<string, any>
  speech_to_text?: Record<string, any>
  suggested_questions?: string[]
  suggested_questions_after_answer?: Record<string, any>
  text_to_speech?: Record<string, any>
  user_input_form?: Array<Record<string, any>>
  [key: string]: any // Allow extra fields
}

// =============================================================================
// COMPLETE DSL STRUCTURE
// =============================================================================

export interface DifyDSL {
  app: DifyApp
  kind?: string // default: "app"
  version?: string // default: "0.4.0"
  dependencies?: DifyDependency[]

  // For workflow/advanced-chat modes
  workflow?: DifyWorkflow

  // For chat/agent-chat modes
  model_config?: DifyModelConfig
}

// =============================================================================
// APP MODES
// =============================================================================

export const DIFY_APP_MODES = {
  WORKFLOW: 'workflow',
  ADVANCED_CHAT: 'advanced-chat',
  AGENT_CHAT: 'agent-chat',
  CHAT: 'chat',
} as const

export type DifyAppMode = typeof DIFY_APP_MODES[keyof typeof DIFY_APP_MODES]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if DSL is workflow-based (has workflow key)
 */
export function isDifyWorkflowMode(dsl: DifyDSL): boolean {
  return dsl.app.mode === 'workflow' || dsl.app.mode === 'advanced-chat'
}

/**
 * Check if DSL is chat-based (has model_config key)
 */
export function isDifyChatMode(dsl: DifyDSL): boolean {
  return dsl.app.mode === 'chat' || dsl.app.mode === 'agent-chat'
}

/**
 * Get nodes from DSL (handles both workflow and chat modes)
 */
export function getDifyNodes(dsl: DifyDSL) {
  return dsl.workflow?.graph?.nodes || []
}

/**
 * Get edges from DSL (handles both workflow and chat modes)
 */
export function getDifyEdges(dsl: DifyDSL) {
  return dsl.workflow?.graph?.edges || []
}

/**
 * Create empty Dify DSL template
 */
export function createEmptyDifyDSL(
  name: string,
  mode: DifyAppMode = 'workflow'
): DifyDSL {
  const dsl: DifyDSL = {
    app: {
      name,
      description: '',
      icon: '🤖',
      icon_background: '#FFEAD5',
      mode,
      use_icon_as_answer_icon: false,
    },
    kind: 'app',
    version: '0.4.0',
    dependencies: [],
  }

  if (mode === 'workflow' || mode === 'advanced-chat') {
    dsl.workflow = {
      conversation_variables: [],
      environment_variables: [],
      features: {
        file_upload: {
          image: {
            enabled: false,
            number_limits: 3,
            transfer_methods: ['local_file', 'remote_url'],
          },
          enabled: false,
        },
        opening_statement: '',
        retriever_resource: { enabled: false },
        sensitive_word_avoidance: { enabled: false },
        speech_to_text: { enabled: false },
        suggested_questions: [],
        suggested_questions_after_answer: { enabled: false },
        text_to_speech: { enabled: false, language: '', voice: '' },
      },
      graph: {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      },
      rag_pipeline_variables: [],
    }
  }

  return dsl
}
