/**
 * Template Transform Node Generator
 *
 * This module generates intelligent template transformation nodes with
 * advanced Jinja2 templating, data formatting, and output optimization.
 */

import { RequirementAnalysis } from '../requirement-analyzer'
import { NODE_TYPES } from '@/constants/node-types'

export interface TemplateTransformNodeConfig {
  id: string
  type: typeof NODE_TYPES.TEMPLATE_TRANSFORM
  position: { x: number; y: number }
  data: {
    title: string
    template: string
    variables: Array<{
      variable_name: string
      variable_selector: string[]
    }>
    output: {
      variable: string
      type: 'text' | 'json' | 'xml' | 'html' | 'markdown'
    }
    advanced_settings?: {
      jinja2_variables?: Record<string, any>
      memory?: {
        enabled: boolean
        window_size?: number
      }
    }
  }
}

export interface TemplateTransformGenerationContext {
  workflowType: string
  complexity: string
  businessLogic: string[]
  integrationNeeds: string[]
  position: { x: number; y: number }
  nodeIndex: number
  inputVariable?: string
  outputVariable?: string
  outputFormat?: 'text' | 'json' | 'xml' | 'html' | 'markdown'
  templateRequirements: string[]
  dataTransformations: string[]
  localization?: string[]
}

/**
 * Advanced Template Transform Node Generator
 */
export class TemplateTransformGenerator {

  /**
   * Generate optimized Template Transform node based on context
   */
  static generateNode(context: TemplateTransformGenerationContext): TemplateTransformNodeConfig {
    const config = this.getBaseConfiguration(context)

    // Apply workflow-specific template optimizations
    this.applyWorkflowTemplates(config, context)

    // Apply complexity-based template enhancements
    this.applyComplexityTemplateEnhancements(config, context)

    // Apply business logic template requirements
    this.applyBusinessLogicTemplates(config, context)

    return config
  }

  /**
   * Get base configuration for Template Transform node
   */
  private static getBaseConfiguration(context: TemplateTransformGenerationContext): TemplateTransformNodeConfig {
    return {
      id: `template-transform-${context.nodeIndex}`,
      type: NODE_TYPES.TEMPLATE_TRANSFORM,
      position: context.position,
      data: {
        title: this.generateTitle(context),
        template: this.getBaseTemplate(context),
        variables: this.getBaseVariables(context),
        output: {
          variable: context.outputVariable || 'formatted_output',
          type: context.outputFormat || this.getOptimalOutputType(context)
        },
        advanced_settings: {
          jinja2_variables: {},
          memory: {
            enabled: false
          }
        }
      }
    }
  }

  /**
   * Generate contextual title for the template node
   */
  private static generateTitle(context: TemplateTransformGenerationContext): string {
    const titleMappings = {
      'CUSTOMER_SERVICE': 'Customer Response Formatter',
      'DOCUMENT_PROCESSING': 'Document Output Formatter',
      'CONTENT_GENERATION': 'Content Template Processor',
      'DATA_PROCESSING': 'Data Export Formatter',
      'API_INTEGRATION': 'API Response Formatter',
      'AUTOMATION': 'Process Output Formatter',
      'ANALYSIS': 'Analysis Report Generator'
    }

    const baseTitle = titleMappings[context.workflowType as keyof typeof titleMappings] || 'Data Transform'

    // Add specific formatting context if available
    if (context.templateRequirements.length > 0) {
      const primaryReq = context.templateRequirements[0]
      if (primaryReq.includes('email')) return 'Email Template Processor'
      if (primaryReq.includes('report')) return 'Report Template Generator'
      if (primaryReq.includes('notification')) return 'Notification Formatter'
      if (primaryReq.includes('summary')) return 'Summary Template Processor'
    }

    return baseTitle
  }

  /**
   * Get base template based on workflow type
   */
  private static getBaseTemplate(context: TemplateTransformGenerationContext): string {
    const workflowTemplates = {
      'CUSTOMER_SERVICE': this.getCustomerServiceTemplate(context),
      'DOCUMENT_PROCESSING': this.getDocumentProcessingTemplate(context),
      'CONTENT_GENERATION': this.getContentGenerationTemplate(context),
      'DATA_PROCESSING': this.getDataProcessingTemplate(context),
      'API_INTEGRATION': this.getAPIIntegrationTemplate(context),
      'AUTOMATION': this.getAutomationTemplate(context),
      'ANALYSIS': this.getAnalysisTemplate(context)
    }

    return workflowTemplates[context.workflowType as keyof typeof workflowTemplates] ||
           this.getGenericTemplate(context)
  }

  /**
   * Customer service template
   */
  private static getCustomerServiceTemplate(context: TemplateTransformGenerationContext): string {
    return `Dear {{customer_name or "Valued Customer"}},

Thank you for contacting us regarding your inquiry.

{% if sentiment_score and sentiment_score < 0.5 %}
We understand your concern and sincerely apologize for any inconvenience caused.
{% endif %}

**Your Inquiry:**
{{user_query}}

**Our Response:**
{{automated_response}}

{% if knowledge_response %}
**Additional Information:**
{{knowledge_response}}
{% endif %}

{% if quality_score and quality_score >= 0.8 %}
**Quality Assurance:** This response has been verified for accuracy.
{% endif %}

Best regards,
Customer Service Team

---
Reference ID: {{reference_id or "CS-" + timestamp}}
Response generated on: {{current_date}}`
  }

  /**
   * Document processing template
   */
  private static getDocumentProcessingTemplate(context: TemplateTransformGenerationContext): string {
    return `# Document Processing Report

**Document Details:**
- File Name: {{document_name}}
- Processing Date: {{processing_date}}
- Document Type: {{document_type or "Unknown"}}

**Extraction Results:**
{% if extracted_text %}
**Extracted Content:**
{{extracted_text}}
{% endif %}

{% if document_summary %}
**Summary:**
{{document_summary}}
{% endif %}

**Metadata:**
- Page Count: {{page_count or "N/A"}}
- Word Count: {{word_count or "N/A"}}
- Confidence Score: {{confidence_score or "N/A"}}

{% if validation_errors %}
**Validation Issues:**
{% for error in validation_errors %}
- {{error}}
{% endfor %}
{% endif %}

**Processing Status:** {% if confidence_score >= 0.8 %}✅ High Quality{% elif confidence_score >= 0.5 %}⚠️ Review Required{% else %}❌ Manual Review Needed{% endif %}`
  }

  /**
   * Content generation template
   */
  private static getContentGenerationTemplate(context: TemplateTransformGenerationContext): string {
    return `# {{content_title or "Generated Content"}}

{% if content_type == "article" %}
## Introduction
{{introduction_content}}

## Main Content
{{main_content}}

## Conclusion
{{conclusion_content}}
{% elif content_type == "summary" %}
**Summary:**
{{summary_content}}

**Key Points:**
{% for point in key_points %}
- {{point}}
{% endfor %}
{% else %}
{{generated_content}}
{% endif %}

---
**Metadata:**
- Generated on: {{generation_date}}
- Word Count: {{word_count}}
- Content Type: {{content_type}}
{% if quality_metrics %}
- Quality Score: {{quality_metrics.quality_score}}
{% endif %}`
  }

  /**
   * Data processing template
   */
  private static getDataProcessingTemplate(context: TemplateTransformGenerationContext): string {
    return `{
  "processing_result": {
    "status": "{% if processing_success %}success{% else %}failed{% endif %}",
    "timestamp": "{{processing_timestamp}}",
    "data": {
      {% if processed_data %}
      "processed_records": {{processed_records|tojson}},
      "record_count": {{record_count}},
      "processing_time": "{{processing_time}}ms"
      {% endif %}
    },
    {% if validation_results %}
    "validation": {
      "is_valid": {{validation_results.is_valid|tojson}},
      "errors": {{validation_results.errors|tojson}},
      "warnings": {{validation_results.warnings|tojson}}
    },
    {% endif %}
    "metadata": {
      "processor_version": "{{processor_version or '1.0.0'}}",
      "configuration": "{{processing_configuration or 'default'}}"
    }
  }
}`
  }

  /**
   * API integration template
   */
  private static getAPIIntegrationTemplate(context: TemplateTransformGenerationContext): string {
    return `{
  "api_response": {
    "status": {{status_code}},
    "success": {% if status_code == 200 %}true{% else %}false{% endif %},
    "timestamp": "{{response_timestamp}}",
    {% if status_code == 200 %}
    "data": {{response_data|tojson}},
    {% endif %}
    {% if error_message %}
    "error": {
      "message": "{{error_message}}",
      "code": "{{error_code}}",
      "details": "{{error_details}}"
    },
    {% endif %}
    "metadata": {
      "endpoint": "{{api_endpoint}}",
      "method": "{{http_method}}",
      "response_time": "{{response_time}}ms",
      "request_id": "{{request_id}}"
    }
  }
}`
  }

  /**
   * Automation template
   */
  private static getAutomationTemplate(context: TemplateTransformGenerationContext): string {
    return `# Automation Process Report

**Process:** {{process_name}}
**Execution Date:** {{execution_date}}
**Status:** {% if process_success %}✅ Completed Successfully{% else %}❌ Failed{% endif %}

## Execution Summary
- Start Time: {{start_time}}
- End Time: {{end_time}}
- Duration: {{execution_duration}}
- Steps Completed: {{completed_steps}}/{{total_steps}}

{% if process_results %}
## Results
{{process_results}}
{% endif %}

{% if error_details and not process_success %}
## Error Details
**Error:** {{error_details.message}}
**Location:** Step {{error_details.step_number}} - {{error_details.step_name}}
**Recommended Action:** {{error_details.recommendation}}
{% endif %}

## Next Actions
{% if next_actions %}
{% for action in next_actions %}
- {{action}}
{% endfor %}
{% else %}
- Process completed, no further actions required
{% endif %}`
  }

  /**
   * Analysis template
   */
  private static getAnalysisTemplate(context: TemplateTransformGenerationContext): string {
    return `# Analysis Report

**Analysis Type:** {{analysis_type}}
**Generated:** {{analysis_date}}
**Dataset:** {{dataset_name or "Unknown"}}

## Executive Summary
{{executive_summary}}

## Key Findings
{% for finding in key_findings %}
- **{{finding.category}}:** {{finding.description}}
  - Impact: {{finding.impact or "Medium"}}
  - Confidence: {{finding.confidence or "High"}}
{% endfor %}

## Detailed Analysis
{{detailed_analysis}}

{% if recommendations %}
## Recommendations
{% for recommendation in recommendations %}
### {{recommendation.priority or "Medium"}} Priority: {{recommendation.title}}
{{recommendation.description}}

**Expected Outcome:** {{recommendation.expected_outcome}}
**Timeline:** {{recommendation.timeline}}
{% endfor %}
{% endif %}

## Methodology
- Analysis Engine: {{analysis_engine or "Standard"}}
- Data Points: {{data_point_count}}
- Confidence Level: {{overall_confidence or "85%"}}

---
*This report was automatically generated by the AI Analysis System*`
  }

  /**
   * Generic template fallback
   */
  private static getGenericTemplate(context: TemplateTransformGenerationContext): string {
    return `# {{title or "Data Output"}}

**Generated:** {{current_timestamp}}
**Source:** {{source_node or "Previous Step"}}

## Content
{{main_content or input_data}}

{% if metadata %}
## Metadata
{% for key, value in metadata.items() %}
- **{{key}}:** {{value}}
{% endfor %}
{% endif %}

---
*Generated by DSL Maker Template Transform*`
  }

  /**
   * Get base variables for the template
   */
  private static getBaseVariables(context: TemplateTransformGenerationContext): Array<any> {
    const inputVar = context.inputVariable || 'previous_node.output'

    return [
      {
        variable_name: 'input_data',
        variable_selector: [inputVar]
      },
      {
        variable_name: 'current_timestamp',
        variable_selector: ['sys.current_time']
      }
    ]
  }

  /**
   * Get optimal output type based on context
   */
  private static getOptimalOutputType(context: TemplateTransformGenerationContext): 'text' | 'json' | 'xml' | 'html' | 'markdown' {
    // Output type optimization based on workflow
    const typeMapping = {
      'CUSTOMER_SERVICE': 'text',
      'DOCUMENT_PROCESSING': 'markdown',
      'CONTENT_GENERATION': 'markdown',
      'DATA_PROCESSING': 'json',
      'API_INTEGRATION': 'json',
      'AUTOMATION': 'markdown',
      'ANALYSIS': 'markdown'
    } as const

    return typeMapping[context.workflowType as keyof typeof typeMapping] || 'text'
  }

  /**
   * Apply workflow-specific template optimizations
   */
  private static applyWorkflowTemplates(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    // Add workflow-specific variables
    switch (context.workflowType) {
      case 'CUSTOMER_SERVICE':
        this.addCustomerServiceVariables(config, context)
        break

      case 'DOCUMENT_PROCESSING':
        this.addDocumentProcessingVariables(config, context)
        break

      case 'CONTENT_GENERATION':
        this.addContentGenerationVariables(config, context)
        break

      case 'API_INTEGRATION':
        this.addAPIIntegrationVariables(config, context)
        break

      case 'DATA_PROCESSING':
        this.addDataProcessingVariables(config, context)
        break

      default:
        this.addGenericVariables(config, context)
        break
    }
  }

  /**
   * Add customer service specific variables
   */
  private static addCustomerServiceVariables(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    const additionalVariables = [
      { variable_name: 'customer_name', variable_selector: ['customer_context.name'] },
      { variable_name: 'user_query', variable_selector: ['start_node.user_query'] },
      { variable_name: 'sentiment_score', variable_selector: ['sentiment_analysis.sentiment_score'] },
      { variable_name: 'automated_response', variable_selector: ['automated_response.response'] },
      { variable_name: 'quality_score', variable_selector: ['quality_scoring.quality_score'] },
      { variable_name: 'knowledge_response', variable_selector: ['knowledge_retrieval.knowledge_response'] }
    ]

    config.data.variables.push(...additionalVariables)
  }

  /**
   * Add document processing specific variables
   */
  private static addDocumentProcessingVariables(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    const additionalVariables = [
      { variable_name: 'document_name', variable_selector: ['document_input.filename'] },
      { variable_name: 'extracted_text', variable_selector: ['document_extractor.text'] },
      { variable_name: 'document_summary', variable_selector: ['document_analyzer.summary'] },
      { variable_name: 'confidence_score', variable_selector: ['document_analyzer.confidence'] },
      { variable_name: 'page_count', variable_selector: ['document_extractor.page_count'] },
      { variable_name: 'word_count', variable_selector: ['document_analyzer.word_count'] }
    ]

    config.data.variables.push(...additionalVariables)
  }

  /**
   * Add content generation specific variables
   */
  private static addContentGenerationVariables(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    const additionalVariables = [
      { variable_name: 'content_title', variable_selector: ['content_generator.title'] },
      { variable_name: 'generated_content', variable_selector: ['content_generator.content'] },
      { variable_name: 'content_type', variable_selector: ['content_analyzer.type'] },
      { variable_name: 'word_count', variable_selector: ['content_analyzer.word_count'] },
      { variable_name: 'key_points', variable_selector: ['content_analyzer.key_points'] },
      { variable_name: 'quality_metrics', variable_selector: ['quality_assessor.metrics'] }
    ]

    config.data.variables.push(...additionalVariables)
  }

  /**
   * Add API integration specific variables
   */
  private static addAPIIntegrationVariables(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    const additionalVariables = [
      { variable_name: 'status_code', variable_selector: ['api_request.status_code'] },
      { variable_name: 'response_data', variable_selector: ['api_request.data'] },
      { variable_name: 'error_message', variable_selector: ['api_request.error'] },
      { variable_name: 'response_time', variable_selector: ['api_request.response_time'] },
      { variable_name: 'api_endpoint', variable_selector: ['api_request.endpoint'] },
      { variable_name: 'request_id', variable_selector: ['api_request.request_id'] }
    ]

    config.data.variables.push(...additionalVariables)
  }

  /**
   * Add data processing specific variables
   */
  private static addDataProcessingVariables(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    const additionalVariables = [
      { variable_name: 'processed_data', variable_selector: ['data_processor.output'] },
      { variable_name: 'record_count', variable_selector: ['data_processor.count'] },
      { variable_name: 'processing_success', variable_selector: ['data_processor.success'] },
      { variable_name: 'validation_results', variable_selector: ['data_validator.results'] },
      { variable_name: 'processing_time', variable_selector: ['data_processor.execution_time'] }
    ]

    config.data.variables.push(...additionalVariables)
  }

  /**
   * Add generic variables for unknown workflow types
   */
  private static addGenericVariables(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    const additionalVariables = [
      { variable_name: 'process_result', variable_selector: ['previous_node.result'] },
      { variable_name: 'metadata', variable_selector: ['previous_node.metadata'] },
      { variable_name: 'status', variable_selector: ['previous_node.status'] }
    ]

    config.data.variables.push(...additionalVariables)
  }

  /**
   * Apply complexity-based template enhancements
   */
  private static applyComplexityTemplateEnhancements(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    switch (context.complexity) {
      case 'Simple':
        // Basic template with minimal variables
        this.simplifyTemplate(config, context)
        break

      case 'Moderate':
        // Enhanced template with conditional logic
        this.enhanceTemplateWithConditions(config, context)
        break

      case 'Complex':
        // Advanced template with loops and complex logic
        this.addAdvancedTemplateFeatures(config, context)
        break

      case 'Enterprise':
        // Full-featured template with memory and advanced Jinja2
        this.addEnterpriseTemplateFeatures(config, context)
        break
    }
  }

  /**
   * Simplify template for simple workflows
   */
  private static simplifyTemplate(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    // Keep only essential variables
    config.data.variables = config.data.variables.slice(0, 3)

    // Simplify template
    config.data.template = `{{title or "Result"}}

{{input_data}}

Generated: {{current_timestamp}}`
  }

  /**
   * Enhance template with conditional logic
   */
  private static enhanceTemplateWithConditions(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    // Enable memory for moderate complexity
    if (config.data.advanced_settings) {
      config.data.advanced_settings.memory = {
        enabled: true,
        window_size: 5
      }
    }
  }

  /**
   * Add advanced template features for complex workflows
   */
  private static addAdvancedTemplateFeatures(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    // Add Jinja2 variables for advanced processing
    if (config.data.advanced_settings) {
      config.data.advanced_settings.jinja2_variables = {
        'current_date': '{{ now().strftime("%Y-%m-%d") }}',
        'current_time': '{{ now().strftime("%H:%M:%S") }}',
        'uuid': '{{ range(10000000, 99999999) | random }}'
      }

      config.data.advanced_settings.memory = {
        enabled: true,
        window_size: 10
      }
    }
  }

  /**
   * Add enterprise-level template features
   */
  private static addEnterpriseTemplateFeatures(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    // Full enterprise configuration
    if (config.data.advanced_settings) {
      config.data.advanced_settings.jinja2_variables = {
        'current_date': '{{ now().strftime("%Y-%m-%d") }}',
        'current_time': '{{ now().strftime("%H:%M:%S") }}',
        'uuid': '{{ range(10000000, 99999999) | random }}',
        'environment': '{{ env.ENVIRONMENT or "production" }}',
        'version': '{{ env.APP_VERSION or "1.0.0" }}',
        'user_agent': '{{ env.USER_AGENT or "DSL-Maker/1.0" }}'
      }

      config.data.advanced_settings.memory = {
        enabled: true,
        window_size: 20
      }
    }

    // Add enterprise-specific variables
    const enterpriseVariables = [
      { variable_name: 'trace_id', variable_selector: ['sys.trace_id'] },
      { variable_name: 'user_context', variable_selector: ['sys.user_context'] },
      { variable_name: 'security_context', variable_selector: ['sys.security_context'] }
    ]

    config.data.variables.push(...enterpriseVariables)
  }

  /**
   * Apply business logic template requirements
   */
  private static applyBusinessLogicTemplates(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    // Localization requirements
    if (context.businessLogic.some(logic =>
      logic.includes('localization') || logic.includes('multi-language'))) {
      this.addLocalizationFeatures(config, context)
    }

    // Real-time formatting requirements
    if (context.businessLogic.some(logic =>
      logic.includes('real-time') || logic.includes('instant'))) {
      this.optimizeForRealTime(config, context)
    }

    // Security requirements
    if (context.businessLogic.some(logic =>
      logic.includes('security') || logic.includes('sensitive'))) {
      this.addSecurityFeatures(config, context)
    }

    // Audit trail requirements
    if (context.businessLogic.some(logic =>
      logic.includes('audit') || logic.includes('tracking'))) {
      this.addAuditFeatures(config, context)
    }
  }

  /**
   * Add localization features
   */
  private static addLocalizationFeatures(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    const localizationVariables = [
      { variable_name: 'user_language', variable_selector: ['user_context.language'] },
      { variable_name: 'timezone', variable_selector: ['user_context.timezone'] },
      { variable_name: 'locale', variable_selector: ['user_context.locale'] }
    ]

    config.data.variables.push(...localizationVariables)

    // Add localization to Jinja2 variables
    if (config.data.advanced_settings) {
      config.data.advanced_settings.jinja2_variables = {
        ...config.data.advanced_settings.jinja2_variables,
        'localized_date': '{{ now().strftime("%x") }}',
        'localized_time': '{{ now().strftime("%X") }}'
      }
    }
  }

  /**
   * Optimize template for real-time processing
   */
  private static optimizeForRealTime(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    // Disable memory for real-time performance
    if (config.data.advanced_settings) {
      config.data.advanced_settings.memory = {
        enabled: false
      }
    }

    // Simplify template for speed
    if (config.data.template.length > 1000) {
      config.data.template = config.data.template.substring(0, 500) + '...\n\n---\n*Optimized for real-time processing*'
    }
  }

  /**
   * Add security features
   */
  private static addSecurityFeatures(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    const securityVariables = [
      { variable_name: 'user_id_hash', variable_selector: ['security.user_id_hash'] },
      { variable_name: 'access_level', variable_selector: ['security.access_level'] },
      { variable_name: 'session_id', variable_selector: ['security.session_id'] }
    ]

    config.data.variables.push(...securityVariables)
  }

  /**
   * Add audit trail features
   */
  private static addAuditFeatures(
    config: TemplateTransformNodeConfig,
    context: TemplateTransformGenerationContext
  ): void {
    const auditVariables = [
      { variable_name: 'audit_id', variable_selector: ['audit.audit_id'] },
      { variable_name: 'workflow_id', variable_selector: ['audit.workflow_id'] },
      { variable_name: 'execution_context', variable_selector: ['audit.execution_context'] }
    ]

    config.data.variables.push(...auditVariables)

    // Add audit information to template
    config.data.template += `

---
**Audit Information:**
- Audit ID: {{audit_id}}
- Workflow ID: {{workflow_id}}
- Execution Context: {{execution_context}}
- Generated: {{current_timestamp}}`
  }

  /**
   * Generate prompt fragment for Template Transform node
   */
  static generatePromptFragment(context: TemplateTransformGenerationContext): string {
    return `
### TEMPLATE TRANSFORM NODE SPECIFICATION

For ${context.workflowType} workflows with ${context.complexity} complexity:

**Node Configuration:**
- Type: template-transform
- Title: "${this.generateTitle(context)}"
- Output Format: ${context.outputFormat || this.getOptimalOutputType(context)}
- Template Engine: Jinja2

**Template Features:**
- Dynamic Content: ${this.getTemplateComplexity(context)}
- Variable Count: ${this.getVariableCount(context)}
- Conditional Logic: ${this.hasConditionalLogic(context) ? 'Enabled' : 'Disabled'}
- Memory Usage: ${this.getMemoryUsage(context)}

**Variable Flow:**
- Input: {{#${context.inputVariable || 'previous_node.output'}#}}
- Output Variable: "${context.outputVariable || 'formatted_output'}"

**Business Logic Integration:**
${context.businessLogic.map(logic => `- ${logic}`).join('\n')}

**Template Requirements:**
${context.templateRequirements.map(req => `- ${req}`).join('\n')}

This node MUST implement enterprise-grade template processing for ${context.workflowType} output formatting.
`
  }

  // Helper methods for prompt generation
  private static getTemplateComplexity(context: TemplateTransformGenerationContext): string {
    if (context.complexity === 'Enterprise') return 'Advanced with loops, conditions, and functions'
    if (context.complexity === 'Complex') return 'Multi-conditional with advanced features'
    if (context.complexity === 'Moderate') return 'Conditional formatting with variables'
    return 'Basic variable substitution'
  }

  private static getVariableCount(context: TemplateTransformGenerationContext): number {
    const baseCount = 2
    const complexityMultiplier = {
      'Simple': 1,
      'Moderate': 2,
      'Complex': 3,
      'Enterprise': 4
    }
    return baseCount * (complexityMultiplier[context.complexity as keyof typeof complexityMultiplier] || 1)
  }

  private static hasConditionalLogic(context: TemplateTransformGenerationContext): boolean {
    return context.complexity !== 'Simple'
  }

  private static getMemoryUsage(context: TemplateTransformGenerationContext): string {
    if (context.complexity === 'Enterprise') return 'High (20 variables)'
    if (context.complexity === 'Complex') return 'Medium (10 variables)'
    if (context.complexity === 'Moderate') return 'Low (5 variables)'
    return 'Disabled'
  }

  /**
   * Validate generated Template Transform node configuration
   */
  static validateConfiguration(config: TemplateTransformNodeConfig): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Required field validation
    if (!config.data.title) errors.push('Title is required')
    if (!config.data.template) errors.push('Template is required')
    if (!config.data.output.variable) errors.push('Output variable is required')
    if (!config.data.variables || config.data.variables.length === 0) {
      errors.push('At least one variable is required')
    }

    // Template validation
    if (config.data.template.length < 10) {
      warnings.push('Template appears to be too simple')
    }
    if (config.data.template.length > 5000) {
      warnings.push('Template is very large and may impact performance')
    }

    // Variable validation
    config.data.variables.forEach((variable, index) => {
      if (!variable.variable_name) {
        errors.push(`Variable ${index + 1} is missing variable_name`)
      }
      if (!variable.variable_selector || variable.variable_selector.length === 0) {
        errors.push(`Variable ${index + 1} is missing variable_selector`)
      }
    })

    // Jinja2 template syntax check (basic)
    if (config.data.template.includes('{{') && !config.data.template.includes('}}')) {
      errors.push('Template appears to have malformed Jinja2 syntax')
    }

    // Performance warnings
    if (config.data.variables.length > 20) {
      warnings.push('High number of variables may impact template rendering performance')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

export default TemplateTransformGenerator