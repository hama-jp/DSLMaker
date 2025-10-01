'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowRequest, WorkflowResponse } from '@/lib/api-client'
import type { GenerationMethod } from '@/hooks/useWorkflowGeneration'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    workflowGenerated?: boolean
    qualityScore?: number
    iterationCount?: number
  }
}

interface ChatInterfaceProps {
  onGenerate: (request: WorkflowRequest, method?: GenerationMethod) => Promise<WorkflowResponse | null>
  workflowResult: WorkflowResponse | null
}

export default function ChatInterface({ onGenerate, workflowResult }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'system',
      content: 'こんにちは！Difyワークフロー生成AIアシスタントです✨\n\nどのようなワークフローを作成しますか？具体的な要件を教えてください。',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)

    setMessages((prev) => prev.filter((m) => !m.content.includes('...')))

    const cancelMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '⚠️ ワークフロー生成をキャンセルしました。\n\n新しいリクエストを送信してください。',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, cancelMessage])
  }

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsGenerating(true)

    const loadingMessage: ChatMessage = {
      id: `${Date.now()}-loading`,
      role: 'assistant',
      content: '...',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, loadingMessage])

    // Create AbortController for this request
    abortControllerRef.current = new AbortController()

    try {
      const result = await onGenerate({
        description: input.trim(),
        preferences: {
          complexity: 'moderate',
          max_iterations: 3,
        },
        use_rag: true,
      }, 'multi-agent')

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id))

      if (result) {
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `ワークフローを生成しました！🎉\n\n📊 **品質スコア**: ${result.quality_score}/100\n⏱️ **生成時間**: ${result.generation_time.toFixed(2)}秒\n\n🔧 **ワークフロー構成**\n• ノード数: ${result.metadata.node_count}個\n• 接続数: ${result.metadata.edge_count}個\n• 反復回数: ${result.metadata.iteration_count}回\n\n右側のビジュアライザーで確認できます。修正が必要な場合は、具体的な指示をください。`,
          timestamp: new Date(),
          metadata: {
            workflowGenerated: true,
            qualityScore: result.quality_score,
            iterationCount: result.metadata.iteration_count,
          },
        }
        setMessages((prev) => [...prev, successMessage])
      }
    } catch (error) {
      // Check if error was due to abort
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id))
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⚠️ エラーが発生しました\n\n${error instanceof Error ? error.message : '不明なエラー'}\n\nもう一度お試しください。`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      abortControllerRef.current = null
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Workflow Generation & Modification</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex w-full",
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2",
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.role === 'system'
                  ? 'bg-muted text-foreground border border-border'
                  : 'bg-muted text-foreground'
              )}
            >
              {message.content === '...' ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generating workflow...</span>
                </div>
              ) : (
                <>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>

                  {message.metadata?.workflowGenerated && (
                    <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 flex-wrap">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                        (message.metadata.qualityScore ?? 0) >= 90 ? "bg-green-100 text-green-700" :
                        (message.metadata.qualityScore ?? 0) >= 75 ? "bg-blue-100 text-blue-700" :
                        (message.metadata.qualityScore ?? 0) >= 60 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        <CheckCircle2 className="w-3 h-3" />
                        Quality {message.metadata.qualityScore ?? 0}%
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        <Sparkles className="w-3 h-3" />
                        {message.metadata.iterationCount ?? 0} iterations
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="text-xs mt-1 text-muted-foreground">
                {message.timestamp.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe your workflow requirements..."
            className="flex-1 px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground"
            rows={2}
            disabled={isGenerating}
          />
          {isGenerating ? (
            <button
              onClick={handleCancel}
              className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90"
              title="Cancel generation"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                !input.trim()
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {isGenerating ? 'Click X to cancel generation' : 'Press Shift+Enter for new line'}
        </div>
      </div>
    </div>
  )
}
