/**
 * Knowledge Retrieval Node Generator
 *
 * This module generates optimized Knowledge Retrieval nodes based on
 * business requirements, workflow context, and RAG implementation patterns.
 */

import { RequirementAnalysis } from '../requirement-analyzer'
import { NODE_TYPES } from '@/constants/node-types'

export interface KnowledgeRetrievalNodeConfig {
  id: string
  type: typeof NODE_TYPES.KNOWLEDGE_RETRIEVAL
  position: { x: number; y: number }
  data: {
    title: string
    dataset_ids: string[]
    retrieval_mode: 'single' | 'multiple' | 'hybrid'
    reranking_enable: boolean
    reranking_mode?: 'reranking_model' | 'weighted_score'
    reranking_model?: {
      provider: string
      model: string
    }
    weights?: {
      keyword_setting: {
        keyword_weight: number
      }
      vector_setting: {
        vector_weight: number
        search_method: 'semantic_search' | 'full_text_search' | 'hybrid_search'
        top_k: number
        score_threshold: number
      }
    }
    top_k: number
    score_threshold: number
    variable: string
  }
}

export interface KnowledgeRetrievalGenerationContext {
  workflowType: string
  complexity: string
  businessLogic: string[]
  integrationNeeds: string[]
  position: { x: number; y: number }
  nodeIndex: number
  inputVariable?: string
  outputVariable?: string
}

/**
 * Advanced Knowledge Retrieval Node Generator
 */
export class KnowledgeRetrievalGenerator {

  /**
   * Generate optimized Knowledge Retrieval node based on context
   */
  static generateNode(context: KnowledgeRetrievalGenerationContext): KnowledgeRetrievalNodeConfig {
    const config = this.getBaseConfiguration(context)

    // Apply workflow-specific optimizations
    this.applyWorkflowOptimizations(config, context)

    // Apply complexity-based enhancements
    this.applyComplexityEnhancements(config, context)

    // Apply business logic requirements
    this.applyBusinessLogicRequirements(config, context)

    return config
  }

  /**
   * Get base configuration for Knowledge Retrieval node
   */
  private static getBaseConfiguration(context: KnowledgeRetrievalGenerationContext): KnowledgeRetrievalNodeConfig {
    return {
      id: `knowledge-retrieval-${context.nodeIndex}`,
      type: NODE_TYPES.KNOWLEDGE_RETRIEVAL,
      position: context.position,
      data: {
        title: this.generateTitle(context),
        dataset_ids: ['default-knowledge-base'],
        retrieval_mode: 'hybrid',
        reranking_enable: true,
        reranking_mode: 'reranking_model',
        reranking_model: {
          provider: 'openai',
          model: 'text-embedding-3-small'
        },
        weights: {
          keyword_setting: {
            keyword_weight: 0.3
          },
          vector_setting: {
            vector_weight: 0.7,
            search_method: 'hybrid_search',
            top_k: 10,
            score_threshold: 0.5
          }
        },
        top_k: 5,
        score_threshold: 0.6,
        variable: context.outputVariable || 'retrieved_knowledge'
      }
    }
  }

  /**
   * Generate contextual title for the node
   */
  private static generateTitle(context: KnowledgeRetrievalGenerationContext): string {
    const titleMappings = {
      'CUSTOMER_SERVICE': 'FAQ & Knowledge Search',
      'DOCUMENT_PROCESSING': 'Document Knowledge Retrieval',
      'CONTENT_GENERATION': 'Content Research & References',
      'DATA_PROCESSING': 'Data Context Retrieval',
      'API_INTEGRATION': 'API Documentation Lookup',
      'AUTOMATION': 'Process Knowledge Retrieval',
      'ANALYSIS': 'Analysis Context Gathering'
    }

    return titleMappings[context.workflowType as keyof typeof titleMappings] || 'Knowledge Retrieval'
  }

  /**
   * Apply workflow-specific optimizations
   */
  private static applyWorkflowOptimizations(
    config: KnowledgeRetrievalNodeConfig,
    context: KnowledgeRetrievalGenerationContext
  ): void {
    switch (context.workflowType) {
      case 'CUSTOMER_SERVICE':
        // Optimize for FAQ and support documentation
        config.data.retrieval_mode = 'hybrid'
        config.data.top_k = 3
        config.data.score_threshold = 0.7
        config.data.weights!.keyword_setting.keyword_weight = 0.4
        config.data.weights!.vector_setting.vector_weight = 0.6
        break

      case 'DOCUMENT_PROCESSING':
        // Optimize for document similarity and context
        config.data.retrieval_mode = 'multiple'
        config.data.top_k = 8
        config.data.score_threshold = 0.5
        config.data.weights!.vector_setting.search_method = 'semantic_search'
        break

      case 'CONTENT_GENERATION':
        // Optimize for creative and reference materials
        config.data.retrieval_mode = 'multiple'
        config.data.top_k = 10
        config.data.score_threshold = 0.4
        config.data.reranking_enable = true
        break

      case 'API_INTEGRATION':
        // Optimize for precise documentation lookup
        config.data.retrieval_mode = 'single'
        config.data.top_k = 2
        config.data.score_threshold = 0.8
        config.data.weights!.keyword_setting.keyword_weight = 0.6
        break

      default:
        // Default balanced configuration
        break
    }
  }

  /**
   * Apply complexity-based enhancements
   */
  private static applyComplexityEnhancements(
    config: KnowledgeRetrievalNodeConfig,
    context: KnowledgeRetrievalGenerationContext
  ): void {
    switch (context.complexity) {
      case 'Simple':
        config.data.retrieval_mode = 'single'
        config.data.reranking_enable = false
        config.data.top_k = 3
        break

      case 'Moderate':
        config.data.retrieval_mode = 'hybrid'
        config.data.reranking_enable = true
        config.data.top_k = 5
        break

      case 'Complex':
        config.data.retrieval_mode = 'multiple'
        config.data.reranking_enable = true
        config.data.reranking_mode = 'weighted_score'
        config.data.top_k = 8
        break

      case 'Enterprise':
        config.data.retrieval_mode = 'hybrid'
        config.data.reranking_enable = true
        config.data.reranking_mode = 'reranking_model'
        config.data.top_k = 10
        config.data.weights!.vector_setting.top_k = 15
        break
    }
  }

  /**
   * Apply business logic requirements
   */
  private static applyBusinessLogicRequirements(
    config: KnowledgeRetrievalNodeConfig,
    context: KnowledgeRetrievalGenerationContext
  ): void {
    // High precision requirements
    if (context.businessLogic.some(logic =>
      logic.includes('validation') || logic.includes('verification'))) {
      config.data.score_threshold = Math.max(config.data.score_threshold, 0.7)
      config.data.top_k = Math.min(config.data.top_k, 3)
    }

    // Real-time requirements
    if (context.businessLogic.some(logic =>
      logic.includes('real-time') || logic.includes('instant'))) {
      config.data.top_k = Math.min(config.data.top_k, 5)
      config.data.reranking_enable = false
    }

    // Comprehensive search requirements
    if (context.businessLogic.some(logic =>
      logic.includes('comprehensive') || logic.includes('thorough'))) {
      config.data.top_k = Math.max(config.data.top_k, 8)
      config.data.score_threshold = Math.min(config.data.score_threshold, 0.4)
    }
  }

  /**
   * Generate prompt fragment for Knowledge Retrieval node
   */
  static generatePromptFragment(context: KnowledgeRetrievalGenerationContext): string {
    return `
### KNOWLEDGE RETRIEVAL NODE SPECIFICATION

For ${context.workflowType} workflows with ${context.complexity} complexity:

**Node Configuration:**
- Type: knowledge-retrieval
- Title: "${this.generateTitle(context)}"
- Retrieval Mode: ${this.getOptimalRetrievalMode(context)}
- Top K Results: ${this.getOptimalTopK(context)}
- Score Threshold: ${this.getOptimalScoreThreshold(context)}

**RAG Optimization:**
- Reranking: ${this.shouldEnableReranking(context) ? 'Enabled' : 'Disabled'}
- Search Method: ${this.getOptimalSearchMethod(context)}
- Weight Distribution: Keyword(${this.getKeywordWeight(context)}) + Vector(${this.getVectorWeight(context)})

**Variable Flow:**
- Input: {{#${context.inputVariable || 'previous_node.output'}#}}
- Output Variable: "${context.outputVariable || 'retrieved_knowledge'}"

**Business Logic Integration:**
${context.businessLogic.map(logic => `- ${logic}`).join('\n')}

This node MUST implement enterprise-grade RAG with optimized retrieval for ${context.workflowType} use cases.
`
  }

  // Helper methods for prompt generation
  private static getOptimalRetrievalMode(context: KnowledgeRetrievalGenerationContext): string {
    if (context.complexity === 'Simple') return 'single'
    if (context.workflowType === 'API_INTEGRATION') return 'single'
    return 'hybrid'
  }

  private static getOptimalTopK(context: KnowledgeRetrievalGenerationContext): number {
    const baseTopK = context.complexity === 'Simple' ? 3 :
                     context.complexity === 'Moderate' ? 5 : 8

    // Adjust based on workflow type
    if (context.workflowType === 'CONTENT_GENERATION') return baseTopK + 2
    if (context.workflowType === 'API_INTEGRATION') return Math.min(baseTopK, 3)

    return baseTopK
  }

  private static getOptimalScoreThreshold(context: KnowledgeRetrievalGenerationContext): number {
    if (context.workflowType === 'API_INTEGRATION') return 0.8
    if (context.complexity === 'Simple') return 0.7
    if (context.complexity === 'Enterprise') return 0.5
    return 0.6
  }

  private static shouldEnableReranking(context: KnowledgeRetrievalGenerationContext): boolean {
    return context.complexity !== 'Simple' &&
           !context.businessLogic.some(logic => logic.includes('real-time'))
  }

  private static getOptimalSearchMethod(context: KnowledgeRetrievalGenerationContext): string {
    if (context.workflowType === 'DOCUMENT_PROCESSING') return 'semantic_search'
    if (context.workflowType === 'API_INTEGRATION') return 'full_text_search'
    return 'hybrid_search'
  }

  private static getKeywordWeight(context: KnowledgeRetrievalGenerationContext): number {
    if (context.workflowType === 'API_INTEGRATION') return 0.6
    if (context.workflowType === 'CUSTOMER_SERVICE') return 0.4
    return 0.3
  }

  private static getVectorWeight(context: KnowledgeRetrievalGenerationContext): number {
    return 1.0 - this.getKeywordWeight(context)
  }

  /**
   * Validate generated Knowledge Retrieval node configuration
   */
  static validateConfiguration(config: KnowledgeRetrievalNodeConfig): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Required field validation
    if (!config.data.title) errors.push('Title is required')
    if (!config.data.variable) errors.push('Output variable is required')
    if (config.data.top_k < 1 || config.data.top_k > 20) {
      errors.push('Top K must be between 1 and 20')
    }
    if (config.data.score_threshold < 0 || config.data.score_threshold > 1) {
      errors.push('Score threshold must be between 0 and 1')
    }

    // Performance warnings
    if (config.data.top_k > 10 && config.data.reranking_enable) {
      warnings.push('High top_k with reranking may impact performance')
    }
    if (config.data.score_threshold < 0.3) {
      warnings.push('Low score threshold may return irrelevant results')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

export default KnowledgeRetrievalGenerator