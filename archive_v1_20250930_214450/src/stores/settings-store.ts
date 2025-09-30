import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type LLMProvider = 'openai' | 'compatible'

export interface LLMSettings {
  provider: LLMProvider
  baseUrl: string
  modelName: string
  apiKey: string
  temperature: number
  maxTokens: number
  timeout: number
}

export interface LLMProviderConfig {
  name: string
  description: string
  defaultBaseUrl: string
  defaultModel: string
  models: string[]
}

interface SettingsState {
  llmSettings: LLMSettings
  isSettingsOpen: boolean
}

interface SettingsActions {
  updateLLMSettings: (settings: Partial<LLMSettings>) => void
  resetLLMSettings: () => void
  switchProvider: (provider: LLMProvider) => void
  openSettings: () => void
  closeSettings: () => void
  validateSettings: () => { isValid: boolean; errors: string[] }
  getProviderConfig: (provider: LLMProvider) => LLMProviderConfig
}

type SettingsStore = SettingsState & SettingsActions

// Provider configurations
export const LLM_PROVIDERS: Record<LLMProvider, LLMProviderConfig> = {
  openai: {
    name: 'OpenAI',
    description: 'Official OpenAI API',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  compatible: {
    name: 'OpenAI Compatible',
    description: 'OpenAI-compatible APIs (Sakura AI, LocalAI, etc.)',
    defaultBaseUrl: 'https://api.ai.sakura.ad.jp/v1',
    defaultModel: 'gpt-oss-120b',
    models: [
      'gpt-oss-120b',
      'gpt-oss-20b',
      'claude-3-haiku',
      'claude-3-sonnet',
      'llama-3-70b',
      'mixtral-8x7b'
    ]
  }
}

const defaultLLMSettings: LLMSettings = {
  provider: 'openai',
  baseUrl: LLM_PROVIDERS.openai.defaultBaseUrl,
  modelName: LLM_PROVIDERS.openai.defaultModel,
  apiKey: '',
  temperature: 0.7,
  maxTokens: 4000,
  timeout: 30000
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        llmSettings: defaultLLMSettings,
        isSettingsOpen: false,

        // Actions
        updateLLMSettings: (newSettings) => {
          set((state) => ({
            llmSettings: {
              ...state.llmSettings,
              ...newSettings
            }
          }))
        },

        resetLLMSettings: () => {
          set({ llmSettings: defaultLLMSettings })
        },

        switchProvider: (provider) => {
          const config = LLM_PROVIDERS[provider]
          set((state) => ({
            llmSettings: {
              ...state.llmSettings,
              provider,
              baseUrl: config.defaultBaseUrl,
              modelName: config.defaultModel
            }
          }))
        },

        openSettings: () => {
          set({ isSettingsOpen: true })
        },

        closeSettings: () => {
          set({ isSettingsOpen: false })
        },

        validateSettings: () => {
          const { llmSettings } = get()
          const errors: string[] = []

          if (!llmSettings.baseUrl.trim()) {
            errors.push('Base URL is required')
          } else {
            try {
              new URL(llmSettings.baseUrl)
            } catch {
              errors.push('Base URL must be a valid URL')
            }
          }

          if (!llmSettings.modelName.trim()) {
            errors.push('Model name is required')
          }

          if (!llmSettings.apiKey.trim()) {
            errors.push('API Key is required')
          }

          if (llmSettings.temperature < 0 || llmSettings.temperature > 2) {
            errors.push('Temperature must be between 0 and 2')
          }

          if (llmSettings.maxTokens < 1 || llmSettings.maxTokens > 32000) {
            errors.push('Max tokens must be between 1 and 32000')
          }

          if (llmSettings.timeout < 1000 || llmSettings.timeout > 300000) {
            errors.push('Timeout must be between 1 and 300 seconds')
          }

          return {
            isValid: errors.length === 0,
            errors
          }
        },

        getProviderConfig: (provider) => {
          return LLM_PROVIDERS[provider]
        }
      }),
      {
        name: 'settings-store',
        partialize: (state) => ({
          llmSettings: state.llmSettings
        })
      }
    ),
    {
      name: 'settings-store'
    }
  )
)