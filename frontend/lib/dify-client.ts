/**
 * Dify DSL API Client
 * Handles Dify-specific API operations
 */

import { DifyDSL } from '@/types'
import { validateDifyDSL } from './dify-validation'
import * as yaml from 'js-yaml'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// =============================================================================
// API TYPES
// =============================================================================

export interface DifyValidationResponse {
  valid: boolean
  errors: string[]
  warnings?: string[]
  stats?: {
    node_count: number
    edge_count: number
    node_types: string[]
  }
}

export interface DifyConversionResponse {
  dsl: DifyDSL
  metadata: {
    source_format: string
    conversion_time: number
  }
  warnings?: string[]
}

// =============================================================================
// DIFY API CLIENT
// =============================================================================

class DifyClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Validate Dify DSL structure
   */
  async validateDSL(dsl: DifyDSL): Promise<DifyValidationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/dify/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dsl),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Validation failed' }))
        throw new Error(error.detail || 'Validation failed')
      }

      return response.json()
    } catch (error) {
      // Fallback to client-side validation if backend is unavailable
      console.warn('Backend validation failed, using client-side validation:', error)
      const validation = validateDifyDSL(dsl)
      return {
        valid: validation.valid,
        errors: validation.errors,
      }
    }
  }

  /**
   * Convert custom DSL to Dify format
   */
  async convertToDify(customDSL: any): Promise<DifyConversionResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/dify/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customDSL),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Conversion failed' }))
      throw new Error(error.detail || 'Conversion failed')
    }

    return response.json()
  }

  /**
   * Import Dify DSL from YAML string
   */
  async importFromYAML(yamlString: string): Promise<DifyDSL> {
    try {
      const dsl = yaml.load(yamlString) as DifyDSL

      // Validate structure
      const validation = await this.validateDSL(dsl)
      if (!validation.valid) {
        throw new Error(`Invalid Dify DSL: ${validation.errors.join(', ')}`)
      }

      return dsl
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse YAML: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Export Dify DSL to YAML string
   */
  exportToYAML(dsl: DifyDSL): string {
    try {
      return yaml.dump(dsl, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate YAML: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Download DSL as YAML file
   */
  downloadAsYAML(dsl: DifyDSL, filename?: string) {
    const yamlContent = this.exportToYAML(dsl)
    const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename || `${dsl.app.name || 'workflow'}-${Date.now()}.yaml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Import DSL from file
   */
  async importFromFile(file: File): Promise<DifyDSL> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          const dsl = await this.importFromYAML(content)
          resolve(dsl)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsText(file)
    })
  }
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

export const difyClient = new DifyClient()

// Export class for testing
export default DifyClient
