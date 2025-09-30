/**
 * Requirement Analyzer Engine
 *
 * This module analyzes user input to extract workflow requirements,
 * detect intent patterns, assess complexity levels, and provide
 * context for the Dify DSL Expert Prompt Engine.
 */

export interface RequirementAnalysis {
  businessIntent: string
  dataInputs: DataType[]
  outputRequirements: string[]
  businessLogic: string[]
  complexity: ComplexityLevel
  performanceRequirements: string[]
  securityConstraints: string[]
  integrationNeeds: string[]
  detectedWorkflowType: WorkflowType
  estimatedNodes: number
  recommendedPattern: WorkflowPattern
  confidence: number
}

export interface DataType {
  name: string
  type: 'text' | 'number' | 'boolean' | 'array' | 'object' | 'file'
  required: boolean
  description?: string
}

export type ComplexityLevel = 'Simple' | 'Moderate' | 'Complex' | 'Enterprise'

export type WorkflowType =
  | 'DOCUMENT_PROCESSING'
  | 'CUSTOMER_SERVICE'
  | 'DATA_PROCESSING'
  | 'CONTENT_GENERATION'
  | 'API_INTEGRATION'
  | 'AUTOMATION'
  | 'ANALYSIS'
  | 'UNKNOWN'

export type WorkflowPattern =
  | 'LINEAR_PROCESSING'
  | 'CONDITIONAL_BRANCHING'
  | 'PARALLEL_PROCESSING'
  | 'ITERATIVE_PROCESSING'
  | 'RAG_PIPELINE'
  | 'MULTI_STAGE_ANALYSIS'
  | 'SERVICE_ORCHESTRATION'

/**
 * Advanced Requirement Analyzer for Dify Workflow Generation
 */
export class RequirementAnalyzer {

  /**
   * Main analysis method that processes user input comprehensively
   */
  static analyzeRequirement(userInput: string): RequirementAnalysis {
    const normalizedInput = userInput.toLowerCase().trim()

    // Core analysis components
    const businessIntent = this.extractBusinessIntent(userInput)
    const workflowType = this.detectWorkflowType(normalizedInput)
    const complexity = this.assessComplexity(normalizedInput)
    const dataInputs = this.inferDataInputs(normalizedInput)
    const outputRequirements = this.extractOutputRequirements(normalizedInput)
    const businessLogic = this.extractBusinessLogic(normalizedInput)
    const integrationNeeds = this.detectIntegrationNeeds(normalizedInput)
    const performanceRequirements = this.assessPerformanceNeeds(normalizedInput)
    const securityConstraints = this.identifySecurityConstraints(normalizedInput)
    const recommendedPattern = this.recommendWorkflowPattern(workflowType, complexity)
    const estimatedNodes = this.estimateNodeCount(workflowType, complexity, businessLogic)
    const confidence = this.calculateConfidence(userInput, workflowType)

    return {
      businessIntent,
      dataInputs,
      outputRequirements,
      businessLogic,
      complexity,
      performanceRequirements,
      securityConstraints,
      integrationNeeds,
      detectedWorkflowType: workflowType,
      estimatedNodes,
      recommendedPattern,
      confidence
    }
  }

  /**
   * Extract the primary business intent from user input
   */
  private static extractBusinessIntent(input: string): string {
    // Remove common prefixes and clean the input
    const cleaned = input
      .replace(/^(create|build|make|generate|implement)\s+/i, '')
      .replace(/\s+workflow\s*$/i, '')
      .replace(/\s+system\s*$/i, '')
      .trim()

    return cleaned || 'General workflow automation'
  }

  /**
   * Detect the type of workflow based on keywords and patterns
   */
  private static detectWorkflowType(input: string): WorkflowType {
    const typePatterns: Record<WorkflowType, string[]> = {
      DOCUMENT_PROCESSING: [
        'document', 'file', 'pdf', 'extract', 'parse', 'analyze text', 'content analysis',
        'summarize', 'summary', 'report generation', 'document workflow'
      ],
      CUSTOMER_SERVICE: [
        'customer', 'support', 'ticket', 'inquiry', 'help desk', 'service request',
        'escalation', 'response', 'chat', 'customer service', 'faq', 'sentiment'
      ],
      DATA_PROCESSING: [
        'data', 'batch', 'process', 'transform', 'clean', 'validate', 'aggregate',
        'calculation', 'statistics', 'data analysis', 'etl', 'migration'
      ],
      CONTENT_GENERATION: [
        'generate', 'create content', 'write', 'blog', 'article', 'marketing',
        'seo', 'content creation', 'copywriting', 'social media'
      ],
      API_INTEGRATION: [
        'api', 'integration', 'webhook', 'third party', 'external service',
        'sync', 'orchestration', 'microservice', 'rest', 'graphql'
      ],
      AUTOMATION: [
        'automate', 'automation', 'schedule', 'trigger', 'workflow automation',
        'business process', 'task automation', 'robotic process'
      ],
      ANALYSIS: [
        'analyze', 'analysis', 'insight', 'pattern', 'classification', 'prediction',
        'machine learning', 'ai analysis', 'intelligence', 'recommendation'
      ],
      UNKNOWN: []
    }

    for (const [type, keywords] of Object.entries(typePatterns)) {
      if (type === 'UNKNOWN') continue
      if (keywords.some(keyword => input.includes(keyword))) {
        return type as WorkflowType
      }
    }

    return 'UNKNOWN'
  }

  /**
   * Assess the complexity level based on various indicators
   */
  private static assessComplexity(input: string): ComplexityLevel {
    let complexityScore = 0

    // Complexity indicators
    const complexityIndicators = [
      { patterns: ['simple', 'basic', 'easy'], score: -2 },
      { patterns: ['complex', 'advanced', 'enterprise', 'sophisticated'], score: 3 },
      { patterns: ['multiple', 'several', 'various', 'many'], score: 2 },
      { patterns: ['conditional', 'if', 'branch', 'decision'], score: 2 },
      { patterns: ['parallel', 'concurrent', 'batch'], score: 2 },
      { patterns: ['integration', 'api', 'external'], score: 2 },
      { patterns: ['analysis', 'ml', 'ai', 'intelligence'], score: 2 },
      { patterns: ['security', 'authentication', 'authorization'], score: 1 },
      { patterns: ['error handling', 'retry', 'fallback'], score: 1 },
      { patterns: ['scalable', 'performance', 'optimization'], score: 1 }
    ]

    for (const indicator of complexityIndicators) {
      if (indicator.patterns.some(pattern => input.includes(pattern))) {
        complexityScore += indicator.score
      }
    }

    // Word count factor
    const wordCount = input.split(' ').length
    if (wordCount > 50) complexityScore += 2
    else if (wordCount > 20) complexityScore += 1

    // Determine complexity level
    if (complexityScore <= 0) return 'Simple'
    if (complexityScore <= 3) return 'Moderate'
    if (complexityScore <= 6) return 'Complex'
    return 'Enterprise'
  }

  /**
   * Infer likely data inputs from the requirement description
   */
  private static inferDataInputs(input: string): DataType[] {
    const inputs: DataType[] = []

    // Common input patterns
    if (input.includes('user') || input.includes('query') || input.includes('question')) {
      inputs.push({
        name: 'user_query',
        type: 'text',
        required: true,
        description: 'User input or query'
      })
    }

    if (input.includes('file') || input.includes('document') || input.includes('upload')) {
      inputs.push({
        name: 'input_file',
        type: 'file',
        required: true,
        description: 'Input document or file'
      })
    }

    if (input.includes('data') && !inputs.some(i => i.name.includes('data'))) {
      inputs.push({
        name: 'input_data',
        type: 'object',
        required: true,
        description: 'Input data for processing'
      })
    }

    // Default fallback
    if (inputs.length === 0) {
      inputs.push({
        name: 'user_input',
        type: 'text',
        required: true,
        description: 'User input for processing'
      })
    }

    return inputs
  }

  /**
   * Extract expected output requirements
   */
  private static extractOutputRequirements(input: string): string[] {
    const outputs: string[] = []

    const outputPatterns = [
      { pattern: /report|summary|analysis/, output: 'Generated report or summary' },
      { pattern: /response|answer|reply/, output: 'Automated response' },
      { pattern: /recommendation|suggestion/, output: 'Recommendations' },
      { pattern: /classification|category/, output: 'Classification result' },
      { pattern: /extract|parse/, output: 'Extracted information' },
      { pattern: /score|rating|evaluation/, output: 'Quality or performance score' }
    ]

    for (const { pattern, output } of outputPatterns) {
      if (pattern.test(input)) {
        outputs.push(output)
      }
    }

    // Default output
    if (outputs.length === 0) {
      outputs.push('Processed result')
    }

    return outputs
  }

  /**
   * Extract business logic requirements
   */
  private static extractBusinessLogic(input: string): string[] {
    const logic: string[] = []

    const logicPatterns = [
      { pattern: /if|when|condition/, logic: 'Conditional processing logic' },
      { pattern: /validate|check|verify/, logic: 'Input validation and verification' },
      { pattern: /filter|sort|search/, logic: 'Data filtering and search logic' },
      { pattern: /escalat|priorit/, logic: 'Escalation and priority handling' },
      { pattern: /notif|alert/, logic: 'Notification and alerting logic' },
      { pattern: /retry|fallback|error/, logic: 'Error handling and retry logic' },
      { pattern: /batch|bulk|multiple/, logic: 'Batch processing logic' },
      { pattern: /schedul|trigger/, logic: 'Scheduling and triggering logic' }
    ]

    for (const { pattern, logic: logicItem } of logicPatterns) {
      if (pattern.test(input)) {
        logic.push(logicItem)
      }
    }

    return logic
  }

  /**
   * Detect integration needs
   */
  private static detectIntegrationNeeds(input: string): string[] {
    const integrations: string[] = []

    const integrationPatterns = [
      { pattern: /api|rest|graphql/, integration: 'REST/GraphQL API integration' },
      { pattern: /database|db|sql/, integration: 'Database connectivity' },
      { pattern: /webhook|callback/, integration: 'Webhook handling' },
      { pattern: /email|smtp/, integration: 'Email service integration' },
      { pattern: /slack|teams|discord/, integration: 'Communication platform integration' },
      { pattern: /aws|azure|gcp/, integration: 'Cloud service integration' },
      { pattern: /third.party|external/, integration: 'Third-party service integration' }
    ]

    for (const { pattern, integration } of integrationPatterns) {
      if (pattern.test(input)) {
        integrations.push(integration)
      }
    }

    return integrations
  }

  /**
   * Assess performance requirements
   */
  private static assessPerformanceNeeds(input: string): string[] {
    const performance: string[] = []

    if (/real.time|instant|immediate/.test(input)) {
      performance.push('Real-time processing required')
    }
    if (/batch|bulk|large/.test(input)) {
      performance.push('Batch processing optimization needed')
    }
    if (/scale|high.volume|concurrent/.test(input)) {
      performance.push('High scalability requirements')
    }
    if (/fast|quick|speed/.test(input)) {
      performance.push('Low latency optimization')
    }

    return performance
  }

  /**
   * Identify security constraints
   */
  private static identifySecurityConstraints(input: string): string[] {
    const security: string[] = []

    if (/auth|login|credential/.test(input)) {
      security.push('Authentication and authorization required')
    }
    if (/encrypt|secure|privacy/.test(input)) {
      security.push('Data encryption and privacy protection')
    }
    if (/compliance|gdpr|hipaa/.test(input)) {
      security.push('Regulatory compliance requirements')
    }
    if (/(personal|sensitive)\s+data/.test(input)) {
      security.push('Sensitive data handling protocols')
    }

    return security
  }

  /**
   * Recommend workflow pattern based on type and complexity
   */
  private static recommendWorkflowPattern(type: WorkflowType, complexity: ComplexityLevel): WorkflowPattern {
    const patternMatrix: Record<WorkflowType, Record<ComplexityLevel, WorkflowPattern>> = {
      DOCUMENT_PROCESSING: {
        Simple: 'LINEAR_PROCESSING',
        Moderate: 'RAG_PIPELINE',
        Complex: 'MULTI_STAGE_ANALYSIS',
        Enterprise: 'PARALLEL_PROCESSING'
      },
      CUSTOMER_SERVICE: {
        Simple: 'LINEAR_PROCESSING',
        Moderate: 'CONDITIONAL_BRANCHING',
        Complex: 'MULTI_STAGE_ANALYSIS',
        Enterprise: 'SERVICE_ORCHESTRATION'
      },
      DATA_PROCESSING: {
        Simple: 'LINEAR_PROCESSING',
        Moderate: 'ITERATIVE_PROCESSING',
        Complex: 'PARALLEL_PROCESSING',
        Enterprise: 'SERVICE_ORCHESTRATION'
      },
      CONTENT_GENERATION: {
        Simple: 'LINEAR_PROCESSING',
        Moderate: 'RAG_PIPELINE',
        Complex: 'MULTI_STAGE_ANALYSIS',
        Enterprise: 'PARALLEL_PROCESSING'
      },
      API_INTEGRATION: {
        Simple: 'LINEAR_PROCESSING',
        Moderate: 'CONDITIONAL_BRANCHING',
        Complex: 'SERVICE_ORCHESTRATION',
        Enterprise: 'PARALLEL_PROCESSING'
      },
      AUTOMATION: {
        Simple: 'LINEAR_PROCESSING',
        Moderate: 'CONDITIONAL_BRANCHING',
        Complex: 'ITERATIVE_PROCESSING',
        Enterprise: 'SERVICE_ORCHESTRATION'
      },
      ANALYSIS: {
        Simple: 'LINEAR_PROCESSING',
        Moderate: 'RAG_PIPELINE',
        Complex: 'MULTI_STAGE_ANALYSIS',
        Enterprise: 'PARALLEL_PROCESSING'
      },
      UNKNOWN: {
        Simple: 'LINEAR_PROCESSING',
        Moderate: 'CONDITIONAL_BRANCHING',
        Complex: 'MULTI_STAGE_ANALYSIS',
        Enterprise: 'SERVICE_ORCHESTRATION'
      }
    }

    return patternMatrix[type][complexity]
  }

  /**
   * Estimate the number of nodes needed
   */
  private static estimateNodeCount(type: WorkflowType, complexity: ComplexityLevel, businessLogic: string[]): number {
    let baseNodes = 3 // Start, Process, End

    // Type-based additions
    const typeAdditions: Record<WorkflowType, number> = {
      DOCUMENT_PROCESSING: 2, // Document Extractor, Knowledge Retrieval
      CUSTOMER_SERVICE: 3,    // Parameter Extraction, IF/ELSE, Knowledge Retrieval
      DATA_PROCESSING: 2,     // Code, Iteration
      CONTENT_GENERATION: 2,  // Knowledge Retrieval, Template
      API_INTEGRATION: 2,     // HTTP Request, Code
      AUTOMATION: 1,          // Additional control logic
      ANALYSIS: 2,            // Additional AI processing
      UNKNOWN: 0
    }

    baseNodes += typeAdditions[type]

    // Complexity multiplier
    const complexityMultiplier: Record<ComplexityLevel, number> = {
      Simple: 1,
      Moderate: 1.5,
      Complex: 2,
      Enterprise: 2.5
    }

    baseNodes = Math.ceil(baseNodes * complexityMultiplier[complexity])

    // Business logic additions
    baseNodes += businessLogic.length

    return Math.min(Math.max(baseNodes, 3), 15) // Cap between 3-15 nodes
  }

  /**
   * Calculate confidence score based on input quality and pattern matching
   */
  private static calculateConfidence(input: string, detectedType: WorkflowType): number {
    let confidence = 0.5 // Base confidence

    // Length factor
    const wordCount = input.split(' ').length
    if (wordCount > 10) confidence += 0.2
    if (wordCount > 30) confidence += 0.2

    // Specificity factor
    if (detectedType !== 'UNKNOWN') confidence += 0.2

    // Technical detail factor
    const technicalTerms = [
      'node', 'workflow', 'process', 'api', 'integration', 'automation',
      'ai', 'ml', 'llm', 'analysis', 'data', 'service'
    ]
    const matchedTerms = technicalTerms.filter(term => input.toLowerCase().includes(term))
    confidence += Math.min(matchedTerms.length * 0.05, 0.2)

    return Math.min(confidence, 0.95) // Cap at 95%
  }

  /**
   * Generate summary for logging and debugging
   */
  static generateAnalysisSummary(analysis: RequirementAnalysis): string {
    return `
Analysis Summary:
- Business Intent: ${analysis.businessIntent}
- Workflow Type: ${analysis.detectedWorkflowType}
- Complexity: ${analysis.complexity}
- Recommended Pattern: ${analysis.recommendedPattern}
- Estimated Nodes: ${analysis.estimatedNodes}
- Confidence: ${(analysis.confidence * 100).toFixed(1)}%
- Data Inputs: ${analysis.dataInputs.map(d => d.name).join(', ')}
- Business Logic: ${analysis.businessLogic.length} rules identified
- Integration Needs: ${analysis.integrationNeeds.length} integrations
    `.trim()
  }
}

export default RequirementAnalyzer