// LLM Service for DSL Generation and Analysis
import {
  generateCreateDSLPrompt,
  generateModifyDSLPrompt,
  generateAnalyzeDSLPrompt,
  generateOptimizeDSLPrompt
} from './llm-prompts'
import { lintDSL, LintResult } from './dsl-linter'
import { parseDSL } from './dsl-parser'
import { DifyDSLFile } from '@/types/dify-workflow'
import {
  DIFY_WORKFLOW_EXPERT_PROMPT,
  enhancePromptWithContext,
  WORKFLOW_TYPE_PROMPTS
} from './ai-workflow-expert-prompt'
import RequirementAnalyzer, { RequirementAnalysis } from './requirement-analyzer'

export interface LLMSettings {
  baseUrl: string
  model: string
  apiKey: string
  temperature: number
  maxTokens: number
}

export interface LLMResponse {
  success: boolean
  content?: string
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface DSLGenerationResult {
  success: boolean
  dsl?: DifyDSLFile
  yamlContent?: string
  lintResult?: LintResult
  error?: string
  llmResponse?: LLMResponse
}

export interface DSLAnalysisResult {
  success: boolean
  analysis?: string
  suggestions?: string[]
  lintResult?: LintResult
  error?: string
}

/**
 * LLM Service for DSL generation and analysis
 */
export class LLMService {
  private settings: LLMSettings

  constructor(settings: LLMSettings) {
    this.settings = settings
  }

  /**
   * Update LLM settings
   */
  updateSettings(settings: Partial<LLMSettings>): void {
    this.settings = { ...this.settings, ...settings }
  }

  /**
   * Make a request to the LLM API (GPT-5 compatible)
   */
  private async makeRequest(
    messages: Array<{ role: string; content: string }>,
    options: {
      temperature?: number
      maxTokens?: number
      stream?: boolean
      verbosity?: 'low' | 'medium' | 'high'
      effort?: 'minimal' | 'low' | 'medium' | 'high'
    } = {}
  ): Promise<LLMResponse> {
    try {
      // Check if this is a GPT-5 model
      const isGPT5 = this.settings.model.includes('gpt-5')

      let requestBody: any
      let endpoint: string

      if (isGPT5) {
        // Use GPT-5 /responses endpoint - NO temperature, top_p, logprobs allowed
        endpoint = `${this.settings.baseUrl}/responses`

        // Combine messages into a single input for GPT-5
        const input = messages.map(msg =>
          msg.role === 'system' ? `System: ${msg.content}` :
          msg.role === 'user' ? `User: ${msg.content}` :
          `Assistant: ${msg.content}`
        ).join('\n\n')

        requestBody = {
          model: this.settings.model,
          input,
          text: {
            verbosity: options.verbosity || 'low'
          },
          reasoning: {
            effort: options.effort || 'high'
          }
        }

        // GPT-5 uses max_output_tokens instead of max_tokens
        if (options.maxTokens) {
          requestBody.max_output_tokens = options.maxTokens
        }
      } else {
        // Use traditional /chat/completions for non-GPT-5 models
        endpoint = `${this.settings.baseUrl}/chat/completions`
        requestBody = {
          model: this.settings.model,
          messages,
          temperature: options.temperature ?? this.settings.temperature,
          max_tokens: options.maxTokens ?? this.settings.maxTokens,
          stream: options.stream ?? false
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        }
      }

      const data = await response.json()

      if (data.error) {
        return {
          success: false,
          error: data.error.message || 'Unknown API error'
        }
      }

      if (isGPT5) {
        // Handle GPT-5 /responses endpoint format
        console.log('🔍 GPT-5 Raw Response:', JSON.stringify(data, null, 2))

        const messages = data.output?.filter((item: any) => item.type === 'message')
        const content = messages?.[0]?.content?.[0]?.text

        console.log('📊 GPT-5 Parsed:', {
          hasOutput: !!data.output,
          outputLength: data.output?.length,
          messageCount: messages?.length,
          firstMessage: messages?.[0],
          extractedContent: content
        })

        return {
          success: true,
          content,
          usage: data.usage ? {
            promptTokens: data.usage.input_tokens || data.usage.prompt_tokens,
            completionTokens: data.usage.output_tokens || data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          } : undefined
        }
      } else {
        // Handle traditional /chat/completions format
        return {
          success: true,
          content: data.choices?.[0]?.message?.content,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          } : undefined
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Generate a new DSL workflow based on user requirements
   */
  async generateDSL(userRequirement: string): Promise<DSLGenerationResult> {
    try {
      // Phase 1: Intelligent Requirement Analysis
      const analysis = RequirementAnalyzer.analyzeRequirement(userRequirement)
      console.log('🔍 Requirement Analysis:', RequirementAnalyzer.generateAnalysisSummary(analysis))

      // Phase 2: Generate Enhanced Expert Prompt
      const expertPrompt = enhancePromptWithContext(
        userRequirement,
        analysis.detectedWorkflowType,
        analysis.complexity
      )

      // Phase 3: Create specialized workflow generation request
      const workflowGenerationRequest = this.createWorkflowGenerationRequest(analysis, userRequirement)

      const llmResponse = await this.makeRequest([
        { role: 'system', content: expertPrompt },
        { role: 'user', content: workflowGenerationRequest }
      ], {
        maxTokens: 12000,  // Increased to handle reasoning + output
        verbosity: 'low', // User requested verbosity: "low"
        effort: 'medium'  // Reduced from high to medium to save reasoning tokens
      })

      if (!llmResponse.success || !llmResponse.content) {
        return {
          success: false,
          error: llmResponse.error || 'No content received from LLM',
          llmResponse
        }
      }

      // Clean the response - expect JSON format now
      let jsonContent = llmResponse.content.trim()

      // Remove any markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '')
      } else if (jsonContent.startsWith('```yaml')) {
        return {
          success: false,
          error: `LLM returned YAML instead of JSON. This indicates the prompt is not working correctly.\n\nContent preview: ${jsonContent.substring(0, 200)}...`,
          llmResponse
        }
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '')
      }

      // Check if content looks like YAML (starts with keys without quotes)
      if (jsonContent.startsWith('app:') || jsonContent.startsWith('workflow:') || /^\w+:\s*\w+/.test(jsonContent)) {
        return {
          success: false,
          error: `LLM returned YAML format instead of required JSON format.\n\nContent preview: ${jsonContent.substring(0, 200)}...\n\nThe prompt needs to be more explicit about JSON-only requirement.`,
          llmResponse
        }
      }

      // Parse JSON first
      let dslObject: any
      try {
        dslObject = JSON.parse(jsonContent)
      } catch (jsonError) {
        return {
          success: false,
          error: `Invalid JSON from LLM: ${jsonError.message}\n\nContent preview: ${jsonContent.substring(0, 200)}...`,
          llmResponse
        }
      }

      // Fix node data structure: copy 'name' to 'data.title' if missing
      if (dslObject.workflow?.graph?.nodes && Array.isArray(dslObject.workflow.graph.nodes)) {
        dslObject.workflow.graph.nodes.forEach((node: any, index: number) => {
          if (node && typeof node === 'object') {
            // Ensure data object exists
            if (!node.data || typeof node.data !== 'object') {
              node.data = {}
            }
            
            // Copy name to data.title if data.title is missing
            if (node.name && typeof node.name === 'string' && !node.data.title) {
              node.data.title = node.name
              console.log(`🔧 Fixed node ${index}: copied name "${node.name}" to data.title`)
            }
            
            // Ensure data.title exists (fallback)
            if (!node.data.title || typeof node.data.title !== 'string') {
              const fallbackTitle = node.name || node.type || `Node ${index + 1}`
              node.data.title = fallbackTitle
              console.log(`🔧 Set fallback title for node ${index}: "${fallbackTitle}"`)
            }
          }
        })
      }

      // Convert JSON to YAML using js-yaml
      const yaml = await import('js-yaml')
      let yamlContent: string
      try {
        yamlContent = yaml.dump(dslObject, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          quotingType: '"',
          forceQuotes: false
        })
      } catch (yamlError) {
        return {
          success: false,
          error: `YAML conversion failed: ${yamlError.message}`,
          llmResponse
        }
      }

      // Parse the DSL
      const parseResult = parseDSL(yamlContent)
      if (!parseResult.success || !parseResult.workflow) {
        // Show first few lines for debugging
        const lines = yamlContent.split('\n').slice(0, 10)
        const preview = lines.map((line, i) => `${i + 1} | ${line}`).join('\n')

        return {
          success: false,
          error: `Generated DSL is invalid: ${parseResult.errors.join(', ')}\n\nGenerated content preview:\n${preview}`,
          yamlContent,
          llmResponse
        }
      }

      // Lint the DSL
      const lintResult = lintDSL(parseResult.workflow)

      return {
        success: true,
        dsl: parseResult.workflow,
        yamlContent,
        lintResult,
        llmResponse
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Modify an existing DSL workflow
   */
  async modifyDSL(
    currentDSL: string,
    userRequirement: string,
    existingWorkflow?: DifyDSLFile
  ): Promise<DSLGenerationResult> {
    try {
      const prompt = generateModifyDSLPrompt(currentDSL, userRequirement, existingWorkflow)

      const llmResponse = await this.makeRequest([
        { role: 'user', content: prompt }
      ], {
        maxTokens: 4000,
        verbosity: 'low',
        effort: 'high'
      })

      if (!llmResponse.success || !llmResponse.content) {
        return {
          success: false,
          error: llmResponse.error || 'No content received from LLM',
          llmResponse
        }
      }

      // Clean the response
      let yamlContent = llmResponse.content.trim()

      // Remove any markdown code blocks
      if (yamlContent.startsWith('```yaml')) {
        yamlContent = yamlContent.replace(/^```yaml\n/, '').replace(/\n```$/, '')
      } else if (yamlContent.startsWith('```')) {
        yamlContent = yamlContent.replace(/^```\n/, '').replace(/\n```$/, '')
      }

      // Clean up common YAML formatting issues
      yamlContent = this.cleanYamlContent(yamlContent)

      // Parse the DSL
      const parseResult = parseDSL(yamlContent)
      if (!parseResult.success || !parseResult.workflow) {
        return {
          success: false,
          error: `Modified DSL is invalid: ${parseResult.errors.join(', ')}`,
          yamlContent,
          llmResponse
        }
      }

      // Lint the DSL
      const lintResult = lintDSL(parseResult.workflow)

      return {
        success: true,
        dsl: parseResult.workflow,
        yamlContent,
        lintResult,
        llmResponse
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Analyze an existing DSL workflow
   */
  async analyzeDSL(currentDSL: string): Promise<DSLAnalysisResult> {
    try {
      // First lint the DSL
      const parseResult = parseDSL(currentDSL)
      let lintResult: LintResult | undefined

      if (parseResult.success && parseResult.workflow) {
        lintResult = lintDSL(parseResult.workflow)
      }

      const prompt = generateAnalyzeDSLPrompt(currentDSL)

      const llmResponse = await this.makeRequest([
        { role: 'user', content: prompt }
      ], {
        maxTokens: 2000,
        verbosity: 'low',
        effort: 'high'
      })

      if (!llmResponse.success || !llmResponse.content) {
        return {
          success: false,
          error: llmResponse.error || 'No content received from LLM',
          lintResult
        }
      }

      // Extract suggestions if any
      const suggestions = this.extractSuggestions(llmResponse.content)

      return {
        success: true,
        analysis: llmResponse.content,
        suggestions,
        lintResult
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Optimize DSL based on lint results
   */
  async optimizeDSL(
    currentDSL: string,
    lintResult: LintResult
  ): Promise<DSLGenerationResult> {
    try {
      const issues = [
        ...lintResult.errors.map(e => `ERROR: ${e.message}`),
        ...lintResult.warnings.map(w => `WARNING: ${w.message}`)
      ]

      if (issues.length === 0) {
        return {
          success: false,
          error: 'No issues found to optimize'
        }
      }

      const prompt = generateOptimizeDSLPrompt(currentDSL, issues)

      const llmResponse = await this.makeRequest([
        { role: 'user', content: prompt }
      ], {
        maxTokens: 4000,
        verbosity: 'low',
        effort: 'high'
      })

      if (!llmResponse.success || !llmResponse.content) {
        return {
          success: false,
          error: llmResponse.error || 'No content received from LLM',
          llmResponse
        }
      }

      // Clean the response
      let yamlContent = llmResponse.content.trim()

      // Remove any markdown code blocks
      if (yamlContent.startsWith('```yaml')) {
        yamlContent = yamlContent.replace(/^```yaml\n/, '').replace(/\n```$/, '')
      } else if (yamlContent.startsWith('```')) {
        yamlContent = yamlContent.replace(/^```\n/, '').replace(/\n```$/, '')
      }

      // Clean up common YAML formatting issues
      yamlContent = this.cleanYamlContent(yamlContent)

      // Parse the optimized DSL
      const parseResult = parseDSL(yamlContent)
      if (!parseResult.success || !parseResult.workflow) {
        return {
          success: false,
          error: `Optimized DSL is invalid: ${parseResult.errors.join(', ')}`,
          yamlContent,
          llmResponse
        }
      }

      // Lint the optimized DSL
      const newLintResult = lintDSL(parseResult.workflow)

      return {
        success: true,
        dsl: parseResult.workflow,
        yamlContent,
        lintResult: newLintResult,
        llmResponse
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Stream-based DSL generation for real-time updates
   */
  async generateDSLStream(
    userRequirement: string,
    onChunk: (chunk: string) => void
  ): Promise<DSLGenerationResult> {
    try {
      // Phase 1: Intelligent Requirement Analysis (same as generateDSL)
      const analysis = RequirementAnalyzer.analyzeRequirement(userRequirement)
      console.log('🔍 Requirement Analysis (Stream):', RequirementAnalyzer.generateAnalysisSummary(analysis))

      // Phase 2: Generate Enhanced Expert Prompt
      const expertPrompt = enhancePromptWithContext(
        userRequirement,
        analysis.detectedWorkflowType,
        analysis.complexity
      )

      // Phase 3: Create specialized workflow generation request
      const workflowGenerationRequest = this.createWorkflowGenerationRequest(analysis, userRequirement)

      // Use the unified makeRequest method that handles GPT-5 properly
      const llmResponse = await this.makeRequest([
        { role: 'system', content: expertPrompt },
        { role: 'user', content: workflowGenerationRequest }
      ], {
        maxTokens: 12000,  // Increased to handle reasoning + output
        verbosity: 'low',
        effort: 'medium'   // Reduced from high to medium to save reasoning tokens
      })

      if (!llmResponse.success || !llmResponse.content) {
        throw new Error(llmResponse.error || 'No content received from LLM')
      }

      const fullContent = llmResponse.content
      console.log('📝 Content from LLM:', fullContent.substring(0, 300))

      // Call onChunk with the full content for compatibility
      onChunk(fullContent)

      // Process the complete response as JSON
      let jsonContent = fullContent.trim()

      // Remove any markdown code blocks
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '')
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '')
      }

      // Parse JSON and convert to YAML
      let dslObject: any
      try {
        dslObject = JSON.parse(jsonContent)
      } catch (jsonError) {
        return {
          success: false,
          error: `Invalid JSON from streamed response: ${jsonError.message}\n\nContent preview: ${jsonContent.substring(0, 200)}...`
        }
      }

      // Fix node data structure: copy 'name' to 'data.title' if missing (same as generateDSL)
      if (dslObject.workflow?.graph?.nodes && Array.isArray(dslObject.workflow.graph.nodes)) {
        dslObject.workflow.graph.nodes.forEach((node: any, index: number) => {
          if (node && typeof node === 'object') {
            // Ensure data object exists
            if (!node.data || typeof node.data !== 'object') {
              node.data = {}
            }
            
            // Copy name to data.title if data.title is missing
            if (node.name && typeof node.name === 'string' && !node.data.title) {
              node.data.title = node.name
              console.log(`🔧 Fixed node ${index} (stream): copied name "${node.name}" to data.title`)
            }
            
            // Ensure data.title exists (fallback)
            if (!node.data.title || typeof node.data.title !== 'string') {
              const fallbackTitle = node.name || node.type || `Node ${index + 1}`
              node.data.title = fallbackTitle
              console.log(`🔧 Set fallback title for node ${index} (stream): "${fallbackTitle}"`)
            }
          }
        })
      }

      // Convert to YAML
      const yaml = await import('js-yaml')
      let yamlContent: string
      try {
        yamlContent = yaml.dump(dslObject, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          quotingType: '"',
          forceQuotes: false
        })
      } catch (yamlError) {
        return {
          success: false,
          error: `YAML conversion failed: ${yamlError.message}`
        }
      }

      const parseResult = parseDSL(yamlContent)
      if (!parseResult.success || !parseResult.workflow) {
        // Show first few lines for debugging
        const lines = yamlContent.split('\n').slice(0, 10)
        const preview = lines.map((line, i) => `${i + 1} | ${line}`).join('\n')

        return {
          success: false,
          error: `Generated DSL is invalid: ${parseResult.errors.join(', ')}\n\nGenerated content preview:\n${preview}`,
          yamlContent
        }
      }

      const lintResult = lintDSL(parseResult.workflow)

      return {
        success: true,
        dsl: parseResult.workflow,
        yamlContent,
        lintResult
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stream error'
      }
    }
  }

  /**
   * Clean YAML content to fix common formatting issues
   */
  private cleanYamlContent(yamlContent: string): string {
    // First, fix obvious structural issues
    let content = yamlContent

    // Fix unclosed quotes by ensuring they're balanced
    content = this.fixUnbalancedQuotes(content)

    // Critical fixes for most common failure patterns
    content = content
      // Fix broken quotes and missing # in colors
      .replace(/icon_background:\s*EFF1F5''/g, "icon_background: '#EFF1F5'")
      .replace(/icon_background:\s*([A-F0-9]{6})''/g, "icon_background: '#$1'")

      // Fix missing colons in common keys
      .replace(/^(\s*)name\s+'/gm, '$1name: \'')
      .replace(/^(\s*)description\s+'/gm, '$1description: \'')
      .replace(/^(\s*)mode\s+workflow/gm, '$1mode: workflow')
      .replace(/^(\s*)kind\s+app/gm, '$1kind: app')
      .replace(/^(\s*)version\s+(\d+\.[\d\.]+)/gm, '$1version: $2')

      // Fix the most critical issue: keys missing proper indentation/newlines
      // Pattern: "app: description:" should be "app:\n  description:"
      .replace(/^app:\s*description:/gm, 'app:\n  description:')
      .replace(/^workflow:\s*environment_variables/gm, 'workflow:\n  environment_variables:')
      .replace(/^(\w+):\s*(\w+):\s*/gm, '$1:\n  $2: ')

      // Fix the most common issue: "workflow" without colon
      .replace(/^workflow$/gm, 'workflow:')
      .replace(/^(\s*)workflow$/gm, '$1workflow:')

      // Fix other top-level keys without colons
      .replace(/^app$/gm, 'app:')
      .replace(/^kind app$/gm, 'kind: app')
      .replace(/^version (\d+\.[\d\.]+)$/gm, 'version: $1')

      // Fix merged lines (most critical patterns)
      .replace(/version:\s*0\.1\.5\s*workflow:/g, 'version: 0.1.5\n\nworkflow:')
      .replace(/kind:\s*app\s*version:/g, 'kind: app\nversion:')

      // Fix lines that start with colon (invalid YAML)
      .replace(/^\s*:\s*/gm, '')

      // Fix missing spaces after colons (but avoid URLs and already correct ones)
      .replace(/:\s*([^\s\n'])/g, ': $1')

    const lines = content.split('\n')
    const cleanedLines = []

    for (let index = 0; index < lines.length; index++) {
      let line = lines[index]

      // Skip completely empty lines
      if (!line.trim()) {
        cleanedLines.push(line)
        continue
      }

      // CRITICAL FIX: Handle lines that start with just a colon
      if (line.trim().startsWith(':')) {
        // If it's the first non-empty line, it should be "app:"
        if (index === 0 || lines.slice(0, index).every(l => !l.trim())) {
          // Handle both ": value" and just ":" cases
          if (line.trim() === ':') {
            cleanedLines.push('app:')
            continue
          } else {
            cleanedLines.push(line.replace(/^\s*:\s*/, 'app: '))
            continue
          }
        }

        // For other lines starting with ":", try to fix based on context
        const match = line.match(/^\s*:\s*(.*)$/)
        if (match) {
          const value = match[1]
          const prevLine = cleanedLines[cleanedLines.length - 1]

          // If previous line was a key without value, append the value
          if (prevLine && prevLine.trim().endsWith(':')) {
            cleanedLines[cleanedLines.length - 1] = prevLine + ' ' + value
            continue
          } else {
            // Otherwise, this is likely a malformed key-value, skip or fix
            console.warn(`Skipping malformed line: ${line}`)
            continue
          }
        }
      }

      // Fix missing space after colon (but not in URLs or object notation)
      if (line.includes(':') && !line.includes(': ') && !line.includes('://') &&
          !line.match(/\{[^}]*:[^}]*\}/) && !line.match(/\[[^\]]*:[^\]]*\]/)) {
        line = line.replace(/:([^\s:])/g, ': $1')
      }

      // Fix improper indentation for top-level keys
      if (line.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/) && line.startsWith(' ')) {
        line = line.trim() // Remove incorrect indentation from top-level keys
      }

      // Fix missing indentation for app properties
      if (cleanedLines.length > 0 && cleanedLines[0].includes('app:')) {
        if ((line.includes('description:') || line.includes('icon:') || line.includes('mode:') || line.includes('name:')) &&
            !line.startsWith('  ') && !line.startsWith('app:')) {
          line = '  ' + line.trim()
        }
      }

      // Fix missing indentation for workflow properties
      const workflowIndex = cleanedLines.findIndex(l => l.trim() === 'workflow:')
      if (workflowIndex >= 0 && index > workflowIndex) {
        if ((line.includes('environment_variables:') || line.includes('features:') || line.includes('graph:')) &&
            !line.startsWith('  ') && !line.startsWith('workflow:')) {
          line = '  ' + line.trim()
        }
      }

      // CRITICAL FIX: Never allow standalone "workflow" without colon
      if (line.trim() === 'workflow') {
        // This should likely be part of a "mode: workflow" under app
        // Check if we're under app section and missing mode
        const appIndex = cleanedLines.findIndex(l => l.trim() === 'app:')
        const hasMode = cleanedLines.some(l => l.includes('mode:'))
        const hasWorkflowSection = cleanedLines.some(l => l.trim() === 'workflow:')

        if (appIndex >= 0 && !hasMode && !hasWorkflowSection) {
          // Missing mode under app
          line = '  mode: workflow'
        } else if (!hasWorkflowSection) {
          // Missing workflow section
          line = 'workflow:'
        } else {
          // Already have both, this might be duplicate - skip
          continue
        }
      }

      // Additional fix for other common standalone keywords
      if (line.trim() === 'app') {
        line = 'app:'
      }
      if (line.trim() === 'kind') {
        line = 'kind: app'
      }
      if (line.trim().match(/^version\s*$/)) {
        line = 'version: 0.1.5'
      }

      // Fix broken key-value structure
      if (line.trim() && !line.includes(':') && !line.trim().startsWith('-') &&
          !line.trim().startsWith('#') && line.trim() !== '[]' && line.trim() !== '{}') {
        // This might be a value that got separated from its key
        const prevLine = cleanedLines[cleanedLines.length - 1]
        if (prevLine && prevLine.trim().endsWith(':')) {
          cleanedLines[cleanedLines.length - 1] = prevLine + ' ' + line.trim()
          continue
        }

        // Check if this might be a top-level key missing colon (like "kind app" partially fixed)
        const trimmed = line.trim()
        if (trimmed.match(/^(kind|version|app|workflow)\s+\w+/)) {
          // This is likely a malformed key-value that our regex missed
          const parts = trimmed.split(/\s+/, 2)
          if (parts.length === 2) {
            line = `${parts[0]}: ${parts[1]}`
          }
        }
      }

      cleanedLines.push(line)
    }

    // Final pass to ensure proper structure
    let result = cleanedLines.join('\n').trim()

    // Ensure the file starts with "app:"
    if (!result.startsWith('app:')) {
      if (result.startsWith(':')) {
        result = 'app' + result
      } else {
        result = 'app:\n' + result
      }
    }

    return result
  }

  /**
   * Fix unbalanced quotes in YAML content
   */
  private fixUnbalancedQuotes(content: string): string {
    const lines = content.split('\n')
    return lines.map(line => {
      // Count single quotes
      const singleQuotes = (line.match(/'/g) || []).length

      // If odd number of single quotes, likely unclosed
      if (singleQuotes % 2 === 1) {
        // Find the last single quote and add a closing one
        const lastQuoteIndex = line.lastIndexOf("'")
        if (lastQuoteIndex !== -1) {
          // Add closing quote at end of line (removing any trailing content that looks like a key)
          const beforeQuote = line.substring(0, lastQuoteIndex + 1)
          const afterQuote = line.substring(lastQuoteIndex + 1)

          // If there's content after quote that looks like a key, move it to next line
          const keyMatch = afterQuote.match(/\s*(\w+):/)
          if (keyMatch) {
            return beforeQuote + "'"
          } else {
            return beforeQuote + "'" + afterQuote
          }
        }
      }

      return line
    }).join('\n')
  }

  /**
   * Extract actionable suggestions from analysis text
   */
  private extractSuggestions(analysisText: string): string[] {
    const suggestions: string[] = []
    const lines = analysisText.split('\n')

    for (const line of lines) {
      // Look for suggestion patterns
      if (line.includes('suggest') || line.includes('recommend') || line.includes('consider') || line.includes('improve')) {
        const cleaned = line.replace(/^\s*[-*]\s*/, '').trim()
        if (cleaned.length > 10) {
          suggestions.push(cleaned)
        }
      }
    }

    return suggestions
  }

  /**
   * Test LLM connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; model?: string }> {
    try {
      const response = await this.makeRequest([
        { role: 'user', content: 'Hello, please respond with just "OK" to test the connection.' }
      ], {
        maxTokens: 20,
        verbosity: 'low',
        effort: 'high'
      })

      if (!response.success) {
        return {
          success: false,
          error: response.error
        }
      }

      return {
        success: true,
        model: this.settings.model
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }

  /**
   * Validate DSL without LLM
   */
  static validateDSL(yamlContent: string): DSLGenerationResult {
    try {
      const parseResult = parseDSL(yamlContent)
      if (!parseResult.success || !parseResult.workflow) {
        return {
          success: false,
          error: `DSL parsing failed: ${parseResult.errors.join(', ')}`
        }
      }

      const lintResult = lintDSL(parseResult.workflow)

      return {
        success: lintResult.isValid,
        dsl: parseResult.workflow,
        yamlContent,
        lintResult,
        error: lintResult.isValid ? undefined : 'DSL has validation errors'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation error'
      }
    }
  }

  /**
   * Create a specialized workflow generation request based on requirement analysis
   */
  private createWorkflowGenerationRequest(analysis: RequirementAnalysis, userRequirement: string): string {
    const {
      businessIntent,
      detectedWorkflowType,
      complexity,
      recommendedPattern,
      estimatedNodes,
      dataInputs,
      outputRequirements,
      businessLogic,
      integrationNeeds,
      performanceRequirements,
      securityConstraints,
      confidence
    } = analysis

    return `
## WORKFLOW GENERATION REQUEST

### Primary Requirement
${userRequirement}

### Analysis Summary
- **Business Intent**: ${businessIntent}
- **Workflow Type**: ${detectedWorkflowType}
- **Complexity Level**: ${complexity}
- **Recommended Pattern**: ${recommendedPattern}
- **Estimated Node Count**: ${estimatedNodes}
- **Analysis Confidence**: ${(confidence * 100).toFixed(1)}%

### Technical Specifications

#### Data Input Requirements
${dataInputs.map(input => `- **${input.name}** (${input.type}): ${input.description || 'Input data'} ${input.required ? '[Required]' : '[Optional]'}`).join('\n')}

#### Expected Outputs
${outputRequirements.map(output => `- ${output}`).join('\n')}

#### Business Logic Requirements
${businessLogic.length > 0 ? businessLogic.map(logic => `- ${logic}`).join('\n') : '- Standard processing workflow'}

#### Integration Requirements
${integrationNeeds.length > 0 ? integrationNeeds.map(integration => `- ${integration}`).join('\n') : '- No external integrations required'}

#### Performance Requirements
${performanceRequirements.length > 0 ? performanceRequirements.map(perf => `- ${perf}`).join('\n') : '- Standard performance expectations'}

#### Security Constraints
${securityConstraints.length > 0 ? securityConstraints.map(security => `- ${security}`).join('\n') : '- Standard security practices'}

### 🚨 CRITICAL NODE TYPE RESTRICTIONS 🚨

**ONLY USE THESE EXACT NODE TYPES - NO EXCEPTIONS:**
1. "start" - Entry point of workflow
2. "end" - Exit point of workflow  
3. "llm" - AI language model processing
4. "knowledge-retrieval" - Search knowledge base
5. "if-else" - Conditional branching logic
6. "template-transform" - Format/transform data
7. "parameter-extractor" - Extract parameters from input

**ABSOLUTELY FORBIDDEN NODE TYPES:**
❌ "task", "action", "conditional", "processor", "retriever", "decision", "transform", "extract", "categorize", "search", "format", "response", "escalate"

**MAPPING GUIDE - USE THESE EXACT REPLACEMENTS:**
- Customer categorization → "parameter-extractor"
- Knowledge base search → "knowledge-retrieval"  
- Conditional logic/routing → "if-else"
- Response formatting → "template-transform"
- AI text processing → "llm"
- Data extraction → "parameter-extractor"

### CRITICAL OUTPUT FORMAT REQUIREMENTS

🚨 **RESPOND WITH ONLY VALID JSON - NO OTHER TEXT** 🚨

Return ONLY a complete JSON object with this exact structure:
{
  "app": {
    "description": "Brief workflow description",
    "icon": "🤖",
    "icon_background": "#EFF1F5",
    "mode": "workflow",
    "name": "Workflow Name"
  },
  "kind": "app",
  "version": "0.1.5",
  "workflow": {
    "environment_variables": [],
    "features": {},
    "graph": {
      "edges": [array of edge objects],
      "nodes": [array of node objects],
      "viewport": {"x": 0, "y": 0, "zoom": 1}
    }
  }
}

### EXAMPLE NODE STRUCTURE - FOLLOW EXACTLY:

**Start Node:**
{
  "id": "start-1",
  "type": "start",
  "name": "Start",
  "position": {"x": 100, "y": 200},
  "data": {"title": "Start"}
}

**Parameter Extractor Node:**
{
  "id": "extract-1", 
  "type": "parameter-extractor",
  "name": "Extract Parameters",
  "position": {"x": 350, "y": 200},
  "data": {"title": "Extract Parameters"}
}

**Knowledge Retrieval Node:**
{
  "id": "kb-1",
  "type": "knowledge-retrieval", 
  "name": "Search Knowledge Base",
  "position": {"x": 600, "y": 200},
  "data": {"title": "Search Knowledge Base"}
}

**If-Else Node:**
{
  "id": "condition-1",
  "type": "if-else",
  "name": "Check Conditions", 
  "position": {"x": 850, "y": 200},
  "data": {"title": "Check Conditions"}
}

**LLM Node:**
{
  "id": "llm-1",
  "type": "llm",
  "name": "Generate Response",
  "position": {"x": 1100, "y": 200}, 
  "data": {"title": "Generate Response"}
}

**Template Transform Node:**
{
  "id": "template-1",
  "type": "template-transform",
  "name": "Format Output",
  "position": {"x": 1350, "y": 200},
  "data": {"title": "Format Output"}
}

**End Node:**
{
  "id": "end-1",
  "type": "end",
  "name": "End",
  "position": {"x": 1600, "y": 200},
  "data": {"title": "End"}
}

### FINAL REQUIREMENTS:
- Start with { and end with }
- No markdown, no explanations, no YAML
- Include minimum ${estimatedNodes} nodes with proper connections
- Position nodes: x: 100, 350, 600, 850, 1100, 1350, 1600... (250px apart), y: 200
- **CRITICAL**: Create a COMPLETE LINEAR WORKFLOW - every node must connect to the next node
- Every node MUST have "data.title" property matching the "name" property
- Use ONLY the 7 permitted node types listed above

**WORKFLOW CONNECTION RULES:**
🔗 **MANDATORY**: Each node must have exactly one outgoing edge (except End node)
🔗 **MANDATORY**: Each node must have exactly one incoming edge (except Start node)
🔗 **MANDATORY**: No isolated nodes - every node must be part of the main flow
🔗 **FORBIDDEN**: Parallel branches or disconnected nodes

**VALIDATION CHECKLIST:**
✅ JSON starts with { and ends with }
✅ All node types are from permitted list
✅ Every node has "data.title" field
✅ Nodes are positioned correctly
✅ EVERY node connected in linear sequence: Start → Node1 → Node2 → ... → End
✅ No forbidden node types used
✅ No isolated or disconnected nodes

Generate a production-ready workflow JSON implementing: ${userRequirement}
`
  }
}

/**
 * Utility function to format LLM errors for user display
 */
export function formatLLMError(error: string): string {
  if (error.includes('401') || error.includes('unauthorized')) {
    return 'Invalid API key. Please check your LLM settings.'
  }
  if (error.includes('429') || error.includes('rate limit')) {
    return 'Rate limit exceeded. Please wait a moment and try again.'
  }
  if (error.includes('400') || error.includes('bad request')) {
    return 'Invalid request. Please check your LLM model settings.'
  }
  if (error.includes('network') || error.includes('fetch')) {
    return 'Network error. Please check your internet connection and base URL.'
  }
  return error
}

/**
 * Get estimated token count for a prompt
 */
export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token for English
  return Math.ceil(text.length / 4)
}
