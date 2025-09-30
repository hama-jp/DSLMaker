/**
 * Workflow Generation Coordinator
 *
 * This coordinator orchestrates the multi-agent workflow generation pipeline,
 * managing the flow between Requirements Clarification, Architecture Design,
 * Node Configuration, and Quality Assurance agents to produce high-quality
 * Dify workflow DSL that surpasses what beginners could create manually.
 */

import RequirementsClarificationAgent, { ClarifiedRequirements, ClarificationQuestion } from './requirements-agent'
import WorkflowArchitectureAgent, { WorkflowArchitecture } from './architecture-agent'
import NodeConfigurationAgent, { ConfiguredWorkflow } from './node-configuration-agent'
import QualityAssuranceAgent, { QualityAssessment } from './quality-assurance-agent'

export interface GenerationRequest {
  userInput: string
  clarificationAnswers?: Record<string, string>
  preferences?: {
    complexity?: 'Simple' | 'Moderate' | 'Complex' | 'Enterprise'
    pattern?: string
    performance?: 'speed' | 'quality' | 'balanced'
    budget?: 'low' | 'medium' | 'high'
  }
  existingKnowledgeBases?: Array<{
    id: string
    name: string
    description: string
  }>
}

export interface GenerationProgress {
  stage: 'requirements' | 'architecture' | 'configuration' | 'quality_assurance' | 'completed'
  progress: number // 0-100
  currentStep: string
  estimatedTimeRemaining?: string
  stageResults?: {
    requirements?: ClarifiedRequirements
    architecture?: WorkflowArchitecture
    configuration?: ConfiguredWorkflow
    qualityAssessment?: QualityAssessment
  }
}

export interface GenerationResult {
  success: boolean
  finalWorkflow?: any // Complete Dify DSL YAML
  qualityScore?: number
  readinessLevel?: string
  clarificationNeeded?: {
    questions: ClarificationQuestion[]
    partialResults: ClarifiedRequirements
  }
  error?: {
    stage: string
    message: string
    details: string
    recoverable: boolean
  }
  metadata: {
    generationTime: number
    tokensUsed: number
    agentStages: Array<{
      agent: string
      duration: number
      success: boolean
      issues?: string[]
    }>
    recommendations: Array<{
      category: string
      description: string
      priority: 'high' | 'medium' | 'low'
    }>
  }
}

export type ProgressCallback = (progress: GenerationProgress) => void

/**
 * Workflow Generation Coordinator
 * Orchestrates the multi-agent pipeline for high-quality workflow generation
 */
export class WorkflowGenerationCoordinator {

  /**
   * Generate a complete workflow using the multi-agent pipeline
   */
  static async generateWorkflow(
    request: GenerationRequest,
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    const startTime = Date.now()
    const stageResults: GenerationProgress['stageResults'] = {}
    const agentStages: GenerationResult['metadata']['agentStages'] = []

    try {
      // Stage 1: Requirements Clarification
      onProgress?.({
        stage: 'requirements',
        progress: 10,
        currentStep: 'Analyzing user requirements and identifying clarification needs',
        estimatedTimeRemaining: '30-60 seconds'
      })

      const requirementsStart = Date.now()
      const clarifiedRequirements = await this.runRequirementsClarification(request)
      const requirementsDuration = Date.now() - requirementsStart

      agentStages.push({
        agent: 'Requirements Clarification Agent',
        duration: requirementsDuration,
        success: true
      })

      // Check if clarification is needed
      if (clarifiedRequirements.needsMoreClarification && !request.clarificationAnswers) {
        return {
          success: false,
          clarificationNeeded: {
            questions: clarifiedRequirements.clarificationQuestions,
            partialResults: clarifiedRequirements
          },
          metadata: {
            generationTime: Date.now() - startTime,
            tokensUsed: 0,
            agentStages,
            recommendations: []
          }
        }
      }

      stageResults.requirements = clarifiedRequirements

      onProgress?.({
        stage: 'requirements',
        progress: 25,
        currentStep: 'Requirements clarified successfully',
        stageResults
      })

      // Stage 2: Architecture Design
      onProgress?.({
        stage: 'architecture',
        progress: 30,
        currentStep: 'Designing optimal workflow architecture and selecting patterns',
        estimatedTimeRemaining: '45-90 seconds'
      })

      const architectureStart = Date.now()
      const workflowArchitecture = await this.runArchitectureDesign(clarifiedRequirements, request)
      const architectureDuration = Date.now() - architectureStart

      agentStages.push({
        agent: 'Workflow Architecture Agent',
        duration: architectureDuration,
        success: true
      })

      stageResults.architecture = workflowArchitecture

      onProgress?.({
        stage: 'architecture',
        progress: 50,
        currentStep: `Architecture designed: ${workflowArchitecture.pattern} pattern with ${workflowArchitecture.estimatedNodes} nodes`,
        stageResults
      })

      // Stage 3: Node Configuration
      onProgress?.({
        stage: 'configuration',
        progress: 55,
        currentStep: 'Configuring nodes with optimized parameters and prompts',
        estimatedTimeRemaining: '60-120 seconds'
      })

      const configurationStart = Date.now()
      const configuredWorkflow = await this.runNodeConfiguration(workflowArchitecture, clarifiedRequirements, request)
      const configurationDuration = Date.now() - configurationStart

      agentStages.push({
        agent: 'Node Configuration Agent',
        duration: configurationDuration,
        success: true
      })

      stageResults.configuration = configuredWorkflow

      onProgress?.({
        stage: 'configuration',
        progress: 75,
        currentStep: 'Node configurations optimized with advanced prompt engineering',
        stageResults
      })

      // Stage 4: Quality Assurance
      onProgress?.({
        stage: 'quality_assurance',
        progress: 80,
        currentStep: 'Performing comprehensive quality validation and final optimizations',
        estimatedTimeRemaining: '30-60 seconds'
      })

      const qaStart = Date.now()
      const qualityAssessment = await this.runQualityAssurance(configuredWorkflow, clarifiedRequirements, request)
      const qaDuration = Date.now() - qaStart

      agentStages.push({
        agent: 'Quality Assurance Agent',
        duration: qaDuration,
        success: true,
        issues: qualityAssessment.detailedIssues.map(issue => `${issue.severity}: ${issue.description}`)
      })

      stageResults.qualityAssessment = qualityAssessment

      onProgress?.({
        stage: 'completed',
        progress: 100,
        currentStep: `Workflow generation complete! Quality Score: ${qualityAssessment.overallScore}/100 (Grade: ${qualityAssessment.grade})`,
        stageResults
      })

      // Generate final metadata
      const totalTime = Date.now() - startTime
      const estimatedTokens = this.calculateTotalTokenUsage(stageResults)

      const recommendations = qualityAssessment.recommendations.map(rec => ({
        category: rec.category,
        description: rec.description,
        priority: rec.priority
      }))

      return {
        success: true,
        finalWorkflow: qualityAssessment.finalWorkflow,
        qualityScore: qualityAssessment.overallScore,
        readinessLevel: qualityAssessment.readinessLevel,
        metadata: {
          generationTime: totalTime,
          tokensUsed: estimatedTokens,
          agentStages,
          recommendations
        }
      }

    } catch (error) {
      const errorStage = this.determineErrorStage(error, agentStages)

      agentStages.push({
        agent: errorStage.agent,
        duration: 0,
        success: false,
        issues: [error instanceof Error ? error.message : String(error)]
      })

      return {
        success: false,
        error: {
          stage: errorStage.stage,
          message: error instanceof Error ? error.message : String(error),
          details: error instanceof Error ? error.stack || '' : '',
          recoverable: this.isRecoverableError(error)
        },
        metadata: {
          generationTime: Date.now() - startTime,
          tokensUsed: this.calculateTotalTokenUsage(stageResults),
          agentStages,
          recommendations: []
        }
      }
    }
  }

  /**
   * Run requirements clarification with existing answers if provided
   */
  private static async runRequirementsClarification(request: GenerationRequest): Promise<ClarifiedRequirements> {
    return await RequirementsClarificationAgent.analyzeAndClarify(
      request.userInput,
      request.clarificationAnswers || {}
    )
  }

  /**
   * Run architecture design with user preferences
   */
  private static async runArchitectureDesign(
    requirements: ClarifiedRequirements,
    request: GenerationRequest
  ): Promise<WorkflowArchitecture> {
    // Apply user preferences to requirements if provided
    if (request.preferences?.complexity) {
      requirements.complexity = request.preferences.complexity
    }

    // Integrate knowledge base information
    if (request.existingKnowledgeBases?.length) {
      requirements.finalRequirements.integrationNeeds.push(
        `Integration with knowledge bases: ${request.existingKnowledgeBases.map(kb => kb.name).join(', ')}`
      )
    }

    return await WorkflowArchitectureAgent.designArchitecture(requirements)
  }

  /**
   * Run node configuration with performance preferences
   */
  private static async runNodeConfiguration(
    architecture: WorkflowArchitecture,
    requirements: ClarifiedRequirements,
    request: GenerationRequest
  ): Promise<ConfiguredWorkflow> {
    // Apply performance preferences
    if (request.preferences?.performance === 'speed') {
      // Optimize for speed - use faster models, lower quality where appropriate
      architecture.nodes.forEach(node => {
        if (node.type === 'llm' && node.configuration.model) {
          node.configuration.model.name = 'gpt-3.5-turbo'
          node.configuration.model.completion_params.max_tokens = Math.min(
            node.configuration.model.completion_params.max_tokens || 1000,
            500
          )
        }
      })
    } else if (request.preferences?.performance === 'quality') {
      // Optimize for quality - use best models, higher quality settings
      architecture.nodes.forEach(node => {
        if (node.type === 'llm' && node.configuration.model) {
          node.configuration.model.name = 'gpt-4'
          node.configuration.model.completion_params.temperature = Math.min(
            node.configuration.model.completion_params.temperature || 0.1,
            0.1
          )
        }
      })
    }

    return await NodeConfigurationAgent.configureWorkflow(architecture, requirements)
  }

  /**
   * Run quality assurance with budget considerations
   */
  private static async runQualityAssurance(
    configuredWorkflow: ConfiguredWorkflow,
    requirements: ClarifiedRequirements,
    request: GenerationRequest
  ): Promise<QualityAssessment> {
    const assessment = await QualityAssuranceAgent.performQualityAssurance(configuredWorkflow, requirements)

    // Apply budget optimizations if needed
    if (request.preferences?.budget === 'low') {
      this.applyBudgetOptimizations(assessment.finalWorkflow)
    }

    return assessment
  }

  /**
   * Apply budget optimizations to reduce costs
   */
  private static applyBudgetOptimizations(workflow: any): void {
    if (workflow?.workflow?.graph?.nodes) {
      workflow.workflow.graph.nodes.forEach((node: any) => {
        if (node.data?.model?.completion_params) {
          // Reduce max_tokens to save costs
          node.data.model.completion_params.max_tokens = Math.min(
            node.data.model.completion_params.max_tokens || 1000,
            800
          )

          // Use more cost-effective model where appropriate
          if (node.data.model.name === 'gpt-4' && node.data.title?.includes('Simple')) {
            node.data.model.name = 'gpt-3.5-turbo'
          }
        }
      })
    }
  }

  /**
   * Calculate total token usage across all stages
   */
  private static calculateTotalTokenUsage(stageResults: GenerationProgress['stageResults']): number {
    let totalTokens = 0

    // Base estimation for agent processing
    totalTokens += 500 // Requirements analysis

    if (stageResults?.architecture) {
      totalTokens += stageResults.architecture.estimatedTokens || 0
    }

    totalTokens += 300 // Node configuration
    totalTokens += 200 // Quality assurance

    return totalTokens
  }

  /**
   * Determine which stage an error occurred in
   */
  private static determineErrorStage(error: unknown, completedStages: any[]): { stage: string; agent: string } {
    const stageCount = completedStages.length

    const stageMapping = [
      { stage: 'requirements', agent: 'Requirements Clarification Agent' },
      { stage: 'architecture', agent: 'Workflow Architecture Agent' },
      { stage: 'configuration', agent: 'Node Configuration Agent' },
      { stage: 'quality_assurance', agent: 'Quality Assurance Agent' }
    ]

    return stageMapping[stageCount] || { stage: 'unknown', agent: 'Unknown Agent' }
  }

  /**
   * Determine if an error is recoverable
   */
  private static isRecoverableError(error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // API errors, timeouts, and network issues are typically recoverable
    const recoverablePatterns = [
      'timeout',
      'network',
      'api',
      'rate limit',
      'temporary',
      'retry'
    ]

    return recoverablePatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern)
    )
  }

  /**
   * Generate a workflow summary for user display
   */
  static generateWorkflowSummary(result: GenerationResult): string {
    if (!result.success) {
      return `Workflow generation ${result.clarificationNeeded ? 'needs clarification' : 'failed'}`
    }

    const { qualityScore, readinessLevel, metadata } = result
    const duration = Math.round(metadata.generationTime / 1000)

    return `
# Workflow Generation Complete! 🎉

**Quality Score**: ${qualityScore}/100
**Readiness Level**: ${readinessLevel}
**Generation Time**: ${duration} seconds
**Estimated Tokens**: ${metadata.tokensUsed}

## Agent Performance
${metadata.agentStages.map(stage =>
  `- ✅ ${stage.agent}: ${Math.round(stage.duration / 1000)}s`
).join('\n')}

## Key Recommendations
${metadata.recommendations.slice(0, 3).map(rec =>
  `- **${rec.priority.toUpperCase()}**: ${rec.description}`
).join('\n')}

${readinessLevel === 'production' ?
  '🚀 **Ready for Production Deployment!**' :
  `📝 **Status**: ${readinessLevel} - See recommendations for improvements`
}
    `.trim()
  }

  /**
   * Retry workflow generation with different parameters
   */
  static async retryGeneration(
    originalRequest: GenerationRequest,
    failedResult: GenerationResult,
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    // Modify request based on failure analysis
    const retryRequest: GenerationRequest = {
      ...originalRequest,
      preferences: {
        ...originalRequest.preferences,
        // Use simpler settings for retry
        complexity: 'Simple',
        performance: 'speed'
      }
    }

    return await this.generateWorkflow(retryRequest, onProgress)
  }
}

export default WorkflowGenerationCoordinator

/**
 * Convenience function for simple workflow generation
 */
export async function generateWorkflowFromInput(
  userInput: string,
  options?: {
    onProgress?: ProgressCallback
    clarificationAnswers?: Record<string, string>
    preferences?: GenerationRequest['preferences']
  }
): Promise<GenerationResult> {
  const request: GenerationRequest = {
    userInput,
    clarificationAnswers: options?.clarificationAnswers,
    preferences: options?.preferences
  }

  return await WorkflowGenerationCoordinator.generateWorkflow(request, options?.onProgress)
}