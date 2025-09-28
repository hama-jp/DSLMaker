/**
 * Chat workflow handler utilities for LLM processing and workflow operations
 */

import { LLMService } from './llm-service'
import type { DSLGenerationResult, DSLAnalysisResult } from '@/types/dify-workflow'
import type { ChatMessage } from './chat-utils'
import { formatLintResults } from './chat-utils'

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

  return { isModification, isAnalysis }
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

  // Check LLM settings
  if (!llmSettings.baseUrl || !llmSettings.apiKey) {
    throw new Error('⚠️ Please configure your LLM settings first. Go to Settings to set up your API key and endpoint.')
  }

  const llmService = new LLMService({
    baseUrl: llmSettings.baseUrl,
    model: llmSettings.modelName,
    apiKey: llmSettings.apiKey,
    temperature: llmSettings.temperature,
    maxTokens: llmSettings.maxTokens
  })

  const { isModification, isAnalysis } = determineRequestType(userMessage)

  if (isAnalysis && dslFile) {
    // Analyze current workflow
    const currentDSL = await exportDSL()
    return await llmService.analyzeDSL(currentDSL)
  } else if (isModification && dslFile) {
    // Modify existing workflow
    const currentDSL = await exportDSL()
    return await llmService.modifyDSL(currentDSL, userMessage, dslFile)
  } else {
    // Generate new workflow
    if (onStreamUpdate) {
      return await llmService.generateDSLStream(userMessage, onStreamUpdate)
    } else {
      return await llmService.generateDSL(userMessage)
    }
  }
}

/**
 * Show generation result and handle preview
 */
export async function showGenerationResult(
  result: DSLGenerationResult,
  messageId: string,
  dependencies: WorkflowHandlerDependencies
): Promise<string> {
  if (!result.success || !result.dsl || !result.lintResult) {
    return '❌ Generation failed: Invalid result'
  }

  const lintSummary = formatLintResults(result.lintResult)
  let previewNote = '⚠️ Preview unavailable because no YAML content was returned.'

  if (result.yamlContent) {
    try {
      await dependencies.previewDSL(result.yamlContent, messageId)
      previewNote = '👀 The canvas displays a live preview. Select Apply to confirm or Cancel to revert.'
    } catch (error) {
      previewNote = `❌ Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  return `✅ Workflow generated successfully!\n\n${lintSummary}\n\n${previewNote}\n\n**Token Usage:** ${result.llmResponse?.usage?.totalTokens || 'N/A'}`
}

/**
 * Handle workflow application
 */
export async function handleApplyWorkflow(
  result: DSLGenerationResult,
  messageId: string,
  dependencies: WorkflowHandlerDependencies
): Promise<{ success: boolean; message: string }> {
  console.log('🎯 handleApplyWorkflow called with:', {
    success: result.success,
    hasDsl: !!result.dsl,
    hasYamlContent: !!result.yamlContent,
    yamlContentLength: result.yamlContent?.length
  })

  if (!result.success || !result.dsl || !result.yamlContent) {
    console.log('❌ Cannot apply: success =', result.success, 'dsl =', !!result.dsl, 'yaml =', !!result.yamlContent)
    return { success: false, message: 'Cannot apply workflow: Invalid result data' }
  }

  try {
    const yamlToApply = result.yamlContent
    console.log('📋 Applying YAML, length:', yamlToApply.length)
    console.log('📋 First 200 chars of YAML:', yamlToApply.substring(0, 200))

    await dependencies.previewDSL(yamlToApply, messageId)
    dependencies.commitPreview()

    return { success: true, message: '✅ Workflow applied to canvas successfully!' }
  } catch (error) {
    console.error('❌ Apply failed:', error)
    return {
      success: false,
      message: `❌ Failed to apply workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
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
 * Handle workflow optimization
 */
export async function handleOptimizeWorkflow(
  dependencies: WorkflowHandlerDependencies
): Promise<DSLGenerationResult> {
  const { llmSettings, dslFile, exportDSL } = dependencies

  if (!dslFile) {
    throw new Error('⚠️ No workflow to optimize. Please create or load a workflow first.')
  }

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
    throw new Error('✅ Your workflow is already well-optimized! No issues were found.')
  }

  return await llmService.optimizeDSL(currentDSL, lintResult)
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
    return { success: true, message: 'Preview opened in new window' }
  }

  return { success: false, message: 'Failed to open preview window' }
}