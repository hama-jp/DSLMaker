/**
 * Chat utility functions for message management and formatting
 */

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    result?: any
    isGenerating?: boolean
    streamingContent?: string
    tokens?: number
  }
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2)}`
}

/**
 * Create a new chat message
 */
export function createMessage(
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): ChatMessage {
  return {
    ...message,
    id: generateMessageId(),
    timestamp: new Date()
  }
}

/**
 * Add a new message to the messages array
 */
export function addMessageToArray(
  messages: ChatMessage[],
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): { messages: ChatMessage[]; messageId: string } {
  const newMessage = createMessage(message)
  return {
    messages: [...messages, newMessage],
    messageId: newMessage.id
  }
}

/**
 * Update an existing message in the messages array
 */
export function updateMessageInArray(
  messages: ChatMessage[],
  messageId: string,
  updates: Partial<ChatMessage>
): ChatMessage[] {
  return messages.map(msg =>
    msg.id === messageId ? { ...msg, ...updates } : msg
  )
}

/**
 * Format lint results for display
 */
export function formatLintResults(lintResult: any): string {
  if (!lintResult) return ''

  if (lintResult.isValid) {
    return '✅ **DSL is valid and ready to use!**'
  }

  const errorCount = lintResult.errors?.length || 0
  const warningCount = lintResult.warnings?.length || 0

  let result = ''

  if (errorCount > 0 || warningCount > 0) {
    result += '💡 **Suggestions:**\n'

    if (lintResult.errors) {
      lintResult.errors.forEach((error: any) => {
        result += `  - error: ${error.message}\n`
      })
    }

    if (lintResult.warnings) {
      lintResult.warnings.forEach((warning: any) => {
        result += `  - ${warning.severity || 'best-practice'}: ${warning.message}\n`
      })
    }
  }

  if (lintResult.isValid) {
    result += '\n✅ **DSL is valid and ready to use!**'
  }

  return result
}

/**
 * Get message display properties
 */
export function getMessageDisplayProps(message: ChatMessage) {
  const isUser = message.type === 'user'
  const isSystem = message.type === 'system'

  return {
    isUser,
    isSystem,
    containerClass: `mb-4 ${isUser ? 'ml-8' : 'mr-8'}`,
    messageClass: `p-3 rounded-lg ${
      isUser
        ? 'bg-blue-500 text-white ml-auto'
        : isSystem
          ? 'bg-gray-100 text-gray-800'
          : 'bg-white border'
    } ${!isUser ? 'max-w-full' : 'max-w-fit ml-auto'}`,
    timestampClass: `text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`
  }
}