/**
 * API Client for DSLMaker Backend
 * Handles communication with FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface WorkflowRequest {
  description: string
  preferences?: {
    complexity?: 'simple' | 'moderate' | 'complex'
    max_iterations?: number
  }
  use_rag?: boolean
}

export interface WorkflowMetadata {
  name: string
  description: string
  complexity: string
  tags: string[]
}

export interface WorkflowResponse {
  workflow: any // Dify DSL
  metadata: WorkflowMetadata
  quality_score: number
  suggestions: string[]
  generation_time: number
}

export interface GenerationStatus {
  llm_service: any
  vector_store: any
  dsl_service: any
  multi_agent: {
    available: boolean
    agents: string[]
    pattern_library_size: number
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Check backend health
   */
  async checkHealth(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/health`)
    if (!response.ok) {
      throw new Error('Backend is not healthy')
    }
    return response.json()
  }

  /**
   * Get generation service status
   */
  async getGenerationStatus(): Promise<GenerationStatus> {
    const response = await fetch(`${this.baseUrl}/api/v1/generate/status`)
    if (!response.ok) {
      throw new Error('Failed to fetch generation status')
    }
    return response.json()
  }

  /**
   * Generate workflow using simple method
   */
  async generateSimple(request: WorkflowRequest): Promise<WorkflowResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/generate/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || 'Generation failed')
    }

    return response.json()
  }

  /**
   * Generate workflow using full RAG method
   */
  async generateFull(request: WorkflowRequest): Promise<WorkflowResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/generate/full`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || 'Generation failed')
    }

    return response.json()
  }

  /**
   * Generate workflow using multi-agent system (RECOMMENDED)
   */
  async generateMultiAgent(request: WorkflowRequest): Promise<WorkflowResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/generate/multi-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || 'Generation failed')
    }

    return response.json()
  }

  /**
   * Get pattern library
   */
  async getPatterns(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/patterns`)
    if (!response.ok) {
      throw new Error('Failed to fetch patterns')
    }
    return response.json()
  }

  /**
   * Search patterns
   */
  async searchPatterns(query: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/patterns/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      throw new Error('Failed to search patterns')
    }

    return response.json()
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for testing
export default ApiClient