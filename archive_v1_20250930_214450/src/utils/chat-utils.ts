/**
 * Chat utility functions for message management and formatting
 */

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system' | 'error'
  content: string
  timestamp: Date
  metadata?: {
    result?: any
    isGenerating?: boolean
    streamingContent?: string
    tokens?: number
    error?: ChatError
    canRetry?: boolean
    retryCount?: number
  }
}

export interface ChatError {
  code: string
  message: string
  details?: string
  category: 'api' | 'validation' | 'network' | 'config' | 'processing' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  isRetryable: boolean
  userAction?: string
  technicalInfo?: string
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
 * Create a comprehensive error object with user-friendly messaging
 */
export function createChatError(
  error: Error | string,
  context?: string,
  category: ChatError['category'] = 'unknown'
): ChatError {
  const errorMessage = error instanceof Error ? error.message : error
  const errorCode = generateErrorCode(errorMessage, category)

  let chatError: ChatError = {
    code: errorCode,
    message: errorMessage,
    category,
    severity: categorizeErrorSeverity(errorMessage, category),
    isRetryable: isErrorRetryable(errorMessage, category),
    details: context
  }

  // Add user-friendly messaging and actions
  chatError = enhanceErrorWithUserGuidance(chatError)

  return chatError
}

/**
 * Generate error code from message and category
 */
function generateErrorCode(message: string, category: ChatError['category']): string {
  const categoryCode = category.toUpperCase()
  const hash = Math.abs(hashCode(message)).toString(16).slice(0, 4)
  return `${categoryCode}_${hash}`
}

/**
 * Simple hash function for error codes
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash
}

/**
 * Categorize error severity based on message content
 */
function categorizeErrorSeverity(message: string, category: ChatError['category']): ChatError['severity'] {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('timeout') || lowerMessage.includes('network')) {
    return 'medium'
  }

  if (lowerMessage.includes('api key') || lowerMessage.includes('unauthorized')) {
    return 'high'
  }

  if (lowerMessage.includes('server error') || lowerMessage.includes('internal error')) {
    return 'critical'
  }

  if (category === 'config' || category === 'validation') {
    return 'medium'
  }

  return 'low'
}

/**
 * Determine if an error is retryable
 */
function isErrorRetryable(message: string, category: ChatError['category']): boolean {
  const lowerMessage = message.toLowerCase()

  // Not retryable conditions
  if (lowerMessage.includes('api key') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('invalid request') ||
      category === 'validation') {
    return false
  }

  // Retryable conditions
  if (lowerMessage.includes('timeout') ||
      lowerMessage.includes('network') ||
      lowerMessage.includes('server error') ||
      lowerMessage.includes('rate limit') ||
      category === 'network' ||
      category === 'processing') {
    return true
  }

  return false
}

/**
 * Enhance error with user-friendly guidance
 */
function enhanceErrorWithUserGuidance(error: ChatError): ChatError {
  const enhanced = { ...error }
  const lowerMessage = error.message.toLowerCase()

  if (lowerMessage.includes('api key')) {
    enhanced.userAction = 'Please check your API key configuration in the settings (⚙️ icon). Make sure you have set a valid OpenAI API key.'
    enhanced.technicalInfo = 'API authentication failed. Verify the OPENAI_API_KEY environment variable is set correctly.'
  } else if (lowerMessage.includes('timeout')) {
    enhanced.userAction = 'The request timed out. Try again with a simpler workflow request, or check your internet connection.'
    enhanced.technicalInfo = 'Request exceeded timeout limit. Consider increasing timeout or reducing request complexity.'
  } else if (lowerMessage.includes('rate limit')) {
    enhanced.userAction = 'API rate limit exceeded. Please wait a moment before trying again.'
    enhanced.technicalInfo = 'Too many requests sent to the API. Implement exponential backoff retry strategy.'
  } else if (lowerMessage.includes('server error') || lowerMessage.includes('503')) {
    enhanced.userAction = 'The AI service is temporarily unavailable. Please try again in a few minutes.'
    enhanced.technicalInfo = 'Upstream service error. Check service status and implement circuit breaker pattern.'
  } else if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    enhanced.userAction = 'Network connection issue. Please check your internet connection and try again.'
    enhanced.technicalInfo = 'Network request failed. Verify connectivity and DNS resolution.'
  } else if (error.category === 'validation') {
    enhanced.userAction = 'There was an issue with the workflow structure. Try describing your workflow differently or check the generated output.'
    enhanced.technicalInfo = 'DSL validation failed. Review DSL structure and node connections.'
  } else if (lowerMessage.includes('unclear_intent')) {
    enhanced.userAction = 'Please provide more specific details about the workflow you want to create.'
    enhanced.technicalInfo = 'User intent classification failed. Request more detailed prompt.'
  } else {
    enhanced.userAction = 'An unexpected error occurred. Please try again or contact support if the problem persists.'
    enhanced.technicalInfo = `Unhandled error: ${error.message}`
  }

  return enhanced
}

/**
 * Format error for display to users
 */
export function formatErrorForDisplay(error: ChatError, includeRetry = true): string {
  let errorDisplay = `❌ **${getSeverityEmoji(error.severity)} ${error.category.toUpperCase()} ERROR**\n\n`

  errorDisplay += `${error.userAction || error.message}\n\n`

  if (error.details) {
    errorDisplay += `**Context:** ${error.details}\n\n`
  }

  if (includeRetry && error.isRetryable) {
    errorDisplay += `🔄 This error can be retried. Click the retry button to try again.\n\n`
  }

  errorDisplay += `**Error Code:** ${error.code}`

  return errorDisplay
}

/**
 * Get emoji for error severity
 */
function getSeverityEmoji(severity: ChatError['severity']): string {
  switch (severity) {
    case 'critical': return '🚨'
    case 'high': return '⚠️'
    case 'medium': return '⚡'
    case 'low': return 'ℹ️'
    default: return '❓'
  }
}

/**
 * Check if error should trigger automatic retry
 */
export function shouldAutoRetry(error: ChatError, currentRetryCount: number): boolean {
  const maxRetries = 3

  if (!error.isRetryable || currentRetryCount >= maxRetries) {
    return false
  }

  // Auto-retry for network and rate limit errors
  return error.category === 'network' ||
         error.message.toLowerCase().includes('rate limit') ||
         error.message.toLowerCase().includes('timeout')
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(retryCount: number): number {
  const baseDelay = 1000 // 1 second
  const maxDelay = 30000 // 30 seconds
  const delay = baseDelay * Math.pow(2, retryCount)
  return Math.min(delay, maxDelay)
}

/**
 * Get message display properties
 */
export function getMessageDisplayProps(message: ChatMessage) {
  const isUser = message.type === 'user'
  const isSystem = message.type === 'system'
  const isError = message.type === 'error'

  return {
    isUser,
    isSystem,
    isError,
    containerClass: `mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`,
    messageClass: `p-3 rounded-lg max-w-[70%] ${
      isUser
        ? 'bg-blue-500 text-white'
        : isSystem
          ? 'bg-gray-100 text-gray-800'
          : isError
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-white border border-gray-200'
    }`,
    timestampClass: `text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`
  }
}