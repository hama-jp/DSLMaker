"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { LLMService, DSLGenerationResult, DSLAnalysisResult } from '@/utils/llm-service'
import { formatLintResults } from '@/utils/dsl-linter'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    isGenerating?: boolean
    result?: DSLGenerationResult | DSLAnalysisResult
    tokens?: number
    streamingContent?: string
  }
}

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
    const newMessage: ChatMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
    return newMessage.id
  }

  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ))
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

    // Check if we have LLM settings
    if (!llmSettings.baseUrl || !llmSettings.apiKey) {
      addMessage({
        type: 'system',
        content: '⚠️ Please configure your LLM settings first. Go to Settings to set up your API key and endpoint.'
      })
      return
    }

    setIsGenerating(true)

    try {
      const llmService = new LLMService({
        baseUrl: llmSettings.baseUrl,
        model: llmSettings.modelName,
        apiKey: llmSettings.apiKey,
        temperature: llmSettings.temperature,
        maxTokens: llmSettings.maxTokens
      })

      // Determine the type of request
      const isModification = userMessage.toLowerCase().includes('modify') ||
                           userMessage.toLowerCase().includes('change') ||
                           userMessage.toLowerCase().includes('update') ||
                           userMessage.toLowerCase().includes('improve')

      const isAnalysis = userMessage.toLowerCase().includes('analyze') ||
                        userMessage.toLowerCase().includes('review') ||
                        userMessage.toLowerCase().includes('check') ||
                        userMessage.toLowerCase().includes('explain')

      let result: DSLGenerationResult | DSLAnalysisResult

      if (isAnalysis && dslFile) {
        // Analyze current workflow
        const currentDSL = await exportDSL()
        result = await llmService.analyzeDSL(currentDSL)

        if (result.success && 'analysis' in result) {
          addMessage({
            type: 'assistant',
            content: result.analysis || 'Analysis completed.',
            metadata: { result }
          })
        } else {
          addMessage({
            type: 'assistant',
            content: `❌ Analysis failed: ${result.error}`
          })
        }
      } else if (isModification && dslFile) {
        // Modify existing workflow
        const currentDSL = await exportDSL()
        result = await llmService.modifyDSL(currentDSL, userMessage, dslFile)

        if (result.success && 'dsl' in result && result.dsl) {
          const messageId = addMessage({
            type: 'assistant',
            content: '✅ Workflow modified successfully!',
            metadata: { result }
          })

          await showGenerationResult(result, messageId)
        } else {
          addMessage({
            type: 'assistant',
            content: `❌ Modification failed: ${result.error}`
          })
        }
      } else {
        // Generate new workflow with streaming
        const messageId = addMessage({
          type: 'assistant',
          content: '',
          metadata: { isGenerating: true }
        })

        let accumulatedContent = ''
        result = await llmService.generateDSLStream(userMessage, (chunk) => {
          accumulatedContent += chunk
          updateMessage(messageId, {
            metadata: {
              isGenerating: true,
              streamingContent: accumulatedContent
            }
          })
        })

        updateMessage(messageId, {
          metadata: { isGenerating: false, result, streamingContent: undefined }
        })

        if (result.success && 'dsl' in result && result.dsl) {
          updateMessage(messageId, {
            content: '✅ Workflow generated successfully!'
          })

          await showGenerationResult(result, messageId)
        } else {
          updateMessage(messageId, {
            content: `❌ Generation failed: ${result.error}`
          })
        }
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

  const showGenerationResult = async (result: DSLGenerationResult, messageId: string) => {
    if (!result.success || !result.dsl || !result.lintResult) return

    const lintSummary = formatLintResults(result.lintResult)
    let previewNote = '⚠️ Preview unavailable because no YAML content was returned.'

    if (result.yamlContent) {
      try {
        await previewDSL(result.yamlContent, messageId)
        previewNote = '👀 The canvas displays a live preview. Select Apply to confirm or Cancel to revert.'
      } catch (error) {
        previewNote = `❌ Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    updateMessage(messageId, {
      content: `✅ Workflow generated successfully!

${lintSummary}

${previewNote}

**Token Usage:** ${result.llmResponse?.usage?.totalTokens || 'N/A'}`
    })
  }

  const handleApplyWorkflow = async (result: DSLGenerationResult, messageId: string) => {
    console.log('🎯 handleApplyWorkflow called with:', {
      success: result.success,
      hasDsl: !!result.dsl,
      hasYamlContent: !!result.yamlContent,
      yamlContentLength: result.yamlContent?.length
    })

    if (!result.success || !result.dsl || !result.yamlContent) {
      console.log('❌ Cannot apply: success =', result.success, 'dsl =', !!result.dsl, 'yaml =', !!result.yamlContent)
      return
    }

    try {
      const yamlToApply = result.yamlContent
      console.log('📋 Applying YAML, length:', yamlToApply.length)
      console.log('📋 First 200 chars of YAML:', yamlToApply.substring(0, 200))

      await previewDSL(yamlToApply, messageId)
      commitPreview()
      addMessage({
        type: 'system',
        content: '✅ Workflow applied to canvas successfully!'
      })
    } catch (error) {
      console.error('❌ Apply failed:', error)
      addMessage({
        type: 'system',
        content: `❌ Failed to apply workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  const handleCancelPreview = (messageId: string) => {
    if (!isPreviewing || activePreviewId !== messageId) return

    discardPreview()
    addMessage({
      type: 'system',
      content: '↩️ Preview cancelled. Canvas restored to the previous workflow.'
    })
  }

  const handlePreviewWorkflow = (result: DSLGenerationResult) => {
    if (!result.yamlContent) return

    // Create a preview modal or new window
    const previewWindow = window.open('', '_blank', 'width=800,height=600')
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Workflow Preview</title></head>
          <body style="font-family: monospace; padding: 20px;">
            <h2>Generated Workflow DSL</h2>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow: auto;">
${result.yamlContent}
            </pre>
          </body>
        </html>
      `)
      previewWindow.document.close()
    }
  }

  const handleDownloadWorkflow = (result: DSLGenerationResult) => {
    if (!result.yamlContent) return

    const blob = new Blob([result.yamlContent], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${Date.now()}.yml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addMessage({
      type: 'system',
      content: '📁 Workflow DSL downloaded successfully!'
    })
  }

  const handleOptimizeWorkflow = async () => {
    if (!dslFile) {
      addMessage({
        type: 'system',
        content: '⚠️ No workflow to optimize. Please create or load a workflow first.'
      })
      return
    }

    setIsGenerating(true)

    try {
      const llmService = new LLMService({
        baseUrl: llmSettings.baseUrl,
        model: llmSettings.modelName,
        apiKey: llmSettings.apiKey,
        temperature: llmSettings.temperature,
        maxTokens: llmSettings.maxTokens
      })

      const currentDSL = await exportDSL()
      const lintResult = LLMService.validateDSL(currentDSL).lintResult

      if (!lintResult || (lintResult.errors.length === 0 && lintResult.warnings.length === 0)) {
        addMessage({
          type: 'assistant',
          content: '✅ Your workflow is already well-optimized! No issues were found.'
        })
        return
      }

      const result = await llmService.optimizeDSL(currentDSL, lintResult)

      if (result.success && result.dsl) {
        const messageId = addMessage({
          type: 'assistant',
          content: '🚀 Workflow optimized successfully!',
          metadata: { result }
        })

        await showGenerationResult(result, messageId)
      } else {
        addMessage({
          type: 'assistant',
          content: `❌ Optimization failed: ${result.error}`
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

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user'
    const isSystem = message.type === 'system'
    const result = message.metadata?.result as DSLGenerationResult | undefined

    return (
      <div key={message.id} className={`mb-4 ${isUser ? 'ml-8' : 'mr-8'}`}>
        <div className={`p-3 rounded-lg ${
          isUser
            ? 'bg-blue-500 text-white ml-auto'
            : isSystem
              ? 'bg-gray-100 text-gray-800'
              : 'bg-white border'
        } ${!isUser ? 'max-w-full' : 'max-w-fit ml-auto'}`}>
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
                  onClick={() => handleApplyWorkflow(result, message.id)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Apply
                </Button>
                {isPreviewing && activePreviewId === message.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelPreview(message.id)}
                    className="text-destructive border-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreviewWorkflow(result)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  DSL
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadWorkflow(result)}
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
            onClick={handleOptimizeWorkflow}
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
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

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
