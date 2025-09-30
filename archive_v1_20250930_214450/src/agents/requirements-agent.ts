/**
 * Requirements Clarification Agent
 *
 * This agent analyzes user input to identify unclear requirements,
 * generate clarifying questions, and iteratively refine workflow
 * specifications until they are clear and actionable.
 */

import { RequirementAnalyzer, RequirementAnalysis } from '../utils/requirement-analyzer'

export interface ClarificationQuestion {
  id: string
  category: 'input_data' | 'output_format' | 'business_logic' | 'integration' | 'performance' | 'constraints'
  question: string
  options?: string[]
  required: boolean
  followUp?: ClarificationQuestion[]
}

export interface ClarifiedRequirements {
  originalInput: string
  businessIntent: string
  detectedWorkflowType: string
  complexity: string
  clarificationQuestions: ClarificationQuestion[]
  answers: Record<string, string>
  finalRequirements: {
    dataInputs: Array<{
      name: string
      type: string
      description: string
      required: boolean
    }>
    outputRequirements: string[]
    businessLogic: string[]
    integrationNeeds: string[]
    performanceRequirements: string[]
    securityConstraints: string[]
  }
  confidence: number
  needsMoreClarification: boolean
}

/**
 * Requirements Clarification Agent
 * Analyzes user input and generates clarifying questions for ambiguous requirements
 */
export class RequirementsClarificationAgent {

  /**
   * Analyze user input and generate clarification questions if needed
   */
  static async analyzeAndClarify(userInput: string, existingAnswers: Record<string, string> = {}): Promise<ClarifiedRequirements> {
    // Step 1: Initial analysis using the existing RequirementAnalyzer
    const analysis = RequirementAnalyzer.analyzeRequirement(userInput)

    // Step 2: Identify ambiguities and missing information
    const ambiguities = this.identifyAmbiguities(userInput, analysis)

    // Step 3: Generate clarifying questions
    const questions = this.generateClarifyingQuestions(ambiguities, analysis)

    // Step 4: Filter questions based on existing answers
    const unansweredQuestions = questions.filter(q => !(q.id in existingAnswers))

    // Step 5: Determine if more clarification is needed
    const needsMoreClarification = unansweredQuestions.length > 0 || this.hasUnresolvedAmbiguities(analysis, existingAnswers)

    // Step 6: Build final requirements if sufficient information is available
    const finalRequirements = this.buildFinalRequirements(analysis, existingAnswers)

    // Step 7: Calculate confidence based on completeness
    const confidence = this.calculateConfidence(analysis, existingAnswers, unansweredQuestions)

    return {
      originalInput: userInput,
      businessIntent: analysis.businessIntent,
      detectedWorkflowType: analysis.detectedWorkflowType,
      complexity: analysis.complexity,
      clarificationQuestions: unansweredQuestions,
      answers: existingAnswers,
      finalRequirements,
      confidence,
      needsMoreClarification
    }
  }

  /**
   * Identify ambiguities and missing information in the user input
   */
  private static identifyAmbiguities(userInput: string, analysis: RequirementAnalysis): string[] {
    const ambiguities: string[] = []

    // Check for vague language
    const vagueTerms = ['something', 'somehow', 'maybe', 'perhaps', 'could', 'might', 'stuff', 'things']
    if (vagueTerms.some(term => userInput.toLowerCase().includes(term))) {
      ambiguities.push('vague_language')
    }

    // Check for missing input specifications
    if (analysis.dataInputs.length === 0 || analysis.dataInputs.every(input => !input.description)) {
      ambiguities.push('unclear_inputs')
    }

    // Check for unclear output requirements
    if (analysis.outputRequirements.length === 0 || analysis.outputRequirements.some(req => req.length < 10)) {
      ambiguities.push('unclear_outputs')
    }

    // Check for missing business logic
    if (analysis.businessLogic.length === 0) {
      ambiguities.push('missing_business_logic')
    }

    // Check for workflow type uncertainty
    if (analysis.detectedWorkflowType === 'UNKNOWN' || analysis.confidence < 0.7) {
      ambiguities.push('unclear_workflow_type')
    }

    // Check for scale/performance ambiguity
    if (analysis.performanceRequirements.length === 0 && analysis.complexity !== 'Simple') {
      ambiguities.push('unclear_scale')
    }

    // Check for integration ambiguity
    if (userInput.includes('integrate') || userInput.includes('connect') || userInput.includes('api')) {
      if (analysis.integrationNeeds.length === 0) {
        ambiguities.push('unclear_integrations')
      }
    }

    return ambiguities
  }

  /**
   * Generate clarifying questions based on identified ambiguities
   */
  private static generateClarifyingQuestions(ambiguities: string[], analysis: RequirementAnalysis): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = []

    ambiguities.forEach(ambiguity => {
      switch (ambiguity) {
        case 'unclear_inputs':
          questions.push({
            id: 'input_data_types',
            category: 'input_data',
            question: 'What types of data will users provide as input to your workflow?',
            options: [
              'Text/Questions from users',
              'Documents/Files (PDF, Word, etc.)',
              'Structured data (JSON, CSV, etc.)',
              'Images or multimedia',
              'API data from external services',
              'Multiple types of data'
            ],
            required: true
          })
          break

        case 'unclear_outputs':
          questions.push({
            id: 'output_format',
            category: 'output_format',
            question: 'What format should the workflow output be in?',
            options: [
              'Plain text response',
              'Structured report (with sections/headings)',
              'JSON data for API consumption',
              'Formatted document (PDF/Word)',
              'Dashboard/visualization',
              'Multiple output formats'
            ],
            required: true
          })
          break

        case 'missing_business_logic':
          questions.push({
            id: 'business_rules',
            category: 'business_logic',
            question: 'Are there any specific business rules or logic that should be applied?',
            required: false,
            followUp: [{
              id: 'business_rules_details',
              category: 'business_logic',
              question: 'Please describe the specific business rules or conditions that should be handled.',
              required: true
            }]
          })
          break

        case 'unclear_workflow_type':
          questions.push({
            id: 'workflow_purpose',
            category: 'business_logic',
            question: 'What is the primary purpose of this workflow?',
            options: [
              'Answer questions using documents/knowledge',
              'Automate customer service responses',
              'Process and analyze data',
              'Generate content or reports',
              'Integrate with external APIs/services',
              'Automate business processes',
              'Analyze content for insights'
            ],
            required: true
          })
          break

        case 'unclear_scale':
          questions.push({
            id: 'expected_usage',
            category: 'performance',
            question: 'What is the expected usage level for this workflow?',
            options: [
              'Personal use (few requests per day)',
              'Team use (dozens of requests per day)',
              'Department use (hundreds of requests per day)',
              'Enterprise use (thousands of requests per day)',
              'Not sure - start small and scale'
            ],
            required: true
          })
          break

        case 'unclear_integrations':
          questions.push({
            id: 'integration_requirements',
            category: 'integration',
            question: 'What external systems or services need to be integrated?',
            required: true,
            followUp: [{
              id: 'integration_details',
              category: 'integration',
              question: 'Please provide details about the APIs, authentication requirements, and data formats for these integrations.',
              required: true
            }]
          })
          break

        case 'vague_language':
          questions.push({
            id: 'specification_clarity',
            category: 'business_logic',
            question: 'Can you provide more specific details about what you want the workflow to accomplish?',
            required: true
          })
          break
      }
    })

    // Add complexity-specific questions
    if (analysis.complexity === 'Complex' || analysis.complexity === 'Enterprise') {
      questions.push({
        id: 'error_handling',
        category: 'constraints',
        question: 'How should the workflow handle errors or unexpected situations?',
        options: [
          'Show error messages to users',
          'Provide fallback responses',
          'Route to human assistance',
          'Retry automatically',
          'Log errors and continue'
        ],
        required: true
      })
    }

    // Add domain-specific questions
    if (analysis.detectedWorkflowType === 'CUSTOMER_SERVICE') {
      questions.push({
        id: 'escalation_rules',
        category: 'business_logic',
        question: 'When should customer inquiries be escalated to human agents?',
        required: true
      })
    }

    if (analysis.detectedWorkflowType === 'DOCUMENT_PROCESSING') {
      questions.push({
        id: 'document_types',
        category: 'input_data',
        question: 'What types of documents will be processed?',
        options: [
          'PDFs',
          'Word documents',
          'Text files',
          'Web pages/URLs',
          'Images with text',
          'Multiple formats'
        ],
        required: true
      })
    }

    return questions
  }

  /**
   * Check if there are still unresolved ambiguities
   */
  private static hasUnresolvedAmbiguities(analysis: RequirementAnalysis, answers: Record<string, string>): boolean {
    // Check if critical questions are answered
    const criticalAnswers = ['input_data_types', 'output_format', 'workflow_purpose']
    return criticalAnswers.some(key => !(key in answers))
  }

  /**
   * Build final requirements from analysis and answers
   */
  private static buildFinalRequirements(analysis: RequirementAnalysis, answers: Record<string, string>) {
    const dataInputs = this.buildDataInputs(analysis, answers)
    const outputRequirements = this.buildOutputRequirements(analysis, answers)
    const businessLogic = this.buildBusinessLogic(analysis, answers)
    const integrationNeeds = this.buildIntegrationNeeds(analysis, answers)
    const performanceRequirements = this.buildPerformanceRequirements(analysis, answers)
    const securityConstraints = this.buildSecurityConstraints(analysis, answers)

    return {
      dataInputs,
      outputRequirements,
      businessLogic,
      integrationNeeds,
      performanceRequirements,
      securityConstraints
    }
  }

  /**
   * Build data inputs specification from analysis and answers
   */
  private static buildDataInputs(analysis: RequirementAnalysis, answers: Record<string, string>) {
    const inputs = analysis.dataInputs.map(input => ({
      name: input.name,
      type: input.type,
      description: input.description || 'User input',
      required: input.required
    }))

    // Add inputs based on clarification answers
    if (answers.input_data_types) {
      if (answers.input_data_types.includes('Documents')) {
        inputs.push({
          name: 'document_files',
          type: 'file',
          description: 'Documents to be processed (PDF, Word, etc.)',
          required: true
        })
      }

      if (answers.input_data_types.includes('Structured data')) {
        inputs.push({
          name: 'structured_data',
          type: 'object',
          description: 'Structured data input (JSON, CSV format)',
          required: true
        })
      }

      if (answers.input_data_types.includes('Images')) {
        inputs.push({
          name: 'image_files',
          type: 'file',
          description: 'Image files for processing',
          required: true
        })
      }
    }

    return inputs.length > 0 ? inputs : [{
      name: 'user_input',
      type: 'text',
      description: 'User input for processing',
      required: true
    }]
  }

  /**
   * Build output requirements from analysis and answers
   */
  private static buildOutputRequirements(analysis: RequirementAnalysis, answers: Record<string, string>): string[] {
    const outputs = [...analysis.outputRequirements]

    if (answers.output_format) {
      if (answers.output_format.includes('Structured report')) {
        outputs.push('Formatted report with clear sections and analysis')
      }
      if (answers.output_format.includes('JSON data')) {
        outputs.push('Machine-readable JSON response for API integration')
      }
      if (answers.output_format.includes('Dashboard')) {
        outputs.push('Visual dashboard with key metrics and insights')
      }
    }

    return outputs.length > 0 ? outputs : ['Processed response based on user input']
  }

  /**
   * Build business logic from analysis and answers
   */
  private static buildBusinessLogic(analysis: RequirementAnalysis, answers: Record<string, string>): string[] {
    const logic = [...analysis.businessLogic]

    if (answers.business_rules_details) {
      logic.push(answers.business_rules_details)
    }

    if (answers.escalation_rules) {
      logic.push(`Escalation logic: ${answers.escalation_rules}`)
    }

    if (answers.error_handling) {
      logic.push(`Error handling strategy: ${answers.error_handling}`)
    }

    return logic
  }

  /**
   * Build integration needs from analysis and answers
   */
  private static buildIntegrationNeeds(analysis: RequirementAnalysis, answers: Record<string, string>): string[] {
    const integrations = [...analysis.integrationNeeds]

    if (answers.integration_requirements) {
      integrations.push(answers.integration_requirements)
    }

    if (answers.integration_details) {
      integrations.push(`Integration details: ${answers.integration_details}`)
    }

    return integrations
  }

  /**
   * Build performance requirements from analysis and answers
   */
  private static buildPerformanceRequirements(analysis: RequirementAnalysis, answers: Record<string, string>): string[] {
    const performance = [...analysis.performanceRequirements]

    if (answers.expected_usage) {
      performance.push(`Expected usage level: ${answers.expected_usage}`)
    }

    return performance
  }

  /**
   * Build security constraints from analysis and answers
   */
  private static buildSecurityConstraints(analysis: RequirementAnalysis, answers: Record<string, string>): string[] {
    const security = [...analysis.securityConstraints]

    // Add security constraints based on workflow type and usage level
    if (answers.expected_usage?.includes('Enterprise')) {
      security.push('Enterprise-level security and compliance requirements')
    }

    if (answers.input_data_types?.includes('Documents')) {
      security.push('Document handling security and privacy protection')
    }

    return security
  }

  /**
   * Calculate confidence based on requirement completeness
   */
  private static calculateConfidence(analysis: RequirementAnalysis, answers: Record<string, string>, unansweredQuestions: ClarificationQuestion[]): number {
    let confidence = analysis.confidence

    // Boost confidence for answered clarifying questions
    const totalQuestions = unansweredQuestions.length + Object.keys(answers).length
    if (totalQuestions > 0) {
      const answerRatio = Object.keys(answers).length / totalQuestions
      confidence = Math.min(confidence + (answerRatio * 0.3), 0.95)
    }

    // Boost confidence for detailed answers
    const detailedAnswers = Object.values(answers).filter(answer => answer.length > 20)
    confidence += detailedAnswers.length * 0.05

    return Math.min(confidence, 0.95) // Cap at 95%
  }

  /**
   * Generate a user-friendly summary of the clarification results
   */
  static generateClarificationSummary(clarification: ClarifiedRequirements): string {
    const summary = []

    summary.push(`## Requirements Analysis Summary`)
    summary.push(`**Workflow Type**: ${clarification.detectedWorkflowType}`)
    summary.push(`**Complexity**: ${clarification.complexity}`)
    summary.push(`**Confidence**: ${(clarification.confidence * 100).toFixed(1)}%`)
    summary.push(``)

    if (clarification.needsMoreClarification) {
      summary.push(`### Additional Information Needed (${clarification.clarificationQuestions.length} questions)`)
      clarification.clarificationQuestions.forEach(q => {
        summary.push(`- ${q.question}`)
      })
      summary.push(``)
    }

    summary.push(`### Understood Requirements`)
    summary.push(`**Business Intent**: ${clarification.businessIntent}`)

    if (clarification.finalRequirements.dataInputs.length > 0) {
      summary.push(`**Data Inputs**: ${clarification.finalRequirements.dataInputs.map(i => i.name).join(', ')}`)
    }

    if (clarification.finalRequirements.outputRequirements.length > 0) {
      summary.push(`**Expected Outputs**: ${clarification.finalRequirements.outputRequirements.join(', ')}`)
    }

    if (clarification.finalRequirements.businessLogic.length > 0) {
      summary.push(`**Business Logic**: ${clarification.finalRequirements.businessLogic.length} rules identified`)
    }

    return summary.join('\n')
  }
}

export default RequirementsClarificationAgent