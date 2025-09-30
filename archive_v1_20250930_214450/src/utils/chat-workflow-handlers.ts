/**
 * Chat workflow handler utilities for LLM processing and workflow operations
 */

import { LLMService, type DSLGenerationResult, type DSLAnalysisResult } from './llm-service'
import type { ChatMessage, ChatError } from './chat-utils'
import { formatLintResults, createChatError, formatErrorForDisplay } from './chat-utils'

export interface WorkflowHandlerDependencies {
  llmSettings: any
  dslFile: any
  exportDSL: () => Promise<string>
  previewDSL: (yamlContent: string, messageId: string) => Promise<void>
  commitPreview: () => void
  discardPreview: () => void
  isPreviewing: boolean
  activePreviewId: string | null
}

/**
 * Determine the type of user request
 */
export function determineRequestType(userMessage: string) {
  const lowerMessage = userMessage.toLowerCase()

  const isModification = lowerMessage.includes('modify') ||
                        lowerMessage.includes('change') ||
                        lowerMessage.includes('update') ||
                        lowerMessage.includes('improve')

  const isAnalysis = lowerMessage.includes('analyze') ||
                    lowerMessage.includes('review') ||
                    lowerMessage.includes('check') ||
                    lowerMessage.includes('explain')

  // Check if user actually wants to create a workflow
  const isWorkflowGeneration = lowerMessage.includes('workflow') ||
                              lowerMessage.includes('create') ||
                              lowerMessage.includes('build') ||
                              lowerMessage.includes('generate') ||
                              lowerMessage.includes('make') ||
                              lowerMessage.includes('作って') ||
                              lowerMessage.includes('作成') ||
                              lowerMessage.includes('rag') ||
                              lowerMessage.includes('api') ||
                              lowerMessage.includes('integration') ||
                              lowerMessage.includes('automation') ||
                              lowerMessage.includes('process') ||
                              lowerMessage.includes('llm') ||
                              lowerMessage.includes('input') ||
                              lowerMessage.includes('output') ||
                              lowerMessage.includes('入力') ||
                              lowerMessage.includes('出力') ||
                              lowerMessage.includes('シンプル') ||
                              lowerMessage.includes('simple') ||
                              // Check if message is substantial (> 8 chars and contains meaningful patterns)
                              (lowerMessage.length > 8 &&
                               (lowerMessage.includes('want to') || lowerMessage.includes('need to') ||
                                lowerMessage.includes('help me') || lowerMessage.includes('how to') ||
                                lowerMessage.includes('i want') || lowerMessage.includes('i need') ||
                                lowerMessage.includes('したい') || lowerMessage.includes('欲しい')))

  // Filter out clearly non-workflow messages (but be more specific)
  const isTestMessage = (lowerMessage.includes('test') && !lowerMessage.includes('testing workflow')) ||
                       (lowerMessage.includes('debug') && !lowerMessage.includes('debug workflow')) ||
                       lowerMessage.includes('hello') ||
                       lowerMessage.includes('hi ') ||
                       lowerMessage.match(/^[\w\s]{1,6}$/) // Very short messages (reduced from 10 to 6)

  return {
    isModification,
    isAnalysis,
    isWorkflowGeneration: isWorkflowGeneration && !isTestMessage
  }
}

/**
 * Handle LLM service workflow generation
 */
export async function handleWorkflowGeneration(
  userMessage: string,
  dependencies: WorkflowHandlerDependencies,
  onStreamUpdate?: (chunk: string) => void
): Promise<DSLGenerationResult | DSLAnalysisResult> {
  const { llmSettings, dslFile, exportDSL } = dependencies

  // Check LLM settings - now fallback to secure service if needed
  if (!llmSettings.baseUrl || !llmSettings.apiKey) {
    // Use secure backend service instead
    console.log('🔒 Using secure backend LLM service (no client-side API keys)')
    const { SecureLLMService } = await import('./secure-llm-service')
    const secureLLMService = new SecureLLMService({
      temperature: llmSettings.temperature || 0.7,
      maxTokens: llmSettings.maxTokens || 4000
    })

    const { isModification, isAnalysis, isWorkflowGeneration } = determineRequestType(userMessage)

    if (isAnalysis && dslFile) {
      const currentDSL = await exportDSL()
      return await secureLLMService.analyzeDSL(currentDSL)
    } else if (isModification && dslFile) {
      const currentDSL = await exportDSL()
      return await secureLLMService.modifyDSL(currentDSL, userMessage, dslFile)
    } else if (isWorkflowGeneration) {
      return await secureLLMService.generateDSL(userMessage)
    }
  }

  // Legacy direct LLM service (for development only)
  const llmService = new LLMService({
    baseUrl: llmSettings.baseUrl,
    model: llmSettings.modelName,
    apiKey: llmSettings.apiKey,
    temperature: llmSettings.temperature,
    maxTokens: llmSettings.maxTokens
  })

  const { isModification, isAnalysis, isWorkflowGeneration } = determineRequestType(userMessage)

  if (isAnalysis && dslFile) {
    // Analyze current workflow
    const currentDSL = await exportDSL()
    return await llmService.analyzeDSL(currentDSL)
  } else if (isModification && dslFile) {
    // Modify existing workflow
    const currentDSL = await exportDSL()
    return await llmService.modifyDSL(currentDSL, userMessage, dslFile)
  } else if (isWorkflowGeneration) {
    // Generate new workflow
    if (onStreamUpdate) {
      return await llmService.generateDSLStream(userMessage, onStreamUpdate)
    } else {
      return await llmService.generateDSL(userMessage)
    }
  } else {
    // Return a helpful response for unclear messages
    return {
      success: false,
      error: 'unclear_intent'
    }
  }
}

/**
 * Show generation result and handle preview with enhanced error handling
 */
export async function showGenerationResult(
  result: DSLGenerationResult,
  messageId: string,
  dependencies: WorkflowHandlerDependencies
): Promise<string> {
  try {
    if (!result.success || !result.dsl || !result.lintResult) {
      const errorMsg = result.error || 'Invalid result structure'
      const chatError = createChatError(
        errorMsg,
        'Generation result validation failed',
        'validation'
      )
      return formatErrorForDisplay(chatError, false)
    }

    const lintSummary = formatLintResults(result.lintResult)
    let previewNote = '⚠️ Preview unavailable because no YAML content was returned.'

    if (result.yamlContent) {
      try {
        await dependencies.previewDSL(result.yamlContent, messageId)
        previewNote = '👀 The canvas displays a live preview. Select **Apply** to confirm or **Cancel** to revert.'
      } catch (error) {
        console.error('❌ Preview generation failed:', error)
        const previewError = createChatError(
          error instanceof Error ? error : String(error),
          'Failed to generate workflow preview',
          'processing'
        )
        previewNote = `❌ Preview Error: ${previewError.userAction || previewError.message}`
      }
    }

    const tokenUsage = result.llmResponse?.usage?.totalTokens
    const tokenInfo = tokenUsage ? `**Token Usage:** ${tokenUsage}` : ''

    return `✅ **Workflow generated successfully!**\n\n${lintSummary}\n\n${previewNote}\n\n${tokenInfo}`
  } catch (error) {
    console.error('❌ Show generation result failed:', error)
    const chatError = createChatError(
      error instanceof Error ? error : String(error),
      'Failed to display generation result',
      'processing'
    )
    return formatErrorForDisplay(chatError, false)
  }
}

/**
 * Handle workflow application with comprehensive error handling
 */
export async function handleApplyWorkflow(
  result: DSLGenerationResult,
  messageId: string,
  dependencies: WorkflowHandlerDependencies
): Promise<{ success: boolean; message: string; error?: ChatError }> {
  console.log('🎯 handleApplyWorkflow called with:', {
    success: result.success,
    hasDsl: !!result.dsl,
    hasYamlContent: !!result.yamlContent,
    yamlContentLength: result.yamlContent?.length
  })

  try {
    // Validate input
    if (!result.success || !result.dsl || !result.yamlContent) {
      console.log('❌ Cannot apply: success =', result.success, 'dsl =', !!result.dsl, 'yaml =', !!result.yamlContent)

      const validationError = createChatError(
        'Cannot apply workflow: Invalid or incomplete generation result',
        'Workflow generation did not complete successfully or is missing required data',
        'validation'
      )

      return {
        success: false,
        message: formatErrorForDisplay(validationError, false),
        error: validationError
      }
    }

    const yamlToApply = result.yamlContent
    console.log('📋 Applying YAML, length:', yamlToApply.length)
    console.log('📋 First 200 chars of YAML:', yamlToApply.substring(0, 200))

    // Apply the workflow
    await dependencies.previewDSL(yamlToApply, messageId)
    dependencies.commitPreview()

    console.log('✅ Workflow applied successfully')
    return { success: true, message: '✅ **Workflow applied to canvas successfully!** \n\nYour workflow is now active and ready to use.' }
  } catch (error) {
    console.error('❌ Apply failed:', error)

    let category: ChatError['category'] = 'processing'

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()

      if (errorMessage.includes('parse') || errorMessage.includes('yaml') || errorMessage.includes('syntax')) {
        category = 'validation'
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        category = 'network'
      }
    }

    const applyError = createChatError(
      error instanceof Error ? error : String(error),
      'Failed to apply generated workflow to canvas',
      category
    )

    return {
      success: false,
      message: formatErrorForDisplay(applyError),
      error: applyError
    }
  }
}

/**
 * Handle workflow cancellation
 */
export function handleCancelPreview(
  messageId: string,
  dependencies: WorkflowHandlerDependencies
): { success: boolean; message: string } {
  if (!dependencies.isPreviewing || dependencies.activePreviewId !== messageId) {
    return { success: false, message: 'No active preview to cancel' }
  }

  dependencies.discardPreview()
  return { success: true, message: '↩️ Preview cancelled. Canvas restored to the previous workflow.' }
}

/**
 * Handle workflow optimization with enhanced error handling
 */
export async function handleOptimizeWorkflow(
  dependencies: WorkflowHandlerDependencies
): Promise<DSLGenerationResult> {
  const { llmSettings, dslFile, exportDSL } = dependencies

  try {
    // Check if workflow exists
    if (!dslFile) {
      const noWorkflowError = createChatError(
        'No workflow available for optimization',
        'A workflow must be created or loaded before it can be optimized',
        'validation'
      )

      return {
        success: false,
        error: noWorkflowError.code
      }
    }

    // Check LLM configuration
    if (!llmSettings.baseUrl || !llmSettings.apiKey) {
      const configError = createChatError(
        'LLM service not configured for optimization',
        'API keys are required for workflow optimization',
        'config'
      )

      return {
        success: false,
        error: configError.code
      }
    }

    const llmService = new LLMService({
      baseUrl: llmSettings.baseUrl,
      model: llmSettings.modelName,
      apiKey: llmSettings.apiKey,
      temperature: llmSettings.temperature,
      maxTokens: llmSettings.maxTokens
    })

    // Export and validate current workflow
    const currentDSL = await exportDSL()
    const lintResult = LLMService.validateDSL(currentDSL).lintResult

    // Check if optimization is needed
    if (!lintResult || (lintResult.errors.length === 0 && lintResult.warnings.length === 0)) {
      return {
        success: false,
        error: 'NO_OPTIMIZATION_NEEDED'
      }
    }

    console.log(`🚀 Starting optimization: ${lintResult.errors.length} errors, ${lintResult.warnings.length} warnings`)
    return await llmService.optimizeDSL(currentDSL, lintResult)

  } catch (error) {
    console.error('❌ Optimization failed:', error)

    let category: ChatError['category'] = 'processing'

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()

      if (errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
        category = 'api'
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        category = 'network'
      } else if (errorMessage.includes('export') || errorMessage.includes('dsl')) {
        category = 'validation'
      }
    }

    const optimizeError = createChatError(
      error instanceof Error ? error : String(error),
      'Failed to optimize workflow',
      category
    )

    return {
      success: false,
      error: optimizeError.code
    }
  }
}

/**
 * Handle file download
 */
export function handleDownloadWorkflow(result: DSLGenerationResult): { success: boolean; message: string } {
  if (!result.yamlContent) {
    return { success: false, message: 'No YAML content to download' }
  }

  const blob = new Blob([result.yamlContent], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workflow-${Date.now()}.yml`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return { success: true, message: '📁 Workflow DSL downloaded successfully!' }
}

/**
 * Handle workflow preview in new window
 */
export function handlePreviewWorkflow(result: DSLGenerationResult): { success: boolean; message: string } {
  if (!result.yamlContent) {
    return { success: false, message: 'No YAML content to preview' }
  }

  const previewWindow = window.open('about:blank', '_blank', 'width=800,height=600')
  if (!previewWindow) {
    return { success: false, message: 'Could not open preview window. Please check popup blocker settings.' }
  }

  previewWindow.document.write(`
    <html>
      <head>
        <title>Workflow Preview</title>
        <style>
          body { font-family: monospace; padding: 20px; background: #f5f5f5; }
          pre { background: white; padding: 15px; border: 1px solid #ddd; border-radius: 4px; overflow: auto; }
        </style>
      </head>
      <body>
        <h2>Workflow DSL Preview</h2>
        <pre><code>${result.yamlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </body>
    </html>
  `)
  previewWindow.document.close()

  return { success: true, message: '👁️ Workflow preview opened in new window.' }
}