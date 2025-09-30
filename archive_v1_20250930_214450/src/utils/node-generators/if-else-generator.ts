/**
 * IF/ELSE Conditional Node Generator
 *
 * This module generates intelligent conditional logic nodes based on
 * business requirements, workflow patterns, and decision tree optimization.
 */

import { RequirementAnalysis } from '../requirement-analyzer'
import { NODE_TYPES } from '@/constants/node-types'

export interface IfElseNodeConfig {
  id: string
  type: typeof NODE_TYPES.IF_ELSE
  position: { x: number; y: number }
  data: {
    title: string
    conditions: Array<{
      condition: string
      logical_operator?: 'and' | 'or'
      comparison_operator?: 'contains' | 'not contains' | 'start with' | 'end with' | 'is' | 'is not' | 'empty' | 'not empty' | '>' | '<' | '>=' | '<=' | '=' | '!='
      variable?: string
      value?: string | number | boolean
    }>
    cases: Array<{
      case_id: string
      conditions: Array<{
        variable_selector: string[]
        comparison_operator: string
        value: string | number | boolean
      }>
      logical_operator?: 'and' | 'or'
    }>
    else_description?: string
  }
}

export interface IfElseGenerationContext {
  workflowType: string
  complexity: string
  businessLogic: string[]
  integrationNeeds: string[]
  position: { x: number; y: number }
  nodeIndex: number
  inputVariable?: string
  outputVariable?: string
  decisionPoints: string[]
  conditionalLogic: string[]
  escalationRules: string[]
}

/**
 * Advanced IF/ELSE Conditional Node Generator
 */
export class IfElseGenerator {

  /**
   * Generate optimized IF/ELSE node based on context
   */
  static generateNode(context: IfElseGenerationContext): IfElseNodeConfig {
    const config = this.getBaseConfiguration(context)

    // Apply workflow-specific conditional logic
    this.applyWorkflowConditionals(config, context)

    // Apply complexity-based decision trees
    this.applyComplexityDecisionTrees(config, context)

    // Apply business logic conditions
    this.applyBusinessLogicConditions(config, context)

    return config
  }

  /**
   * Get base configuration for IF/ELSE node
   */
  private static getBaseConfiguration(context: IfElseGenerationContext): IfElseNodeConfig {
    return {
      id: `if-else-${context.nodeIndex}`,
      type: NODE_TYPES.IF_ELSE,
      position: context.position,
      data: {
        title: this.generateTitle(context),
        conditions: this.getDefaultConditions(context),
        cases: this.getDefaultCases(context),
        else_description: this.getElseDescription(context)
      }
    }
  }

  /**
   * Generate contextual title for the conditional node
   */
  private static generateTitle(context: IfElseGenerationContext): string {
    const titleMappings = {
      'CUSTOMER_SERVICE': 'Customer Service Decision Logic',
      'DOCUMENT_PROCESSING': 'Document Classification Logic',
      'CONTENT_GENERATION': 'Content Strategy Decision',
      'DATA_PROCESSING': 'Data Validation Logic',
      'API_INTEGRATION': 'API Response Validation',
      'AUTOMATION': 'Process Decision Gateway',
      'ANALYSIS': 'Analysis Result Evaluation'
    }

    const baseTitle = titleMappings[context.workflowType as keyof typeof titleMappings] || 'Conditional Logic'

    // Add specific decision context if available
    if (context.decisionPoints.length > 0) {
      const primaryDecision = context.decisionPoints[0]
      if (primaryDecision.includes('quality')) return 'Quality Assessment Decision'
      if (primaryDecision.includes('escalation')) return 'Escalation Decision Logic'
      if (primaryDecision.includes('priority')) return 'Priority Classification Logic'
      if (primaryDecision.includes('validation')) return 'Validation Decision Gateway'
    }

    return baseTitle
  }

  /**
   * Generate default conditions based on context
   */
  private static getDefaultConditions(context: IfElseGenerationContext): Array<any> {
    const inputVar = context.inputVariable || 'previous_node.output'

    // Basic existence check
    return [{
      condition: `{{#${inputVar}#}} is not empty`,
      logical_operator: 'and',
      comparison_operator: 'not empty',
      variable: inputVar
    }]
  }

  /**
   * Generate default cases based on workflow type
   */
  private static getDefaultCases(context: IfElseGenerationContext): Array<any> {
    const inputVar = context.inputVariable || 'previous_node.output'

    return [
      {
        case_id: 'case-1',
        conditions: [{
          variable_selector: [inputVar],
          comparison_operator: 'not empty',
          value: ''
        }],
        logical_operator: 'and'
      }
    ]
  }

  /**
   * Generate else description
   */
  private static getElseDescription(context: IfElseGenerationContext): string {
    const descriptions = {
      'CUSTOMER_SERVICE': 'Route to default customer service handler',
      'DOCUMENT_PROCESSING': 'Send to manual review queue',
      'CONTENT_GENERATION': 'Use fallback content template',
      'DATA_PROCESSING': 'Skip processing and log for review',
      'API_INTEGRATION': 'Return error response to client',
      'AUTOMATION': 'Escalate to manual intervention',
      'ANALYSIS': 'Mark as inconclusive result'
    }

    return descriptions[context.workflowType as keyof typeof descriptions] || 'Handle default case'
  }

  /**
   * Apply workflow-specific conditional logic patterns
   */
  private static applyWorkflowConditionals(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    switch (context.workflowType) {
      case 'CUSTOMER_SERVICE':
        this.applyCustomerServiceConditionals(config, context)
        break

      case 'DOCUMENT_PROCESSING':
        this.applyDocumentProcessingConditionals(config, context)
        break

      case 'CONTENT_GENERATION':
        this.applyContentGenerationConditionals(config, context)
        break

      case 'API_INTEGRATION':
        this.applyAPIIntegrationConditionals(config, context)
        break

      case 'DATA_PROCESSING':
        this.applyDataProcessingConditionals(config, context)
        break

      default:
        this.applyGenericConditionals(config, context)
        break
    }
  }

  /**
   * Customer service specific conditionals
   */
  private static applyCustomerServiceConditionals(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    const sentimentVar = context.inputVariable || 'sentiment_analysis.sentiment_score'

    config.data.title = 'Customer Escalation Decision'
    config.data.conditions = [{
      condition: `{{#${sentimentVar}#}} < 0.5`,
      logical_operator: 'or',
      comparison_operator: '<',
      variable: sentimentVar,
      value: 0.5
    }]

    config.data.cases = [
      {
        case_id: 'escalate',
        conditions: [{
          variable_selector: [sentimentVar],
          comparison_operator: '<',
          value: 0.5
        }],
        logical_operator: 'and'
      },
      {
        case_id: 'auto_handle',
        conditions: [{
          variable_selector: [sentimentVar],
          comparison_operator: '>=',
          value: 0.5
        }],
        logical_operator: 'and'
      }
    ]

    config.data.else_description = 'Route to human agent for manual handling'
  }

  /**
   * Document processing specific conditionals
   */
  private static applyDocumentProcessingConditionals(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    const confidenceVar = context.inputVariable || 'document_analysis.confidence_score'

    config.data.title = 'Document Processing Quality Gate'
    config.data.conditions = [{
      condition: `{{#${confidenceVar}#}} > 0.8`,
      logical_operator: 'and',
      comparison_operator: '>',
      variable: confidenceVar,
      value: 0.8
    }]

    config.data.cases = [
      {
        case_id: 'high_confidence',
        conditions: [{
          variable_selector: [confidenceVar],
          comparison_operator: '>',
          value: 0.8
        }],
        logical_operator: 'and'
      },
      {
        case_id: 'medium_confidence',
        conditions: [{
          variable_selector: [confidenceVar],
          comparison_operator: '>=',
          value: 0.5
        }],
        logical_operator: 'and'
      }
    ]

    config.data.else_description = 'Send to manual review for quality assurance'
  }

  /**
   * Content generation specific conditionals
   */
  private static applyContentGenerationConditionals(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    const lengthVar = context.inputVariable || 'content_analysis.word_count'

    config.data.title = 'Content Quality Validation'
    config.data.conditions = [{
      condition: `{{#${lengthVar}#}} >= 100`,
      logical_operator: 'and',
      comparison_operator: '>=',
      variable: lengthVar,
      value: 100
    }]

    config.data.cases = [
      {
        case_id: 'sufficient_content',
        conditions: [{
          variable_selector: [lengthVar],
          comparison_operator: '>=',
          value: 100
        }],
        logical_operator: 'and'
      }
    ]

    config.data.else_description = 'Generate additional content to meet requirements'
  }

  /**
   * API integration specific conditionals
   */
  private static applyAPIIntegrationConditionals(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    const statusVar = context.inputVariable || 'api_response.status_code'

    config.data.title = 'API Response Validation'
    config.data.conditions = [{
      condition: `{{#${statusVar}#}} = 200`,
      logical_operator: 'and',
      comparison_operator: '=',
      variable: statusVar,
      value: 200
    }]

    config.data.cases = [
      {
        case_id: 'success_response',
        conditions: [{
          variable_selector: [statusVar],
          comparison_operator: '=',
          value: 200
        }],
        logical_operator: 'and'
      },
      {
        case_id: 'client_error',
        conditions: [{
          variable_selector: [statusVar],
          comparison_operator: '>=',
          value: 400
        }],
        logical_operator: 'and'
      }
    ]

    config.data.else_description = 'Handle API error with retry logic'
  }

  /**
   * Data processing specific conditionals
   */
  private static applyDataProcessingConditionals(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    const validVar = context.inputVariable || 'data_validation.is_valid'

    config.data.title = 'Data Validation Gateway'
    config.data.conditions = [{
      condition: `{{#${validVar}#}} is true`,
      logical_operator: 'and',
      comparison_operator: 'is',
      variable: validVar,
      value: true
    }]

    config.data.cases = [
      {
        case_id: 'valid_data',
        conditions: [{
          variable_selector: [validVar],
          comparison_operator: 'is',
          value: true
        }],
        logical_operator: 'and'
      }
    ]

    config.data.else_description = 'Reject invalid data and log error'
  }

  /**
   * Generic conditional logic for unknown workflow types
   */
  private static applyGenericConditionals(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    const inputVar = context.inputVariable || 'previous_node.output'

    config.data.conditions = [{
      condition: `{{#${inputVar}#}} is not empty`,
      logical_operator: 'and',
      comparison_operator: 'not empty',
      variable: inputVar
    }]

    config.data.cases = [
      {
        case_id: 'has_data',
        conditions: [{
          variable_selector: [inputVar],
          comparison_operator: 'not empty',
          value: ''
        }],
        logical_operator: 'and'
      }
    ]
  }

  /**
   * Apply complexity-based decision tree enhancements
   */
  private static applyComplexityDecisionTrees(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    switch (context.complexity) {
      case 'Simple':
        // Single condition, binary decision
        config.data.cases = config.data.cases.slice(0, 1)
        break

      case 'Moderate':
        // Multi-condition with 2-3 cases
        if (config.data.cases.length < 2) {
          config.data.cases.push({
            case_id: 'secondary',
            conditions: [{
              variable_selector: ['secondary_condition'],
              comparison_operator: 'not empty',
              value: ''
            }],
            logical_operator: 'and'
          })
        }
        break

      case 'Complex':
        // Advanced multi-condition logic with nested conditions
        this.addAdvancedConditions(config, context)
        break

      case 'Enterprise':
        // Comprehensive decision trees with multiple logical operators
        this.addEnterpriseDecisionLogic(config, context)
        break
    }
  }

  /**
   * Add advanced conditions for complex workflows
   */
  private static addAdvancedConditions(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    // Add multiple conditions with logical operators
    if (config.data.conditions.length === 1) {
      config.data.conditions.push({
        condition: `{{#secondary_variable#}} > 0.7`,
        logical_operator: 'and',
        comparison_operator: '>',
        variable: 'secondary_variable',
        value: 0.7
      })
    }

    // Ensure multiple cases for complex decision trees
    while (config.data.cases.length < 3) {
      config.data.cases.push({
        case_id: `complex_case_${config.data.cases.length + 1}`,
        conditions: [{
          variable_selector: [`condition_${config.data.cases.length + 1}`],
          comparison_operator: 'not empty',
          value: ''
        }],
        logical_operator: 'and'
      })
    }
  }

  /**
   * Add enterprise-level decision logic
   */
  private static addEnterpriseDecisionLogic(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    // Enterprise workflows need comprehensive condition evaluation
    config.data.conditions = [
      {
        condition: `{{#primary_metric#}} >= 0.8`,
        logical_operator: 'and',
        comparison_operator: '>=',
        variable: 'primary_metric',
        value: 0.8
      },
      {
        condition: `{{#secondary_metric#}} > 0.5`,
        logical_operator: 'or',
        comparison_operator: '>',
        variable: 'secondary_metric',
        value: 0.5
      },
      {
        condition: `{{#risk_score#}} < 0.3`,
        logical_operator: 'and',
        comparison_operator: '<',
        variable: 'risk_score',
        value: 0.3
      }
    ]

    // Multiple sophisticated cases
    config.data.cases = [
      {
        case_id: 'high_priority',
        conditions: [
          {
            variable_selector: ['priority_score'],
            comparison_operator: '>',
            value: 0.9
          },
          {
            variable_selector: ['urgency_flag'],
            comparison_operator: 'is',
            value: true
          }
        ],
        logical_operator: 'and'
      },
      {
        case_id: 'medium_priority',
        conditions: [{
          variable_selector: ['priority_score'],
          comparison_operator: '>=',
          value: 0.5
        }],
        logical_operator: 'and'
      },
      {
        case_id: 'low_priority',
        conditions: [{
          variable_selector: ['priority_score'],
          comparison_operator: '<',
          value: 0.5
        }],
        logical_operator: 'and'
      }
    ]
  }

  /**
   * Apply business logic specific conditions
   */
  private static applyBusinessLogicConditions(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    // Real-time processing requirements
    if (context.businessLogic.some(logic =>
      logic.includes('real-time') || logic.includes('instant'))) {
      this.addRealTimeConditions(config, context)
    }

    // Escalation logic requirements
    if (context.businessLogic.some(logic =>
      logic.includes('escalation') || logic.includes('priority'))) {
      this.addEscalationConditions(config, context)
    }

    // Validation requirements
    if (context.businessLogic.some(logic =>
      logic.includes('validation') || logic.includes('verification'))) {
      this.addValidationConditions(config, context)
    }

    // Quality control requirements
    if (context.businessLogic.some(logic =>
      logic.includes('quality') || logic.includes('scoring'))) {
      this.addQualityConditions(config, context)
    }
  }

  /**
   * Add real-time processing conditions
   */
  private static addRealTimeConditions(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    config.data.title = 'Real-time Processing Decision'
    config.data.conditions.unshift({
      condition: `{{#processing_time#}} < 1000`,
      logical_operator: 'and',
      comparison_operator: '<',
      variable: 'processing_time',
      value: 1000
    })
  }

  /**
   * Add escalation logic conditions
   */
  private static addEscalationConditions(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    config.data.conditions.push({
      condition: `{{#escalation_required#}} is true`,
      logical_operator: 'or',
      comparison_operator: 'is',
      variable: 'escalation_required',
      value: true
    })

    config.data.cases.unshift({
      case_id: 'escalate',
      conditions: [{
        variable_selector: ['escalation_required'],
        comparison_operator: 'is',
        value: true
      }],
      logical_operator: 'and'
    })
  }

  /**
   * Add validation conditions
   */
  private static addValidationConditions(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    config.data.conditions.push({
      condition: `{{#validation_passed#}} is true`,
      logical_operator: 'and',
      comparison_operator: 'is',
      variable: 'validation_passed',
      value: true
    })
  }

  /**
   * Add quality control conditions
   */
  private static addQualityConditions(
    config: IfElseNodeConfig,
    context: IfElseGenerationContext
  ): void {
    config.data.conditions.push({
      condition: `{{#quality_score#}} >= 0.7`,
      logical_operator: 'and',
      comparison_operator: '>=',
      variable: 'quality_score',
      value: 0.7
    })

    config.data.cases.push({
      case_id: 'quality_approved',
      conditions: [{
        variable_selector: ['quality_score'],
        comparison_operator: '>=',
        value: 0.7
      }],
      logical_operator: 'and'
    })
  }

  /**
   * Generate prompt fragment for IF/ELSE node
   */
  static generatePromptFragment(context: IfElseGenerationContext): string {
    return `
### IF/ELSE CONDITIONAL NODE SPECIFICATION

For ${context.workflowType} workflows with ${context.complexity} complexity:

**Node Configuration:**
- Type: if-else
- Title: "${this.generateTitle(context)}"
- Decision Logic: ${this.getDecisionLogicType(context)}
- Complexity Level: ${context.complexity}

**Conditional Logic:**
- Primary Conditions: ${this.getPrimaryConditions(context)}
- Logical Operators: ${this.getLogicalOperators(context)}
- Decision Cases: ${this.getDecisionCases(context)}

**Variable Flow:**
- Input: {{#${context.inputVariable || 'previous_node.output'}#}}
- Output Routing: Based on conditional evaluation

**Business Logic Integration:**
${context.businessLogic.map(logic => `- ${logic}`).join('\n')}

**Decision Points:**
${context.decisionPoints.map(point => `- ${point}`).join('\n')}

This node MUST implement enterprise-grade conditional logic for ${context.workflowType} decision trees.
`
  }

  // Helper methods for prompt generation
  private static getDecisionLogicType(context: IfElseGenerationContext): string {
    if (context.complexity === 'Enterprise') return 'Multi-layered decision tree'
    if (context.complexity === 'Complex') return 'Advanced conditional logic'
    if (context.complexity === 'Moderate') return 'Multi-condition evaluation'
    return 'Simple binary decision'
  }

  private static getPrimaryConditions(context: IfElseGenerationContext): string {
    const conditions = []
    if (context.workflowType === 'CUSTOMER_SERVICE') conditions.push('Sentiment analysis')
    if (context.workflowType === 'API_INTEGRATION') conditions.push('Response validation')
    if (context.workflowType === 'DATA_PROCESSING') conditions.push('Data quality')
    return conditions.join(', ') || 'Context-based evaluation'
  }

  private static getLogicalOperators(context: IfElseGenerationContext): string {
    if (context.complexity === 'Enterprise') return 'AND, OR, nested conditions'
    if (context.complexity === 'Complex') return 'AND, OR operators'
    return 'Simple AND logic'
  }

  private static getDecisionCases(context: IfElseGenerationContext): number {
    if (context.complexity === 'Enterprise') return 3
    if (context.complexity === 'Complex') return 3
    if (context.complexity === 'Moderate') return 2
    return 1
  }

  /**
   * Validate generated IF/ELSE node configuration
   */
  static validateConfiguration(config: IfElseNodeConfig): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Required field validation
    if (!config.data.title) errors.push('Title is required')
    if (!config.data.conditions || config.data.conditions.length === 0) {
      errors.push('At least one condition is required')
    }
    if (!config.data.cases || config.data.cases.length === 0) {
      errors.push('At least one case is required')
    }

    // Logical validation
    config.data.conditions.forEach((condition, index) => {
      if (!condition.condition) {
        errors.push(`Condition ${index + 1} is missing condition expression`)
      }
      if (!condition.comparison_operator) {
        warnings.push(`Condition ${index + 1} missing comparison operator`)
      }
    })

    // Case validation
    config.data.cases.forEach((case_item, index) => {
      if (!case_item.case_id) {
        errors.push(`Case ${index + 1} is missing case_id`)
      }
      if (!case_item.conditions || case_item.conditions.length === 0) {
        errors.push(`Case ${index + 1} has no conditions`)
      }
    })

    // Performance warnings
    if (config.data.conditions.length > 5) {
      warnings.push('Too many conditions may impact performance')
    }
    if (config.data.cases.length > 10) {
      warnings.push('Excessive cases may complicate workflow logic')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

export default IfElseGenerator