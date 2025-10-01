/**
 * React Hook for Workflow Generation
 * Provides state management for multi-agent workflow generation
 */

import { useState, useCallback } from 'react'
import { apiClient, type WorkflowRequest, type WorkflowResponse } from '@/lib/api-client'

export type GenerationMethod = 'simple' | 'full' | 'multi-agent'

interface UseWorkflowGenerationState {
  loading: boolean
  error: string | null
  result: WorkflowResponse | null
  progress: string
}

interface UseWorkflowGenerationReturn extends UseWorkflowGenerationState {
  generate: (request: WorkflowRequest, method?: GenerationMethod) => Promise<WorkflowResponse | null>
  reset: () => void
}

export function useWorkflowGeneration(): UseWorkflowGenerationReturn {
  const [state, setState] = useState<UseWorkflowGenerationState>({
    loading: false,
    error: null,
    result: null,
    progress: '',
  })

  const generate = useCallback(async (
    request: WorkflowRequest,
    method: GenerationMethod = 'multi-agent'
  ): Promise<WorkflowResponse | null> => {
    setState({
      loading: true,
      error: null,
      result: null,
      progress: 'Initializing...',
    })

    try {
      // Select generation method
      let result: WorkflowResponse

      switch (method) {
        case 'simple':
          setState(prev => ({ ...prev, progress: 'Generating simple workflow...' }))
          result = await apiClient.generateSimple(request)
          break

        case 'full':
          setState(prev => ({ ...prev, progress: 'Generating with RAG...' }))
          result = await apiClient.generateFull(request)
          break

        case 'multi-agent':
        default:
          setState(prev => ({ ...prev, progress: 'Starting multi-agent generation...' }))
          result = await apiClient.generateMultiAgent(request)
          break
      }

      setState({
        loading: false,
        error: null,
        result,
        progress: 'Complete',
      })

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'

      setState({
        loading: false,
        error: errorMessage,
        result: null,
        progress: 'Failed',
      })

      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      result: null,
      progress: '',
    })
  }, [])

  return {
    ...state,
    generate,
    reset,
  }
}

/**
 * Hook for checking backend status
 */
export function useBackendStatus() {
  const [status, setStatus] = useState<{
    healthy: boolean
    checking: boolean
    services?: any
  }>({
    healthy: false,
    checking: true,
  })

  const checkStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, checking: true }))

    try {
      await apiClient.checkHealth()
      const services = await apiClient.getGenerationStatus()

      setStatus({
        healthy: true,
        checking: false,
        services,
      })
    } catch (error) {
      setStatus({
        healthy: false,
        checking: false,
      })
    }
  }, [])

  return {
    ...status,
    checkStatus,
  }
}