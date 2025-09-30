/**
 * Context Enhancer Engine
 *
 * This module enhances the AI prompt with contextual information based on
 * requirement analysis, workflow patterns, and business logic optimization.
 * It bridges the gap between user input and the Dify DSL Expert Prompt.
 */

import { RequirementAnalysis } from './requirement-analyzer'
import { DIFY_WORKFLOW_EXPERT_PROMPT, WORKFLOW_TYPE_PROMPTS, enhancePromptWithContext } from './ai-workflow-expert-prompt'
import { KnowledgeRetrievalGenerator } from './node-generators/knowledge-retrieval-generator'
import { IfElseGenerator } from './node-generators/if-else-generator'
import { TemplateTransformGenerator } from './node-generators/template-transform-generator'

export interface ContextEnhancementOptions {
  includeNodeGenerators?: boolean
  includeOptimizationSuggestions?: boolean
  includeArchitecturalGuidance?: boolean
  includeValidationRequirements?: boolean
  customContext?: Record<string, any>
}

export interface EnhancedPromptContext {
  originalPrompt: string
  enhancedPrompt: string
  contextualAdditions: string[]
  optimizationSuggestions: string[]
  architecturalGuidance: string[]
  nodeSpecifications: string[]
  validationRequirements: string[]
  confidenceScore: number
  estimatedComplexity: string
  recommendedApproach: string
}

/**
 * Advanced Context Enhancer for Dify Workflow Generation
 */
export class ContextEnhancer {

  /**
   * Main enhancement method that creates a comprehensive context-aware prompt
   */
  static enhancePrompt(
    userInput: string,
    analysis: RequirementAnalysis,
    options: ContextEnhancementOptions = {}
  ): EnhancedPromptContext {
    const {
      includeNodeGenerators = true,
      includeOptimizationSuggestions = true,
      includeArchitecturalGuidance = true,
      includeValidationRequirements = true,
      customContext = {}
    } = options

    // Start with the base enhanced prompt
    const basePrompt = enhancePromptWithContext(
      userInput,
      analysis.detectedWorkflowType,
      analysis.complexity
    )

    // Build contextual additions
    const contextualAdditions = this.buildContextualAdditions(analysis, customContext)
    const optimizationSuggestions = includeOptimizationSuggestions ?
      this.generateOptimizationSuggestions(analysis) : []
    const architecturalGuidance = includeArchitecturalGuidance ?
      this.generateArchitecturalGuidance(analysis) : []
    const nodeSpecifications = includeNodeGenerators ?
      this.generateNodeSpecifications(analysis) : []
    const validationRequirements = includeValidationRequirements ?
      this.generateValidationRequirements(analysis) : []

    // Assemble the enhanced prompt
    const enhancedPrompt = this.assembleEnhancedPrompt(
      basePrompt,
      {
        contextualAdditions,
        optimizationSuggestions,
        architecturalGuidance,
        nodeSpecifications,
        validationRequirements,
        analysis,
        userInput
      }
    )

    return {
      originalPrompt: DIFY_WORKFLOW_EXPERT_PROMPT,
      enhancedPrompt,
      contextualAdditions,
      optimizationSuggestions,
      architecturalGuidance,
      nodeSpecifications,
      validationRequirements,
      confidenceScore: analysis.confidence,
      estimatedComplexity: analysis.complexity,
      recommendedApproach: this.getRecommendedApproach(analysis)
    }
  }

  /**
   * Build contextual additions based on analysis
   */
  private static buildContextualAdditions(
    analysis: RequirementAnalysis,
    customContext: Record<string, any>
  ): string[] {
    const additions: string[] = []

    // Business intent clarification
    additions.push(`**Identified Business Intent:** ${analysis.businessIntent}`)

    // Input/Output mapping
    if (analysis.dataInputs.length > 0) {
      additions.push(`**Expected Inputs:** ${analysis.dataInputs.map(input =>
        `${input.name} (${input.type}${input.required ? ', required' : ''})`
      ).join(', ')}`)
    }

    if (analysis.outputRequirements.length > 0) {
      additions.push(`**Expected Outputs:** ${analysis.outputRequirements.join(', ')}`)
    }

    // Performance requirements
    if (analysis.performanceRequirements.length > 0) {
      additions.push(`**Performance Requirements:** ${analysis.performanceRequirements.join(', ')}`)
    }

    // Security constraints
    if (analysis.securityConstraints.length > 0) {
      additions.push(`**Security Constraints:** ${analysis.securityConstraints.join(', ')}`)
    }

    // Integration needs
    if (analysis.integrationNeeds.length > 0) {
      additions.push(`**Integration Requirements:** ${analysis.integrationNeeds.join(', ')}`)
    }

    // Custom context additions
    Object.entries(customContext).forEach(([key, value]) => {
      additions.push(`**${key}:** ${value}`)
    })

    return additions
  }

  /**
   * Generate optimization suggestions based on analysis
   */
  private static generateOptimizationSuggestions(analysis: RequirementAnalysis): string[] {
    const suggestions: string[] = []

    // Complexity-based optimizations
    switch (analysis.complexity) {
      case 'Simple':
        suggestions.push('Optimize for minimal latency and resource usage')
        suggestions.push('Use simple linear workflow pattern for fastest execution')
        break

      case 'Moderate':
        suggestions.push('Balance between functionality and performance')
        suggestions.push('Consider parallel processing for independent tasks')
        suggestions.push('Implement basic error handling and validation')
        break

      case 'Complex':
        suggestions.push('Implement comprehensive error handling and retry logic')
        suggestions.push('Optimize for parallel processing and resource efficiency')
        suggestions.push('Add quality gates and validation checkpoints')
        break

      case 'Enterprise':
        suggestions.push('Implement full enterprise-grade error handling and monitoring')
        suggestions.push('Design for horizontal scalability and high availability')
        suggestions.push('Include comprehensive audit trails and compliance features')
        suggestions.push('Optimize for cost efficiency at scale')
        break
    }

    // Workflow type specific optimizations
    switch (analysis.detectedWorkflowType) {
      case 'CUSTOMER_SERVICE':
        suggestions.push('Optimize for low latency customer response times')
        suggestions.push('Implement sentiment analysis for escalation logic')
        suggestions.push('Add fallback mechanisms for edge cases')
        break

      case 'DOCUMENT_PROCESSING':
        suggestions.push('Optimize for document parsing accuracy and speed')
        suggestions.push('Implement confidence scoring for quality control')
        suggestions.push('Add support for multiple document formats')
        break

      case 'CONTENT_GENERATION':
        suggestions.push('Optimize for content quality and consistency')
        suggestions.push('Implement multi-stage content refinement')
        suggestions.push('Add content validation and quality scoring')
        break

      case 'DATA_PROCESSING':
        suggestions.push('Optimize for data throughput and accuracy')
        suggestions.push('Implement data validation and cleansing steps')
        suggestions.push('Add batch processing capabilities for large datasets')
        break

      case 'API_INTEGRATION':
        suggestions.push('Implement robust API error handling and retry logic')
        suggestions.push('Add request/response validation and transformation')
        suggestions.push('Optimize for API rate limiting and throttling')
        break
    }

    // Performance-based optimizations
    if (analysis.performanceRequirements.some(req => req.includes('real-time'))) {
      suggestions.push('Minimize processing latency through streamlined workflow design')
      suggestions.push('Disable non-essential features like extensive logging for speed')
      suggestions.push('Use lightweight templates and minimal variable processing')
    }

    if (analysis.performanceRequirements.some(req => req.includes('batch'))) {
      suggestions.push('Implement parallel batch processing with iteration nodes')
      suggestions.push('Optimize memory usage for large dataset processing')
      suggestions.push('Add progress tracking and resumption capabilities')
    }

    return suggestions
  }

  /**
   * Generate architectural guidance based on analysis
   */
  private static generateArchitecturalGuidance(analysis: RequirementAnalysis): string[] {
    const guidance: string[] = []

    // Pattern-based guidance
    switch (analysis.recommendedPattern) {
      case 'LINEAR_PROCESSING':
        guidance.push('Use simple linear node sequence: Start → Process → End')
        guidance.push('Minimize complexity and focus on single-path execution')
        break

      case 'CONDITIONAL_BRANCHING':
        guidance.push('Implement IF/ELSE decision points for business logic branching')
        guidance.push('Design clear decision criteria and fallback paths')
        break

      case 'PARALLEL_PROCESSING':
        guidance.push('Design independent processing streams for parallel execution')
        guidance.push('Use Variable Aggregator to consolidate parallel results')
        break

      case 'RAG_PIPELINE':
        guidance.push('Implement Knowledge Retrieval → LLM → Template Transform pattern')
        guidance.push('Optimize retrieval parameters for accuracy and relevance')
        break

      case 'MULTI_STAGE_ANALYSIS':
        guidance.push('Design multi-stage analysis with validation checkpoints')
        guidance.push('Implement quality gates between analysis stages')
        break

      case 'SERVICE_ORCHESTRATION':
        guidance.push('Design service integration points with proper error handling')
        guidance.push('Implement service health checks and failover mechanisms')
        break

      case 'ITERATIVE_PROCESSING':
        guidance.push('Use Iteration nodes for batch and array processing')
        guidance.push('Implement progress tracking and error accumulation')
        break
    }

    // Node count guidance
    guidance.push(`**Estimated Node Count:** ${analysis.estimatedNodes} nodes`)

    if (analysis.estimatedNodes <= 5) {
      guidance.push('Focus on simple, efficient node connections')
    } else if (analysis.estimatedNodes <= 10) {
      guidance.push('Organize nodes into logical processing groups')
    } else {
      guidance.push('Consider modular design with clear separation of concerns')
      guidance.push('Implement comprehensive error handling between node groups')
    }

    // Integration guidance
    if (analysis.integrationNeeds.length > 0) {
      guidance.push('Design integration points with proper authentication and error handling')
      guidance.push('Implement data transformation layers for external service compatibility')
    }

    // Security guidance
    if (analysis.securityConstraints.length > 0) {
      guidance.push('Implement security controls at workflow entry and exit points')
      guidance.push('Use environment variables for sensitive configuration')
      guidance.push('Add audit logging for compliance and monitoring')
    }

    return guidance
  }

  /**
   * Generate node specifications based on analysis
   */
  private static generateNodeSpecifications(analysis: RequirementAnalysis): string[] {
    const specifications: string[] = []

    // Always include Start and End nodes
    specifications.push('**Start Node:** Configure with appropriate input variables and validation')
    specifications.push('**End Node:** Define output variables and result formatting')

    // Conditional nodes based on workflow type and complexity
    if (analysis.businessLogic.some(logic =>
        logic.includes('conditional') || logic.includes('decision'))) {
      const ifElseContext = {
        workflowType: analysis.detectedWorkflowType,
        complexity: analysis.complexity,
        businessLogic: analysis.businessLogic,
        integrationNeeds: analysis.integrationNeeds,
        position: { x: 400, y: 200 },
        nodeIndex: 2,
        decisionPoints: analysis.businessLogic.filter(logic =>
          logic.includes('conditional') || logic.includes('decision')),
        conditionalLogic: analysis.businessLogic,
        escalationRules: analysis.businessLogic.filter(logic =>
          logic.includes('escalation'))
      }
      specifications.push(IfElseGenerator.generatePromptFragment(ifElseContext))
    }

    // Knowledge retrieval for content and document workflows
    if (['DOCUMENT_PROCESSING', 'CONTENT_GENERATION', 'CUSTOMER_SERVICE', 'ANALYSIS']
        .includes(analysis.detectedWorkflowType)) {
      const knowledgeContext = {
        workflowType: analysis.detectedWorkflowType,
        complexity: analysis.complexity,
        businessLogic: analysis.businessLogic,
        integrationNeeds: analysis.integrationNeeds,
        position: { x: 300, y: 200 },
        nodeIndex: 1
      }
      specifications.push(KnowledgeRetrievalGenerator.generatePromptFragment(knowledgeContext))
    }

    // Template transform for output formatting
    if (analysis.outputRequirements.length > 0 ||
        analysis.complexity !== 'Simple') {
      const templateContext = {
        workflowType: analysis.detectedWorkflowType,
        complexity: analysis.complexity,
        businessLogic: analysis.businessLogic,
        integrationNeeds: analysis.integrationNeeds,
        position: { x: 500, y: 200 },
        nodeIndex: 3,
        templateRequirements: analysis.outputRequirements,
        dataTransformations: analysis.businessLogic.filter(logic =>
          logic.includes('format') || logic.includes('transform'))
      }
      specifications.push(TemplateTransformGenerator.generatePromptFragment(templateContext))
    }

    // LLM node for AI processing
    specifications.push(`
**LLM Node Specification:**
- Provider: Use OpenAI with optimized parameters for ${analysis.detectedWorkflowType}
- Model: Select appropriate model based on complexity (${analysis.complexity})
- Temperature: ${this.getOptimalTemperature(analysis)}
- Max Tokens: ${this.getOptimalMaxTokens(analysis)}
- Memory: ${analysis.complexity === 'Enterprise' ? 'Enabled with conversation history' : 'Basic'}`)

    return specifications
  }

  /**
   * Generate validation requirements based on analysis
   */
  private static generateValidationRequirements(analysis: RequirementAnalysis): string[] {
    const requirements: string[] = []

    // Basic validation requirements
    requirements.push('Validate all variable references and node connections')
    requirements.push('Ensure proper data type compatibility between nodes')
    requirements.push('Verify that all required inputs are properly configured')

    // Complexity-based validation
    switch (analysis.complexity) {
      case 'Simple':
        requirements.push('Validate basic workflow execution path')
        break

      case 'Moderate':
        requirements.push('Validate conditional logic and branching paths')
        requirements.push('Test error handling for common failure scenarios')
        break

      case 'Complex':
        requirements.push('Comprehensive validation of all processing paths')
        requirements.push('Performance testing for optimization verification')
        requirements.push('Security validation for sensitive data handling')
        break

      case 'Enterprise':
        requirements.push('Full enterprise validation including compliance checks')
        requirements.push('Load testing and scalability validation')
        requirements.push('Security audit and penetration testing')
        requirements.push('Disaster recovery and failover testing')
        break
    }

    // Workflow-specific validation
    switch (analysis.detectedWorkflowType) {
      case 'CUSTOMER_SERVICE':
        requirements.push('Validate sentiment analysis accuracy and escalation logic')
        requirements.push('Test response quality and customer satisfaction metrics')
        break

      case 'DOCUMENT_PROCESSING':
        requirements.push('Validate document parsing accuracy across different formats')
        requirements.push('Test confidence scoring and quality control mechanisms')
        break

      case 'API_INTEGRATION':
        requirements.push('Validate API error handling and retry mechanisms')
        requirements.push('Test authentication and authorization flows')
        break
    }

    // Performance validation
    if (analysis.performanceRequirements.length > 0) {
      requirements.push('Performance validation against specified requirements')
      requirements.push('Load testing for expected traffic patterns')
    }

    return requirements
  }

  /**
   * Assemble the complete enhanced prompt
   */
  private static assembleEnhancedPrompt(
    basePrompt: string,
    components: {
      contextualAdditions: string[]
      optimizationSuggestions: string[]
      architecturalGuidance: string[]
      nodeSpecifications: string[]
      validationRequirements: string[]
      analysis: RequirementAnalysis
      userInput: string
    }
  ): string {
    const {
      contextualAdditions,
      optimizationSuggestions,
      architecturalGuidance,
      nodeSpecifications,
      validationRequirements,
      analysis,
      userInput
    } = components

    return `${basePrompt}

## ENHANCED CONTEXT FOR CURRENT TASK

### USER REQUEST ANALYSIS
**Original Request:** ${userInput}

**Analysis Results:**
${contextualAdditions.join('\n')}

**Confidence Score:** ${(analysis.confidence * 100).toFixed(1)}%
**Recommended Pattern:** ${analysis.recommendedPattern}

### OPTIMIZATION STRATEGY
${optimizationSuggestions.map(suggestion => `- ${suggestion}`).join('\n')}

### ARCHITECTURAL GUIDANCE
${architecturalGuidance.map(guidance => `- ${guidance}`).join('\n')}

### NODE SPECIFICATIONS
${nodeSpecifications.join('\n\n')}

### VALIDATION REQUIREMENTS
${validationRequirements.map(requirement => `- ${requirement}`).join('\n')}

## GENERATION INSTRUCTIONS

Based on this enhanced context, generate a complete Dify Workflow DSL that:

1. **Addresses the specific business intent:** ${analysis.businessIntent}
2. **Implements the recommended pattern:** ${analysis.recommendedPattern}
3. **Meets the complexity requirements:** ${analysis.complexity}
4. **Satisfies all identified constraints and requirements**
5. **Follows enterprise-grade best practices for ${analysis.detectedWorkflowType}**

**Important:** Ensure the generated workflow is immediately deployable and production-ready, with all nodes properly configured and connected.`
  }

  /**
   * Get recommended approach based on analysis
   */
  private static getRecommendedApproach(analysis: RequirementAnalysis): string {
    const approaches = []

    // Primary approach based on workflow type
    approaches.push(`${analysis.detectedWorkflowType} workflow pattern`)

    // Complexity approach
    approaches.push(`${analysis.complexity} complexity implementation`)

    // Pattern approach
    approaches.push(`${analysis.recommendedPattern} architecture`)

    // Special considerations
    if (analysis.performanceRequirements.some(req => req.includes('real-time'))) {
      approaches.push('Real-time optimization focus')
    }

    if (analysis.securityConstraints.length > 0) {
      approaches.push('Security-first design')
    }

    if (analysis.integrationNeeds.length > 0) {
      approaches.push('Integration-centric architecture')
    }

    return approaches.join(' + ')
  }

  /**
   * Get optimal LLM temperature based on analysis
   */
  private static getOptimalTemperature(analysis: RequirementAnalysis): number {
    // Conservative temperature for high-precision workflows
    if (['API_INTEGRATION', 'DATA_PROCESSING'].includes(analysis.detectedWorkflowType)) {
      return 0.1
    }

    // Moderate temperature for analytical workflows
    if (['CUSTOMER_SERVICE', 'DOCUMENT_PROCESSING', 'ANALYSIS'].includes(analysis.detectedWorkflowType)) {
      return 0.3
    }

    // Higher temperature for creative workflows
    if (analysis.detectedWorkflowType === 'CONTENT_GENERATION') {
      return 0.7
    }

    // Default moderate temperature
    return 0.5
  }

  /**
   * Get optimal max tokens based on analysis
   */
  private static getOptimalMaxTokens(analysis: RequirementAnalysis): number {
    // Base tokens by complexity
    const baseTokens = {
      'Simple': 500,
      'Moderate': 1000,
      'Complex': 2000,
      'Enterprise': 4000
    }

    let tokens = baseTokens[analysis.complexity as keyof typeof baseTokens] || 1000

    // Adjust based on workflow type
    if (analysis.detectedWorkflowType === 'CONTENT_GENERATION') {
      tokens *= 2 // More tokens for content generation
    }

    if (analysis.performanceRequirements.some(req => req.includes('real-time'))) {
      tokens = Math.min(tokens, 500) // Limit tokens for real-time performance
    }

    return tokens
  }

  /**
   * Generate quick enhancement for simple use cases
   */
  static quickEnhance(userInput: string, workflowType: string, complexity: string): string {
    const basePrompt = enhancePromptWithContext(userInput, workflowType, complexity)

    return `${basePrompt}

## QUICK ENHANCEMENT CONTEXT

**Task:** ${userInput}
**Workflow Type:** ${workflowType}
**Complexity:** ${complexity}

**Quick Guidelines:**
- Generate a ${complexity.toLowerCase()} ${workflowType.toLowerCase().replace('_', ' ')} workflow
- Focus on practical implementation over theoretical perfection
- Ensure all nodes are properly connected and configured
- Include appropriate error handling for the complexity level

Generate the complete DSL now.`
  }
}

export default ContextEnhancer