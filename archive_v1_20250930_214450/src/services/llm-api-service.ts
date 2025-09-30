/**
 * LLM API Service for Multi-Agent System
 *
 * This service adapts the existing LLMService implementation for use
 * in the multi-agent workflow generation system. It handles both
 * GPT-5 /responses endpoint and traditional /chat/completions.
 */

import { LLMService, LLMSettings, LLMResponse } from '@/utils/llm-service'

export interface AgentLLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
  verbosity?: 'low' | 'medium' | 'high'
  effort?: 'minimal' | 'low' | 'medium' | 'high'
}

export interface AgentLLMResponse {
  success: boolean
  content?: string
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Multi-Agent LLM API Service
 * Uses the existing LLMService infrastructure with agent-optimized settings
 */
export class LLMAPIService {
  private llmService: LLMService

  constructor() {
    // Initialize with environment variables (same as existing implementation)
    const settings: LLMSettings = {
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.1,
      maxTokens: 1000
    }

    this.llmService = new LLMService(settings)
  }

  /**
   * Make a completion request using the existing LLM service
   */
  async complete(request: AgentLLMRequest): Promise<AgentLLMResponse> {
    try {
      console.log(`🤖 Multi-Agent LLM Request`)
      console.log(`📋 Messages: ${request.messages.length}`)
      console.log(`🌡️ Max tokens: ${request.maxTokens || 1000}`)
      console.log(`🎯 Verbosity: ${request.verbosity || 'low'}`)
      console.log(`⚡ Effort: ${request.effort || 'high'}`)

      // Use the existing LLMService private makeRequest method (via reflection)
      const response = await (this.llmService as any).makeRequest(request.messages, {
        temperature: request.temperature,
        maxTokens: request.maxTokens || 1000,
        verbosity: request.verbosity || 'low',
        effort: request.effort || 'high'
      })

      if (!response.success) {
        console.error('❌ Multi-Agent LLM Error:', response.error)
        return {
          success: false,
          error: response.error
        }
      }

      console.log(`✅ Multi-Agent Response received (${response.usage?.totalTokens || 0} tokens)`)
      console.log(`📝 Response length: ${response.content?.length || 0} characters`)

      return {
        success: true,
        content: response.content,
        usage: response.usage ? {
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens
        } : undefined
      }

    } catch (error) {
      console.error('❌ Multi-Agent API Service Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test the LLM API connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const service = new LLMAPIService()
      const testRequest: AgentLLMRequest = {
        messages: [
          { role: 'user', content: 'Hello! Please respond with "Connection successful" if you can read this.' }
        ],
        maxTokens: 10,
        temperature: 0
      }

      const response = await service.complete(testRequest)
      console.log('🔍 Connection test response:', response.content)

      return response.success && response.content ? (
        response.content.toLowerCase().includes('connection successful') ||
        response.content.toLowerCase().includes('hello') ||
        response.content.trim().length > 0
      ) : false
    } catch (error) {
      console.error('❌ Connection test failed:', error)
      return false
    }
  }

  /**
   * Get current configuration
   */
  static getConfiguration() {
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.OPENAI_MODEL || 'gpt-4'
    const apiKey = process.env.OPENAI_API_KEY || ''

    return {
      baseURL,
      model,
      hasApiKey: !!apiKey,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set'
    }
  }

  /**
   * Estimate token usage for a request
   */
  static estimateTokens(messages: Array<{ role: string; content: string }>): number {
    // Rough estimation: ~4 characters per token
    const totalChars = messages.reduce((total, msg) => total + msg.content.length, 0)
    return Math.ceil(totalChars / 4) + 50 // Add overhead for message structure
  }

  /**
   * Create a completion request for requirement analysis
   */
  static async analyzeRequirements(userInput: string, analysisType: string = 'general'): Promise<AgentLLMResponse> {
    const systemPrompt = `You are an expert requirements analyst for workflow automation systems.
Your task is to analyze user requests and identify:
1. Business intent and goals
2. Input data types and requirements
3. Expected outputs and format
4. Complexity level (Simple/Moderate/Complex/Enterprise)
5. Workflow type (DOCUMENT_PROCESSING, CUSTOMER_SERVICE, DATA_PROCESSING, etc.)

Analysis Type: ${analysisType}

Provide your analysis in a structured, clear format.`

    const service = new LLMAPIService()
    return await service.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      temperature: 0.1,
      maxTokens: 1000
    })
  }

  /**
   * Generate clarifying questions for ambiguous requirements
   */
  static async generateClarifyingQuestions(userInput: string, context: string = ''): Promise<AgentLLMResponse> {
    const systemPrompt = `You are a requirements clarification specialist. Your job is to identify ambiguities in user requests and generate specific, actionable clarifying questions.

Focus on:
- Unclear inputs or data types
- Vague output requirements
- Missing business logic or rules
- Undefined integration needs
- Performance or scale requirements
- Security or compliance constraints

Generate 3-5 specific questions that would help clarify the requirements.`

    const userPrompt = context ?
      `User Request: ${userInput}\n\nContext: ${context}\n\nWhat clarifying questions should be asked?` :
      `User Request: ${userInput}\n\nWhat clarifying questions should be asked?`

    const service = new LLMAPIService()
    return await service.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      maxTokens: 800
    })
  }
}

export default LLMAPIService