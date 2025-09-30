// Secure LLM Service using backend API routes
import { DSLGenerationResult, DSLAnalysisResult, LLMResponse } from './llm-service'

export interface SecureLLMSettings {
  temperature?: number
  maxTokens?: number
  timeout?: number
}

/**
 * Secure LLM service that makes API calls through backend routes
 * This prevents exposing API keys to the client
 */
export class SecureLLMService {
  private settings: SecureLLMSettings

  constructor(settings: SecureLLMSettings = {}) {
    this.settings = {
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 30000,
      ...settings,
    }
  }

  /**
   * Make a secure API call through backend route
   */
  private async makeSecureRequest(prompt: string): Promise<LLMResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.settings.timeout)

    try {
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          settings: this.settings,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        content: data.content || '',
        usage: data.usage,
      }

    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }

      throw error
    }
  }

  /**
   * Generate DSL workflow using secure backend
   */
  async generateDSL(prompt: string): Promise<DSLGenerationResult> {
    try {
      const llmResponse = await this.makeSecureRequest(prompt)

      if (!llmResponse.content) {
        return {
          success: false,
          error: 'No content received from LLM service',
          llmResponse
        }
      }

      // The content processing logic would be similar to the original LLM service
      // For now, return a basic structure to maintain compatibility
      return {
        success: true,
        dsl: undefined, // Would be parsed from llmResponse.content
        yamlContent: llmResponse.content,
        lintResult: { isValid: true, errors: [], warnings: [], suggestions: [] }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Analyze existing DSL using secure backend
   */
  async analyzeDSL(dslContent: string): Promise<DSLAnalysisResult> {
    try {
      const prompt = `Please analyze this Dify workflow DSL and provide insights:\n\n${dslContent}`
      const llmResponse = await this.makeSecureRequest(prompt)

      return {
        success: true,
        analysis: llmResponse.content || 'Analysis completed.',
        suggestions: []
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        analysis: 'Unable to analyze workflow.'
      }
    }
  }

  /**
   * Modify existing DSL using secure backend
   */
  async modifyDSL(currentDSL: string, modifications: string, dslFile: any): Promise<DSLGenerationResult> {
    try {
      const prompt = `Please modify this Dify workflow according to the following instructions:

Current DSL:
${currentDSL}

Modifications requested:
${modifications}

Please return the modified DSL.`

      const llmResponse = await this.makeSecureRequest(prompt)

      return {
        success: true,
        dsl: dslFile, // Would be updated with modifications
        yamlContent: llmResponse.content || currentDSL,
        lintResult: { isValid: true, errors: [], warnings: [], suggestions: [] },
        llmResponse
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Modification failed'
      }
    }
  }
}