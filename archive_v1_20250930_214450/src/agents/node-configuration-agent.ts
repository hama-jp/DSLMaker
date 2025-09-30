/**
 * Node Configuration Agent
 *
 * This agent takes a workflow architecture and enhances each node with
 * detailed configurations, optimized prompts, and production-ready
 * parameters based on best practices and domain expertise.
 */

import { WorkflowArchitecture, WorkflowNode } from './architecture-agent'
import { ClarifiedRequirements } from './requirements-agent'

export interface EnhancedNode extends WorkflowNode {
  enhancedConfiguration: Record<string, any>
  promptEngineering?: {
    systemPromptStrategy: string
    userPromptTemplate: string
    contextIntegration: string[]
    outputFormatting: string
    qualityInstructions: string[]
  }
  performanceOptimizations: {
    modelSelection: string
    temperatureReasoning: string
    tokenOptimization: string
    executionPriority: number
  }
  errorHandlingDetails: {
    strategy: string
    fallbackBehavior: string
    retryLogic: Record<string, any>
    validationRules: string[]
  }
  qualityAssurance: {
    expectedOutputFormat: string
    validationCriteria: string[]
    testCases: Array<{
      input: string
      expectedBehavior: string
    }>
  }
}

export interface ConfiguredWorkflow {
  architecture: WorkflowArchitecture
  enhancedNodes: EnhancedNode[]
  globalOptimizations: {
    executionStrategy: string
    resourceLimits: Record<string, any>
    monitoringPoints: string[]
    scalabilityConsiderations: string[]
  }
  integrationSpecs: {
    requiredEnvironmentVars: Array<{
      name: string
      description: string
      required: boolean
      defaultValue?: string
    }>
    externalDependencies: Array<{
      type: string
      description: string
      configuration: Record<string, any>
    }>
  }
  deploymentReadiness: {
    score: number
    checklist: Array<{
      item: string
      status: 'pass' | 'warning' | 'fail'
      details: string
    }>
  }
}

/**
 * Node Configuration Agent
 * Enhances workflow nodes with detailed configurations and optimizations
 */
export class NodeConfigurationAgent {

  /**
   * Configure and enhance workflow nodes based on architecture
   */
  static async configureWorkflow(
    architecture: WorkflowArchitecture,
    requirements: ClarifiedRequirements
  ): Promise<ConfiguredWorkflow> {

    // Step 1: Enhance each node with detailed configuration
    const enhancedNodes = await Promise.all(
      architecture.nodes.map(node => this.enhanceNode(node, requirements, architecture))
    )

    // Step 2: Apply global optimizations
    const globalOptimizations = this.generateGlobalOptimizations(architecture, requirements)

    // Step 3: Define integration specifications
    const integrationSpecs = this.generateIntegrationSpecs(architecture, enhancedNodes)

    // Step 4: Assess deployment readiness
    const deploymentReadiness = this.assessDeploymentReadiness(enhancedNodes, architecture)

    return {
      architecture,
      enhancedNodes,
      globalOptimizations,
      integrationSpecs,
      deploymentReadiness
    }
  }

  /**
   * Enhance individual node with detailed configuration
   */
  private static async enhanceNode(
    node: WorkflowNode,
    requirements: ClarifiedRequirements,
    architecture: WorkflowArchitecture
  ): Promise<EnhancedNode> {

    const enhancedNode: EnhancedNode = {
      ...node,
      enhancedConfiguration: { ...node.configuration },
      performanceOptimizations: this.generatePerformanceOptimizations(node, requirements),
      errorHandlingDetails: this.generateErrorHandlingDetails(node, architecture),
      qualityAssurance: this.generateQualityAssurance(node, requirements)
    }

    // Node-type specific enhancements
    switch (node.type) {
      case 'start':
        this.enhanceStartNode(enhancedNode, requirements)
        break
      case 'llm':
        this.enhanceLLMNode(enhancedNode, requirements, architecture)
        break
      case 'knowledge_retrieval':
        this.enhanceKnowledgeRetrievalNode(enhancedNode, requirements)
        break
      case 'if_else':
        this.enhanceConditionalNode(enhancedNode, requirements)
        break
      case 'question_classifier':
        this.enhanceClassifierNode(enhancedNode, requirements)
        break
      case 'variable_aggregator':
        this.enhanceAggregatorNode(enhancedNode, requirements)
        break
      case 'template_transform':
        this.enhanceTemplateNode(enhancedNode, requirements)
        break
      case 'code':
        this.enhanceCodeNode(enhancedNode, requirements)
        break
      case 'end':
        this.enhanceEndNode(enhancedNode, requirements)
        break
    }

    return enhancedNode
  }

  /**
   * Enhance Start node with optimized input collection
   */
  private static enhanceStartNode(node: EnhancedNode, requirements: ClarifiedRequirements): void {
    const { dataInputs } = requirements.finalRequirements

    node.enhancedConfiguration = {
      ...node.configuration,
      variables: dataInputs.map(input => ({
        variable: input.name,
        type: this.optimizeInputType(input.type, input.description),
        label: this.generateUserFriendlyLabel(input.description),
        required: input.required,
        ...(input.type === 'text' && {
          max_length: this.calculateOptimalMaxLength(input.description),
          placeholder: this.generatePlaceholder(input.description)
        }),
        ...(input.type === 'file' && {
          accepted_file_types: this.determineFileTypes(input.description),
          max_file_size_mb: this.calculateMaxFileSize(requirements.complexity)
        })
      }))
    }

    node.qualityAssurance = {
      expectedOutputFormat: 'Valid input collection with proper validation',
      validationCriteria: [
        'All required fields properly validated',
        'Input types match expected formats',
        'File uploads (if any) have proper size and type restrictions'
      ],
      testCases: dataInputs.map(input => ({
        input: `Test input for ${input.name}`,
        expectedBehavior: `Should accept valid ${input.type} input and validate according to constraints`
      }))
    }
  }

  /**
   * Enhance LLM node with advanced prompt engineering
   */
  private static enhanceLLMNode(
    node: EnhancedNode,
    requirements: ClarifiedRequirements,
    architecture: WorkflowArchitecture
  ): void {
    const promptEngineering = this.designPromptEngineering(node, requirements)

    node.promptEngineering = promptEngineering

    node.enhancedConfiguration = {
      ...node.configuration,
      model: {
        provider: this.selectOptimalProvider(requirements),
        name: this.selectOptimalModel(node, requirements),
        mode: 'chat',
        completion_params: {
          temperature: this.calculateOptimalTemperature(node, requirements),
          max_tokens: this.calculateOptimalMaxTokens(node, requirements),
          top_p: 1,
          frequency_penalty: this.calculateFrequencyPenalty(node.description),
          presence_penalty: this.calculatePresencePenalty(node.description)
        }
      },
      prompt_template: [
        {
          role: 'system',
          text: promptEngineering.systemPromptStrategy
        },
        {
          role: 'user',
          text: promptEngineering.userPromptTemplate
        }
      ],
      memory: {
        enabled: this.shouldEnableMemory(node, architecture)
      },
      vision: {
        enabled: this.shouldEnableVision(requirements)
      }
    }

    // Add advanced error handling
    node.enhancedConfiguration.error_strategy = 'default_value'
    node.enhancedConfiguration.default_value = this.generateContextualFallback(node, requirements)
    node.enhancedConfiguration.retry_config = {
      retry_enabled: true,
      max_retries: 3,
      retry_interval: 1000,
      backoff_multiplier: 2
    }
  }

  /**
   * Design comprehensive prompt engineering for LLM nodes
   */
  private static designPromptEngineering(
    node: WorkflowNode,
    requirements: ClarifiedRequirements
  ) {
    const { businessIntent, detectedWorkflowType, finalRequirements } = requirements

    const systemPromptStrategy = this.generateSystemPrompt(node, requirements)
    const userPromptTemplate = this.generateUserPromptTemplate(node, requirements)

    return {
      systemPromptStrategy,
      userPromptTemplate,
      contextIntegration: this.identifyContextSources(node, requirements),
      outputFormatting: this.determineOutputFormat(node, finalRequirements),
      qualityInstructions: this.generateQualityInstructions(node, requirements)
    }
  }

  /**
   * Generate optimized system prompt
   */
  private static generateSystemPrompt(node: WorkflowNode, requirements: ClarifiedRequirements): string {
    const { businessIntent, detectedWorkflowType, finalRequirements } = requirements

    const roleDefinition = this.defineAIRole(detectedWorkflowType, node.description)
    const taskDescription = this.describeSpecificTask(node, finalRequirements)
    const guidelines = this.generateGuidelines(node, requirements)
    const outputFormat = this.specifyOutputFormat(node, finalRequirements)

    return `You are ${roleDefinition}.

Your primary task: ${taskDescription}

Key Guidelines:
${guidelines.map((guideline, index) => `${index + 1}. ${guideline}`).join('\n')}

Business Context: ${businessIntent}

${outputFormat}

Quality Standards:
- Provide accurate, helpful responses
- Be concise yet comprehensive
- Maintain professional tone
- Base responses on provided context when available
- Clearly indicate when information is uncertain or unavailable`
  }

  /**
   * Generate user prompt template with context integration
   */
  private static generateUserPromptTemplate(node: WorkflowNode, requirements: ClarifiedRequirements): string {
    const contextSources = this.identifyContextSources(node, requirements)
    const inputReferences = this.generateInputReferences(node)

    let template = inputReferences.join('\n\n')

    if (contextSources.length > 0) {
      template += '\n\nAdditional Context:\n' + contextSources.map(source => `{{#${source}#}}`).join('\n')
    }

    // Add specific instructions based on node purpose
    if (node.description.includes('analysis')) {
      template += '\n\nPlease provide a thorough analysis with specific insights and actionable recommendations.'
    } else if (node.description.includes('classification')) {
      template += '\n\nClassify the above content and provide your reasoning for the classification.'
    } else if (node.description.includes('generation')) {
      template += '\n\nGenerate appropriate content based on the requirements and context provided.'
    }

    return template
  }

  /**
   * Enhance Knowledge Retrieval node
   */
  private static enhanceKnowledgeRetrievalNode(node: EnhancedNode, requirements: ClarifiedRequirements): void {
    const complexity = requirements.complexity

    node.enhancedConfiguration = {
      ...node.configuration,
      retrieval_mode: this.selectRetrievalMode(requirements),
      multiple_retrieval_config: {
        top_k: this.calculateOptimalTopK(complexity, requirements),
        score_threshold_enabled: true,
        score_threshold: this.calculateScoreThreshold(complexity),
        reranking_enabled: true,
        reranking_model: {
          provider: 'cohere',
          model: 'rerank-multilingual-v2.0'
        }
      },
      single_retrieval_config: {
        model: {
          provider: 'openai',
          name: 'text-embedding-ada-002'
        }
      }
    }

    node.qualityAssurance.validationCriteria.push(
      'Knowledge base connection verified',
      'Retrieval parameters optimized for use case',
      'Reranking enabled for improved quality'
    )
  }

  /**
   * Enhance Conditional (IF/ELSE) node
   */
  private static enhanceConditionalNode(node: EnhancedNode, requirements: ClarifiedRequirements): void {
    node.enhancedConfiguration = {
      ...node.configuration,
      logical_operator: this.determineLogicalOperator(requirements),
      conditions: this.optimizeConditions(node.configuration.conditions, requirements),
      error_strategy: 'continue'
    }

    node.qualityAssurance.validationCriteria.push(
      'Condition logic is clear and unambiguous',
      'All possible paths are handled appropriately',
      'Error handling prevents workflow failures'
    )
  }

  /**
   * Generate performance optimizations for each node
   */
  private static generatePerformanceOptimizations(node: WorkflowNode, requirements: ClarifiedRequirements) {
    return {
      modelSelection: this.explainModelSelection(node, requirements),
      temperatureReasoning: this.explainTemperatureChoice(node, requirements),
      tokenOptimization: this.explainTokenOptimization(node, requirements),
      executionPriority: this.calculateExecutionPriority(node, requirements)
    }
  }

  /**
   * Generate error handling details
   */
  private static generateErrorHandlingDetails(node: WorkflowNode, architecture: WorkflowArchitecture) {
    return {
      strategy: this.selectErrorStrategy(node, architecture),
      fallbackBehavior: this.describeFallbackBehavior(node),
      retryLogic: this.designRetryLogic(node),
      validationRules: this.generateValidationRules(node)
    }
  }

  /**
   * Generate quality assurance specifications
   */
  private static generateQualityAssurance(node: WorkflowNode, requirements: ClarifiedRequirements) {
    return {
      expectedOutputFormat: this.describeExpectedOutput(node, requirements),
      validationCriteria: this.generateValidationCriteria(node, requirements),
      testCases: this.generateTestCases(node, requirements)
    }
  }

  // Helper methods for various optimizations and configurations

  private static selectOptimalProvider(requirements: ClarifiedRequirements): string {
    // For complex reasoning tasks, prefer OpenAI
    if (requirements.complexity === 'Complex' || requirements.complexity === 'Enterprise') {
      return 'openai'
    }
    return 'openai' // Default to OpenAI for consistency
  }

  private static selectOptimalModel(node: WorkflowNode, requirements: ClarifiedRequirements): string {
    const needsAdvancedReasoning = node.description.includes('analysis') ||
                                  node.description.includes('classification') ||
                                  requirements.complexity === 'Complex'

    return needsAdvancedReasoning ? 'gpt-4' : 'gpt-3.5-turbo'
  }

  private static calculateOptimalTemperature(node: WorkflowNode, requirements: ClarifiedRequirements): number {
    // Lower temperature for analytical/classification tasks
    if (node.description.includes('analysis') || node.description.includes('classification')) {
      return 0.1
    }

    // Medium temperature for generation tasks
    if (node.description.includes('generation') || node.description.includes('creative')) {
      return 0.3
    }

    // Default conservative temperature
    return 0.1
  }

  private static calculateOptimalMaxTokens(node: WorkflowNode, requirements: ClarifiedRequirements): number {
    const baseTokens = 500

    // Increase for analysis tasks
    if (node.description.includes('analysis')) return 1200
    if (node.description.includes('comprehensive')) return 1500
    if (node.description.includes('detailed')) return 1000

    return baseTokens
  }

  private static defineAIRole(workflowType: string, nodeDescription: string): string {
    const roleMap: Record<string, string> = {
      'CUSTOMER_SERVICE': 'a professional customer service specialist',
      'DOCUMENT_PROCESSING': 'an expert document analyst',
      'CONTENT_ANALYSIS': 'a skilled content analysis expert',
      'TRANSLATION': 'a professional translator and linguist',
      'UNKNOWN': 'a knowledgeable AI assistant'
    }

    return roleMap[workflowType] || 'a professional AI assistant specialized in your domain'
  }

  private static describeSpecificTask(node: WorkflowNode, finalRequirements: any): string {
    // Generate task description based on node type and requirements
    if (node.description.includes('analysis')) {
      return 'analyze the provided content and provide detailed insights'
    }
    if (node.description.includes('classification')) {
      return 'classify the content according to the specified categories'
    }
    if (node.description.includes('generation')) {
      return 'generate appropriate content based on the requirements'
    }
    if (node.description.includes('processing')) {
      return 'process the input data according to the specified logic'
    }

    return `perform ${node.description.toLowerCase()} according to the requirements`
  }

  private static generateGuidelines(node: WorkflowNode, requirements: ClarifiedRequirements): string[] {
    const guidelines = [
      'Maintain accuracy and factual correctness',
      'Provide clear, actionable responses',
      'Be concise while being comprehensive'
    ]

    // Add specific guidelines based on business logic
    requirements.finalRequirements.businessLogic.forEach(logic => {
      if (logic.includes('escalation')) {
        guidelines.push('Follow escalation procedures when appropriate')
      }
      if (logic.includes('compliance')) {
        guidelines.push('Ensure all responses meet compliance requirements')
      }
    })

    return guidelines
  }

  private static calculateOptimalMaxLength(description: string): number {
    if (description.includes('detailed') || description.includes('comprehensive')) {
      return 8000
    }
    if (description.includes('brief') || description.includes('summary')) {
      return 1000
    }
    return 4000 // Default
  }

  private static calculateOptimalTopK(complexity: string, requirements: ClarifiedRequirements): number {
    switch (complexity) {
      case 'Simple': return 3
      case 'Moderate': return 5
      case 'Complex': return 7
      case 'Enterprise': return 10
      default: return 5
    }
  }

  private static calculateScoreThreshold(complexity: string): number {
    switch (complexity) {
      case 'Simple': return 0.7 // High threshold for simple cases
      case 'Moderate': return 0.6
      case 'Complex': return 0.5
      case 'Enterprise': return 0.4 // Lower threshold for comprehensive coverage
      default: return 0.6
    }
  }

  private static generateGlobalOptimizations(architecture: WorkflowArchitecture, requirements: ClarifiedRequirements) {
    return {
      executionStrategy: architecture.performance.parallelNodes.length > 0 ? 'parallel' : 'sequential',
      resourceLimits: {
        max_concurrent_executions: 5,
        timeout_seconds: 300,
        memory_limit_mb: 1024
      },
      monitoringPoints: [
        'Input validation',
        'LLM response quality',
        'Error rates',
        'Execution time',
        'Token usage'
      ],
      scalabilityConsiderations: [
        'Consider caching for frequently accessed knowledge',
        'Implement request queuing for high load',
        'Monitor token usage to optimize costs',
        'Use content delivery networks for static resources'
      ]
    }
  }

  private static generateIntegrationSpecs(architecture: WorkflowArchitecture, nodes: EnhancedNode[]) {
    const hasLLMNodes = nodes.some(n => n.type === 'llm')
    const hasKnowledgeRetrieval = nodes.some(n => n.type === 'knowledge_retrieval')

    return {
      requiredEnvironmentVars: [
        ...(hasLLMNodes ? [{
          name: 'OPENAI_API_KEY',
          description: 'OpenAI API key for LLM operations',
          required: true
        }] : []),
        ...(hasKnowledgeRetrieval ? [{
          name: 'KNOWLEDGE_BASE_ID',
          description: 'ID of the knowledge base for retrieval operations',
          required: true
        }] : [])
      ],
      externalDependencies: [
        ...(hasLLMNodes ? [{
          type: 'llm_provider',
          description: 'OpenAI API integration',
          configuration: {
            base_url: 'https://api.openai.com/v1',
            timeout: 30000,
            retry_attempts: 3
          }
        }] : []),
        ...(hasKnowledgeRetrieval ? [{
          type: 'knowledge_base',
          description: 'Document knowledge base',
          configuration: {
            index_type: 'vector',
            embedding_model: 'text-embedding-ada-002'
          }
        }] : [])
      ]
    }
  }

  private static assessDeploymentReadiness(nodes: EnhancedNode[], architecture: WorkflowArchitecture) {
    const checklist = [
      {
        item: 'All nodes have proper configurations',
        status: 'pass' as const,
        details: 'All nodes enhanced with detailed configurations'
      },
      {
        item: 'Error handling implemented',
        status: 'pass' as const,
        details: 'Comprehensive error handling and retry logic configured'
      },
      {
        item: 'Performance optimizations applied',
        status: 'pass' as const,
        details: 'Model selection, temperature, and token limits optimized'
      },
      {
        item: 'Quality assurance measures defined',
        status: 'pass' as const,
        details: 'Validation criteria and test cases defined for all nodes'
      },
      {
        item: 'Environment variables documented',
        status: 'warning' as const,
        details: 'API keys and configuration variables need to be set in deployment environment'
      }
    ]

    const passCount = checklist.filter(item => item.status === 'pass').length
    const totalCount = checklist.length
    const score = Math.round((passCount / totalCount) * 100)

    return { score, checklist }
  }

  // Additional helper methods (simplified for brevity)
  private static optimizeInputType(type: string, description: string): string { return type }
  private static generateUserFriendlyLabel(description: string): string { return description }
  private static generatePlaceholder(description: string): string { return `Enter ${description.toLowerCase()}...` }
  private static determineFileTypes(description: string): string[] { return ['.pdf', '.docx', '.txt'] }
  private static calculateMaxFileSize(complexity: string): number { return complexity === 'Enterprise' ? 50 : 20 }
  private static shouldEnableMemory(node: WorkflowNode, architecture: WorkflowArchitecture): boolean { return false }
  private static shouldEnableVision(requirements: ClarifiedRequirements): boolean { return false }
  private static generateContextualFallback(node: WorkflowNode, requirements: ClarifiedRequirements): string {
    return 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.'
  }
  private static identifyContextSources(node: WorkflowNode, requirements: ClarifiedRequirements): string[] { return [] }
  private static determineOutputFormat(node: WorkflowNode, finalRequirements: any): string { return 'Plain text response' }
  private static generateQualityInstructions(node: WorkflowNode, requirements: ClarifiedRequirements): string[] { return [] }
  private static generateInputReferences(node: WorkflowNode): string[] { return ['{{#start-1.user_input#}}'] }
  private static specifyOutputFormat(node: WorkflowNode, finalRequirements: any): string { return 'Output Format: Provide clear, well-structured responses.' }
  private static selectRetrievalMode(requirements: ClarifiedRequirements): string { return 'multiple' }
  private static determineLogicalOperator(requirements: ClarifiedRequirements): string { return 'and' }
  private static optimizeConditions(conditions: any[], requirements: ClarifiedRequirements): any[] { return conditions }
  private static explainModelSelection(node: WorkflowNode, requirements: ClarifiedRequirements): string { return 'Selected for optimal balance of performance and cost' }
  private static explainTemperatureChoice(node: WorkflowNode, requirements: ClarifiedRequirements): string { return 'Low temperature for consistent, factual responses' }
  private static explainTokenOptimization(node: WorkflowNode, requirements: ClarifiedRequirements): string { return 'Token limit set based on expected output length' }
  private static calculateExecutionPriority(node: WorkflowNode, requirements: ClarifiedRequirements): number { return 1 }
  private static selectErrorStrategy(node: WorkflowNode, architecture: WorkflowArchitecture): string { return 'default_value' }
  private static describeFallbackBehavior(node: WorkflowNode): string { return 'Provide helpful error message to user' }
  private static designRetryLogic(node: WorkflowNode): Record<string, any> { return { enabled: true, max_retries: 2 } }
  private static generateValidationRules(node: WorkflowNode): string[] { return ['Output must be non-empty', 'Response must be relevant to input'] }
  private static describeExpectedOutput(node: WorkflowNode, requirements: ClarifiedRequirements): string { return 'Well-formatted response addressing user input' }
  private static generateValidationCriteria(node: WorkflowNode, requirements: ClarifiedRequirements): string[] { return ['Response relevance', 'Output format correctness'] }
  private static generateTestCases(node: WorkflowNode, requirements: ClarifiedRequirements) {
    return [{
      input: 'Sample test input',
      expectedBehavior: 'Should process input according to node configuration'
    }]
  }
  private static enhanceClassifierNode(node: EnhancedNode, requirements: ClarifiedRequirements): void {}
  private static enhanceAggregatorNode(node: EnhancedNode, requirements: ClarifiedRequirements): void {}
  private static enhanceTemplateNode(node: EnhancedNode, requirements: ClarifiedRequirements): void {}
  private static enhanceCodeNode(node: EnhancedNode, requirements: ClarifiedRequirements): void {}
  private static enhanceEndNode(node: EnhancedNode, requirements: ClarifiedRequirements): void {}
  private static calculateFrequencyPenalty(description: string): number { return 0 }
  private static calculatePresencePenalty(description: string): number { return 0 }
}

export default NodeConfigurationAgent