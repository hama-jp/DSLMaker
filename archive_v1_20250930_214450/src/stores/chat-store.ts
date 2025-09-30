import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestion?: WorkflowSuggestion
}

export interface WorkflowSuggestion {
  id: string
  type: 'workflow' | 'modification' | 'node_add' | 'node_modify' | 'node_remove'
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  data?: any // DSL data or modification instructions
}

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

interface ChatActions {
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  updateSuggestionStatus: (messageId: string, status: 'approved' | 'rejected') => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  sendMessage: (content: string) => Promise<void>
}

type ChatStore = ChatState & ChatActions

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      // State
      messages: [],
      isLoading: false,
      error: null,

      // Actions
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date()
        }
        set((state) => ({
          messages: [...state.messages, newMessage]
        }))
      },

      updateSuggestionStatus: (messageId, status) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId && msg.suggestion
              ? {
                  ...msg,
                  suggestion: {
                    ...msg.suggestion,
                    status
                  }
                }
              : msg
          )
        }))
      },

      clearMessages: () => {
        set({ messages: [] })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      sendMessage: async (content) => {
        const { addMessage, setLoading, setError } = get()

        try {
          setLoading(true)
          setError(null)

          // Add user message
          addMessage({
            type: 'user',
            content
          })

          // TODO: Replace with actual API call
          // Simulate API response for now
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Add assistant response with suggestion
          addMessage({
            type: 'assistant',
            content: 'AI分析中です。以下の提案を検討してください：',
            suggestion: {
              id: `suggestion-${Date.now()}`,
              type: 'workflow',
              title: 'Workflow Modification',
              description: `"${content}" に基づくワークフローの提案`,
              status: 'pending',
              data: {
                // This would contain actual DSL modifications
                action: 'modify',
                target: 'workflow',
                changes: {}
              }
            }
          })

        } catch (error) {
          setError(error instanceof Error ? error.message : 'Unknown error occurred')
        } finally {
          setLoading(false)
        }
      }
    }),
    {
      name: 'chat-store'
    }
  )
)