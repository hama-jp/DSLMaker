"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  Zap
} from 'lucide-react'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useSettingsStore } from '@/stores/settings-store'
import { DSLGenerationResult, DSLAnalysisResult } from '@/utils/llm-service'
import {
  ChatMessage,
  ChatError,
  generateMessageId,
  createMessage,
  addMessageToArray,
  updateMessageInArray,
  getMessageDisplayProps,
  createChatError,
  formatErrorForDisplay,
  shouldAutoRetry,
  calculateRetryDelay
} from '@/utils/chat-utils'
import {
  WorkflowHandlerDependencies,
  handleWorkflowGeneration,
  showGenerationResult,
  handleApplyWorkflow,
  handleCancelPreview,
  handleOptimizeWorkflow,
  handleDownloadWorkflow,
  handlePreviewWorkflow
} from '@/utils/chat-workflow-handlers'
import { MultiAgentWorkflowGenerator } from '@/components/ai/multi-agent-workflow-generator'


export function ChatSidebar() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Hello! I\'m your AI assistant for creating Dify workflows. Tell me what kind of workflow you\'d like to build, and I\'ll generate the DSL for you.',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(320) // Default width in pixels
  const [isResizing, setIsResizing] = useState(false)
  const [useMultiAgent, setUseMultiAgent] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const {
    dslFile,
    exportDSL,
    previewDSL,
    commitPreview,
    discardPreview,
    isPreviewing,
    activePreviewId,
  } = useWorkflowStore()
  const { llmSettings } = useSettingsStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle mouse events for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const newWidth = window.innerWidth - e.clientX
    const minWidth = 250
    const maxWidth = 800

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth)
    }
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])


  // Add and remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [handleMouseMove, handleMouseUp, isResizing])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage = createMessage(message)
    setMessages(prev => {
      console.log('🔧 Before adding message:', prev.length, 'messages')
      console.log('🔧 New message being added:', { type: message.type, content: message.content.substring(0, 50) })
      const updated = [...prev, newMessage]
      console.log('🔧 After adding message:', updated.length, 'messages')
      return updated
    })
    return newMessage.id
  }, [])

  // Multi-agent workflow generation handlers
  const handleMultiAgentWorkflowGenerated = useCallback((workflow: any, metadata: any) => {
    console.log('🎉 Multi-agent workflow generated:', { workflow, metadata })

    // Add success message with metadata
    const successMessage = `🎉 **Multi-Agent Workflow Generated Successfully!**

**Quality Score**: ${metadata.qualityScore}/100
**Readiness Level**: ${metadata.readinessLevel}
**Generation Time**: ${Math.round(metadata.generationTime / 1000)} seconds

The workflow has been generated using our advanced 4-agent system with specialized expertise in requirements analysis, architecture design, node configuration, and quality assurance.

${metadata.recommendations?.length > 0 ? `\n**Key Recommendations**:\n${metadata.recommendations.slice(0, 3).map((rec: any) => `• ${rec.description}`).join('\n')}` : ''}`

    addMessage({
      type: 'assistant',
      content: successMessage,
      metadata: {
        result: { success: true, dsl: workflow },
        multiAgent: true,
        qualityScore: metadata.qualityScore,
        readinessLevel: metadata.readinessLevel
      }
    })

    // Apply the workflow to the editor - use Quality Assurance Agent optimizations before YAML conversion
    if (workflow) {
      try {
        // Apply Quality Assurance Agent optimizations to ensure DSL validation passes
        const nodes = workflow.workflow?.graph?.nodes || []
        const edges = workflow.workflow?.graph?.edges || []
        
        console.log('🔧 Before QA optimization:', { nodeCount: nodes.length, edgeCount: edges.length })
        
        // Import and apply Quality Assurance Agent optimizations
        import('@/agents/quality-assurance-agent').then(({ QualityAssuranceAgent }) => {
          const optimizedEdges = (QualityAssuranceAgent as any).generateOptimizedEdges(edges, nodes)
          console.log('🔧 After QA optimization:', { nodeCount: nodes.length, edgeCount: optimizedEdges.length })
          
          // Update workflow with optimized edges
          // Use JSON clone to ensure no readonly properties
          const optimizedWorkflow = JSON.parse(JSON.stringify({
            ...workflow,
            workflow: {
              ...workflow.workflow,
              graph: {
                ...workflow.workflow.graph,
                edges: optimizedEdges
              }
            }
          }))

          const yaml = require('js-yaml')
          // Simple, reliable YAML conversion with optimized edges
          const yamlContent = yaml.dump(optimizedWorkflow, {
            indent: 2,
            lineWidth: 120,
            noRefs: true,
            sortKeys: false
          })
          console.log('🔧 Generated YAML length:', yamlContent.length)
          console.log('🔧 First 500 chars:', yamlContent.substring(0, 500))

          previewDSL(yamlContent, `multi-agent-${Date.now()}`)
        }).catch(error => {
          console.error('⚠️ QA optimization failed, using original workflow:', error)
          
          // Fallback to original workflow if optimization fails
          // Use JSON clone to ensure no readonly properties
          const fallbackWorkflow = JSON.parse(JSON.stringify(workflow))
          const yaml = require('js-yaml')
          const yamlContent = yaml.dump(fallbackWorkflow, {
            indent: 2,
            lineWidth: 120,
            noRefs: true,
            sortKeys: false
          })

          previewDSL(yamlContent, `multi-agent-${Date.now()}`)
        })
      } catch (error) {
        console.error('❌ Failed to convert workflow to YAML:', error)
        addMessage({
          type: 'system',
          content: `❌ **YAML Conversion Error**\n\nFailed to convert generated workflow to YAML format: ${error instanceof Error ? error.message : String(error)}`
        })
      }
    }
  }, [addMessage, previewDSL])

  const handleMultiAgentError = useCallback((error: string) => {
    console.error('❌ Multi-agent workflow generation error:', error)

    addMessage({
      type: 'error',
      content: `❌ **Multi-Agent Generation Failed**\n\n${error}\n\nYou can try again with different requirements or use the simple generation mode.`,
      metadata: { multiAgent: true, error }
    })
  }, [addMessage])

  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => updateMessageInArray(prev, id, updates))
  }

  const dependencies: WorkflowHandlerDependencies = {
    llmSettings,
    dslFile,
    exportDSL,
    previewDSL,
    commitPreview,
    discardPreview,
    isPreviewing,
    activePreviewId
  }

  const sendMessageWithRetry = async (userMessage: string, retryCount = 0): Promise<void> => {
    try {
      // Create or reuse streaming update handler
      const messageId = addMessage({
        type: 'assistant',
        content: '',
        metadata: { isGenerating: true, retryCount }
      })

      let accumulatedContent = ''
      const onStreamUpdate = (chunk: string) => {
        accumulatedContent += chunk
        updateMessage(messageId, {
          metadata: {
            isGenerating: true,
            streamingContent: accumulatedContent,
            retryCount
          }
        })
      }

      const result = await handleWorkflowGeneration(userMessage, dependencies, onStreamUpdate)

      updateMessage(messageId, {
        metadata: { isGenerating: false, result, streamingContent: undefined, retryCount }
      })

      if (result.success) {
        if ('analysis' in result) {
          // Analysis result
          updateMessage(messageId, {
            content: result.analysis || 'Analysis completed.',
            metadata: { result, retryCount }
          })
        } else if ('dsl' in result && result.dsl) {
          // Generation/modification result
          updateMessage(messageId, {
            content: '✅ Workflow processed successfully!'
          })
          const displayMessage = await showGenerationResult(result, messageId, dependencies)
          updateMessage(messageId, { content: displayMessage })
        }
      } else {
        // Enhanced error handling
        const error = (result as any).errorDetails as ChatError | undefined

        if (result.error === 'unclear_intent') {
          const analysisContent = ('analysis' in result) ? result.analysis : 'Please provide more specific instructions for workflow creation.'
          updateMessage(messageId, {
            content: analysisContent || 'Please provide more specific instructions for workflow creation.',
            metadata: { result, retryCount }
          })
        } else {
          // Check if we should auto-retry
          if (error && shouldAutoRetry(error, retryCount)) {
            console.log(`🔄 Auto-retrying in ${calculateRetryDelay(retryCount)}ms (attempt ${retryCount + 1})`)

            updateMessage(messageId, {
              content: `⏳ Request failed, retrying in ${Math.ceil(calculateRetryDelay(retryCount) / 1000)} seconds... (Attempt ${retryCount + 1})`,
              metadata: { result, retryCount, canRetry: true }
            })

            // Wait and retry
            setTimeout(() => {
              updateMessage(messageId, {
                content: '',
                metadata: { isGenerating: true, retryCount: retryCount + 1 }
              })
              sendMessageWithRetry(userMessage, retryCount + 1)
            }, calculateRetryDelay(retryCount))
            return
          }

          // Show error with retry option if applicable
          const errorContent = error
            ? formatErrorForDisplay(error, true)
            : `❌ Processing failed: ${result.error}`

          updateMessage(messageId, {
            type: 'error',
            content: errorContent,
            metadata: {
              result,
              retryCount,
              error,
              canRetry: error?.isRetryable && retryCount < 3
            }
          })
        }
      }
    } catch (error) {
      console.error('❌ Send message failed:', error)

      const chatError = createChatError(
        error instanceof Error ? error : String(error),
        `Failed to process message: "${userMessage.substring(0, 50)}..."`,
        'processing'
      )

      addMessage({
        type: 'error',
        content: formatErrorForDisplay(chatError, true),
        metadata: {
          error: chatError,
          retryCount,
          canRetry: shouldAutoRetry(chatError, retryCount)
        }
      })
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage = input.trim()
    setInput('')

    // Add user message
    console.log('🧪 Adding user message:', userMessage)
    const userMessageId = addMessage({
      type: 'user',
      content: userMessage
    })
    console.log('🧪 User message added with ID:', userMessageId)

    setIsGenerating(true)

    try {
      await sendMessageWithRetry(userMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRetryMessage = async (userMessage: string, messageId: string, currentRetryCount = 0) => {
    if (isGenerating) return

    setIsGenerating(true)

    try {
      // Update message to show retry state
      updateMessage(messageId, {
        content: '🔄 Retrying...',
        metadata: { isGenerating: true, retryCount: currentRetryCount + 1 }
      })

      await sendMessageWithRetry(userMessage, currentRetryCount + 1)
    } finally {
      setIsGenerating(false)
    }
  }


  const handleApplyWorkflowWrapper = async (result: DSLGenerationResult, messageId: string) => {
    const response = await handleApplyWorkflow(result, messageId, dependencies)
    addMessage({
      type: 'system',
      content: response.message
    })
  }

  const handleCancelPreviewWrapper = (messageId: string) => {
    const response = handleCancelPreview(messageId, dependencies)
    if (response.success) {
      addMessage({
        type: 'system',
        content: response.message
      })
    }
  }

  const handlePreviewWorkflowWrapper = (result: DSLGenerationResult) => {
    const response = handlePreviewWorkflow(result)
    if (!response.success) {
      addMessage({
        type: 'system',
        content: response.message
      })
    }
  }

  const handleDownloadWorkflowWrapper = (result: DSLGenerationResult) => {
    const response = handleDownloadWorkflow(result)
    addMessage({
      type: 'system',
      content: response.message
    })
  }

  const handleOptimizeWorkflowWrapper = async () => {
    setIsGenerating(true)

    try {
      const result = await handleOptimizeWorkflow(dependencies)

      if (result.success && result.dsl) {
        const messageId = addMessage({
          type: 'assistant',
          content: '🚀 Workflow optimized successfully!',
          metadata: { result }
        })

        const displayMessage = await showGenerationResult(result, messageId, dependencies)
        updateMessage(messageId, { content: displayMessage })
      } else {
        addMessage({
          type: 'assistant',
          content: `❌ Optimization failed: ${result.error}`
        })
      }
    } catch (error) {
      addMessage({
        type: 'assistant',
        content: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const renderMessage = (message: ChatMessage) => {
    const { isUser, isSystem, isError, containerClass, messageClass } = getMessageDisplayProps(message)
    const result = message.metadata?.result as DSLGenerationResult | undefined
    const error = message.metadata?.error as ChatError | undefined
    const canRetry = message.metadata?.canRetry
    const retryCount = message.metadata?.retryCount || 0

    return (
      <div key={message.id} className={containerClass}>
        <div className={messageClass}>
          {message.metadata?.isGenerating ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {retryCount > 0
                    ? `Retrying workflow generation... (Attempt ${retryCount + 1})`
                    : 'Generating workflow...'}
                </span>
              </div>
              {message.metadata?.streamingContent && (
                <div className="p-2 bg-gray-50 rounded text-sm font-mono max-h-32 overflow-y-auto">
                  {message.metadata.streamingContent}
                </div>
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}

          {/* Success result buttons */}
          {result && result.success && 'dsl' in result && result.dsl && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApplyWorkflowWrapper(result, message.id)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Apply
                </Button>
                {isPreviewing && activePreviewId === message.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelPreviewWrapper(message.id)}
                    className="text-destructive border-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreviewWorkflowWrapper(result)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  DSL
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadWorkflowWrapper(result)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>

              {result.lintResult && !result.lintResult.isValid && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {result.lintResult.errors.length} error(s), {result.lintResult.warnings.length} warning(s)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Error handling and retry buttons */}
          {(isError || (error && !message.metadata?.isGenerating)) && (
            <div className="mt-3 pt-3 border-t border-red-200">
              {error && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      {error.category.toUpperCase()} ERROR ({error.severity.toUpperCase()})
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {error.code}
                    </Badge>
                  </div>

                  {retryCount > 0 && (
                    <div className="text-xs text-gray-600 mb-2">
                      Attempt {retryCount + 1} of 3
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {canRetry && retryCount < 3 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      // Find the original user message to retry
                      const userMessageIndex = messages.findIndex(m => m.id === message.id) - 1
                      const userMessage = messages[userMessageIndex]
                      if (userMessage && userMessage.type === 'user') {
                        handleRetryMessage(userMessage.content, message.id, retryCount)
                      }
                    }}
                    disabled={isGenerating}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}

                {error?.technicalInfo && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard?.writeText(`Error Code: ${error.code}\nMessage: ${error.message}\nTechnical Info: ${error.technicalInfo}`)
                      // Could add toast notification here
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Copy Debug
                  </Button>
                )}
              </div>

              {error?.severity === 'high' || error?.severity === 'critical' ? (
                <Alert className="mt-2" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    This is a critical error that requires immediate attention.
                    {error?.userAction && ` ${error.userAction}`}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          )}
        </div>

        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {isClient ? message.timestamp.toLocaleTimeString() : '--:--:--'}
          {message.metadata?.tokens && (
            <span className="ml-2">({message.metadata.tokens} tokens)</span>
          )}
          {retryCount > 0 && (
            <span className="ml-2 text-orange-600">({retryCount + 1} attempts)</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={sidebarRef}
      className="bg-white border-l border-gray-200 flex flex-col h-full relative"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize z-10 transition-colors"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold">AI Workflow Assistant</h2>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOptimizeWorkflowWrapper}
            disabled={isGenerating || !dslFile}
            title="Optimize current workflow"
          >
            <Zap className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMessages(messages.slice(0, 1))}
            disabled={isGenerating}
            title="Clear chat"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 scroll-smooth">
          <div className="space-y-4">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Generation Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={!useMultiAgent ? "default" : "ghost"}
              size="sm"
              onClick={() => setUseMultiAgent(false)}
              className="text-xs"
            >
              Simple
            </Button>
            <Button
              variant={useMultiAgent ? "default" : "ghost"}
              size="sm"
              onClick={() => setUseMultiAgent(true)}
              className="text-xs"
            >
              <Zap className="w-3 h-3 mr-1" />
              Multi-Agent
            </Button>
          </div>
        </div>

        {/* Multi-Agent Workflow Generator */}
        {useMultiAgent && (
          <div className="mb-4">
            <MultiAgentWorkflowGenerator
              onWorkflowGenerated={handleMultiAgentWorkflowGenerated}
              onError={handleMultiAgentError}
              disabled={isGenerating}
            />
          </div>
        )}

        {/* Simple Input section - only show when not using multi-agent */}
        {!useMultiAgent && (
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your workflow..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={isGenerating}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isGenerating || !input.trim()}
              size="sm"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Quick suggestions - only show for simple mode */}
        {!useMultiAgent && (
          <div className="mt-2 flex flex-wrap gap-1">
            {[
              "Create a RAG workflow",
              "Add API integration",
              "Analyze current workflow",
              "Optimize for performance"
            ].map((suggestion, index) => (
              <Button
                key={index}
                size="sm"
                variant="ghost"
                className="text-xs h-6 px-2"
                onClick={() => setInput(suggestion)}
                disabled={isGenerating}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {/* Status */}
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <span>
            {llmSettings.modelName || 'No model configured'}
          </span>
          <Badge variant={isGenerating ? "default" : "secondary"} className="text-xs">
            {isGenerating ? 'Generating...' : 'Ready'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
