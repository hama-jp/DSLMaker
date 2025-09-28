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
  generateMessageId,
  createMessage,
  addMessageToArray,
  updateMessageInArray,
  getMessageDisplayProps
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

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const { messages: newMessages, messageId } = addMessageToArray(messages, message)
    setMessages(newMessages)
    return messageId
  }

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

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage = input.trim()
    setInput('')

    // Add user message
    addMessage({
      type: 'user',
      content: userMessage
    })

    setIsGenerating(true)

    try {
      // Create streaming update handler
      const messageId = addMessage({
        type: 'assistant',
        content: '',
        metadata: { isGenerating: true }
      })

      let accumulatedContent = ''
      const onStreamUpdate = (chunk: string) => {
        accumulatedContent += chunk
        updateMessage(messageId, {
          metadata: {
            isGenerating: true,
            streamingContent: accumulatedContent
          }
        })
      }

      const result = await handleWorkflowGeneration(userMessage, dependencies, onStreamUpdate)

      updateMessage(messageId, {
        metadata: { isGenerating: false, result, streamingContent: undefined }
      })

      if (result.success) {
        if ('analysis' in result) {
          // Analysis result
          updateMessage(messageId, {
            content: result.analysis || 'Analysis completed.',
            metadata: { result }
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
        updateMessage(messageId, {
          content: `❌ Processing failed: ${result.error}`
        })
      }
    } catch (error) {
      addMessage({
        type: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
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
    const { isUser, isSystem, containerClass, messageClass } = getMessageDisplayProps(message)
    const result = message.metadata?.result as DSLGenerationResult | undefined

    return (
      <div key={message.id} className={containerClass}>
        <div className={messageClass}>
          {message.metadata?.isGenerating ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating workflow...</span>
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
        </div>

        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {isClient ? message.timestamp.toLocaleTimeString() : '--:--:--'}
          {message.metadata?.tokens && (
            <span className="ml-2">({message.metadata.tokens} tokens)</span>
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

        {/* Quick suggestions */}
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
