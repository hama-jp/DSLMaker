/**
 * DSL Compliance Validation System
 *
 * Comprehensive validation of DSL generation quality against Dify specification
 * Target: 85% compliance rate with enhanced node generator integration
 */

const fs = require('fs')
const path = require('path')

// Load .env file
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}

    envContent.split('\n').forEach(line => {
      line = line.trim()
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=')
        }
      }
    })

    return envVars
  } catch (error) {
    console.log('Warning: Could not load .env file:', error.message)
    return {}
  }
}

class DSLComplianceValidator {
  constructor() {
    const envVars = loadEnvFile()

    this.settings = {
      provider: 'openai',
      baseUrl: envVars.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: envVars.OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      apiKey: envVars.OPENAI_API_KEY || process.env.OPENAI_API_KEY || 'test-key',
      temperature: 0.1,
      maxTokens: 8000
    }

    console.log(`🔧 Using model: ${this.settings.model}`)
    console.log(`🔧 Using base URL: ${this.settings.baseUrl}`)

    this.validationResults = []
    this.complianceMetrics = {
      jsonParsing: { total: 0, passed: 0 },
      structureCompliance: { total: 0, passed: 0 },
      nodeTypeCompliance: { total: 0, passed: 0 },
      variableFlowCompliance: { total: 0, passed: 0 },
      businessLogicCompliance: { total: 0, passed: 0 },
      performanceCompliance: { total: 0, passed: 0 }
    }
  }

  // gpt-oss-120b optimized expert prompt with explicit examples
  getEnhancedExpertPrompt() {
    return `You are an expert Dify Workflow DSL architect. Generate ONLY valid JSON workflows.

## CRITICAL REQUIREMENTS FOR SUCCESS

### 1. JSON FORMAT - MANDATORY
Return ONLY valid JSON. NO markdown, NO YAML, NO explanations.

EXACT STRUCTURE REQUIRED:
{
  "app": {
    "description": "...",
    "icon": "🤖",
    "icon_background": "#6366f1",
    "mode": "workflow",
    "name": "..."
  },
  "kind": "app",
  "version": "0.1.5",
  "workflow": {
    "environment_variables": [],
    "features": {
      "file_upload": { "enabled": true, "number_limits": 5, "max_size_mb": 20 },
      "retriever_resource": { "enabled": true }
    },
    "graph": {
      "edges": [...],
      "nodes": [...],
      "viewport": { "x": 0, "y": 0, "zoom": 1 }
    }
  }
}

### 2. VARIABLE FLOW - CRITICAL SUCCESS FACTOR

EVERY node MUST reference previous nodes using EXACT syntax: {{#node_id.output_variable#}}

MANDATORY VARIABLE FLOW PATTERN:
- start_node → parameter_extractor: {{#start_node.user_query#}}
- parameter_extractor → knowledge_retrieval: {{#parameter_extractor.extracted_query#}}
- knowledge_retrieval → llm_node: {{#knowledge_retrieval.result#}}
- llm_node → if_else_node: {{#llm_node.text#}}
- if_else_node → template_transform: {{#llm_node.text#}}
- template_transform → end_node: {{#template_transform.output#}}

EXAMPLE VARIABLE REFERENCE IN LLM NODE:
{
  "id": "llm_node",
  "type": "llm",
  "data": {
    "prompt": "Process this input: {{#knowledge_retrieval.result#}}",
    "model": { "provider": "openai", "name": "gpt-3.5-turbo" }
  }
}

EXAMPLE VARIABLE REFERENCE IN IF-ELSE:
{
  "id": "if_else_node",
  "type": "if-else",
  "data": {
    "conditions": [{
      "variable_selector": ["llm_node", "text"],
      "comparison_operator": "not empty",
      "value": ""
    }]
  }
}

### 3. REQUIRED NODE TYPES - MANDATORY 7 NODES
MUST include ALL these types:
1. start: Input handling with variables
2. parameter-extractor: Extract structured data
3. knowledge-retrieval: RAG with hybrid search
4. llm: AI processing with proper prompts
5. if-else: Conditional logic with proper conditions
6. template-transform: Output formatting
7. end: Final result collection

### 4. EXACT NODE CONFIGURATIONS

START NODE TEMPLATE:
{
  "id": "start_node",
  "type": "start",
  "position": { "x": 100, "y": 200 },
  "data": {
    "title": "Start",
    "inputs": {
      "user_query": { "type": "string", "required": true },
      "context": { "type": "string", "required": false }
    }
  }
}

PARAMETER EXTRACTOR TEMPLATE:
{
  "id": "parameter_extractor",
  "type": "parameter-extractor",
  "position": { "x": 350, "y": 200 },
  "data": {
    "title": "Extract Parameters",
    "parameters": [
      {
        "name": "extracted_query",
        "description": "User query",
        "type": "string",
        "required": true
      }
    ],
    "instruction": "Extract the main query from: {{#start_node.user_query#}}"
  }
}

KNOWLEDGE RETRIEVAL TEMPLATE:
{
  "id": "knowledge_retrieval",
  "type": "knowledge-retrieval",
  "position": { "x": 600, "y": 200 },
  "data": {
    "title": "Knowledge Search",
    "dataset_ids": ["default"],
    "retrieval_mode": "hybrid",
    "reranking_enable": true,
    "top_k": 5,
    "score_threshold": 0.6,
    "query": "{{#parameter_extractor.extracted_query#}}"
  }
}

LLM NODE TEMPLATE:
{
  "id": "llm_node",
  "type": "llm",
  "position": { "x": 850, "y": 200 },
  "data": {
    "title": "AI Processing",
    "model": {
      "provider": "openai",
      "name": "gpt-3.5-turbo",
      "mode": "chat",
      "completion_params": { "temperature": 0.7 }
    },
    "prompt_template": [{
      "role": "user",
      "text": "Based on this context: {{#knowledge_retrieval.result#}}, provide a response"
    }]
  }
}

IF-ELSE NODE TEMPLATE:
{
  "id": "if_else_node",
  "type": "if-else",
  "position": { "x": 1100, "y": 200 },
  "data": {
    "title": "Quality Check",
    "conditions": [{
      "variable_selector": ["llm_node", "text"],
      "comparison_operator": "not empty",
      "value": ""
    }],
    "logical_operator": "and"
  }
}

TEMPLATE TRANSFORM TEMPLATE:
{
  "id": "template_transform",
  "type": "template-transform",
  "position": { "x": 1350, "y": 200 },
  "data": {
    "title": "Format Output",
    "template": "Result: {{#llm_node.text#}}\\n\\nContext: {{#knowledge_retrieval.result#}}",
    "variables": [
      { "value_selector": ["llm_node", "text"], "variable": "response" },
      { "value_selector": ["knowledge_retrieval", "result"], "variable": "context" }
    ]
  }
}

END NODE TEMPLATE:
{
  "id": "end_node",
  "type": "end",
  "position": { "x": 1600, "y": 200 },
  "data": {
    "title": "End",
    "outputs": {
      "final_result": { "type": "string", "value": "{{#template_transform.output#}}" }
    }
  }
}

### 5. EDGE CONNECTIONS - EXACT FORMAT
{
  "edges": [
    { "source": "start_node", "target": "parameter_extractor" },
    { "source": "parameter_extractor", "target": "knowledge_retrieval" },
    { "source": "knowledge_retrieval", "target": "llm_node" },
    { "source": "llm_node", "target": "if_else_node" },
    { "source": "if_else_node", "target": "template_transform" },
    { "source": "template_transform", "target": "end_node" }
  ]
}

### 6. VALIDATION CHECKLIST - VERIFY BEFORE OUTPUT
✅ JSON syntax is valid
✅ All 7 required node types included
✅ Every node has proper variable references {{#node_id.field#}}
✅ All edge source/target IDs match node IDs
✅ Positioning follows formula: x: 100 + (index * 250)
✅ No missing commas or brackets
✅ All strings properly quoted

GENERATE EXACTLY THIS STRUCTURE. NO DEVIATIONS.`
  }

  // Enhanced workflow request with Phase 1.2 node generator integration
  createAdvancedWorkflowRequest(userInput, testIndex) {
    const contexts = [
      {
        workflowType: 'CUSTOMER_SERVICE',
        complexity: 'Complex',
        businessLogic: ['Escalation handling', 'Quality scoring', 'Real-time processing'],
        integrationNeeds: ['Knowledge base', 'CRM integration'],
        expectedNodes: ['start', 'parameter-extractor', 'if-else', 'sentiment-analysis', 'knowledge-retrieval', 'template-transform', 'llm', 'end']
      },
      {
        workflowType: 'DOCUMENT_PROCESSING',
        complexity: 'Enterprise',
        businessLogic: ['Document validation', 'Content extraction', 'Quality assessment'],
        integrationNeeds: ['Document storage', 'OCR services'],
        expectedNodes: ['start', 'document-extractor', 'if-else', 'llm', 'knowledge-retrieval', 'template-transform', 'end']
      },
      {
        workflowType: 'API_INTEGRATION',
        complexity: 'Moderate',
        businessLogic: ['Authentication', 'Error handling', 'Data transformation'],
        integrationNeeds: ['External APIs', 'Authentication services'],
        expectedNodes: ['start', 'http-request', 'if-else', 'parameter-extractor', 'template-transform', 'end']
      },
      {
        workflowType: 'CONTENT_GENERATION',
        complexity: 'Complex',
        businessLogic: ['Content validation', 'SEO optimization', 'Multi-format output'],
        integrationNeeds: ['Content management', 'Publishing platforms'],
        expectedNodes: ['start', 'llm', 'knowledge-retrieval', 'if-else', 'template-transform', 'end']
      },
      {
        workflowType: 'DATA_PROCESSING',
        complexity: 'Enterprise',
        businessLogic: ['Data validation', 'Batch processing', 'Quality control'],
        integrationNeeds: ['Data sources', 'Analytics platforms'],
        expectedNodes: ['start', 'parameter-extractor', 'if-else', 'code', 'template-transform', 'end']
      }
    ]

    const context = contexts[testIndex % contexts.length]

    return `
## ADVANCED WORKFLOW GENERATION REQUEST

### Primary Requirement
${userInput}

### Enhanced Analysis Summary
- **Business Intent**: ${context.workflowType} automation
- **Workflow Type**: ${context.workflowType}
- **Complexity Level**: ${context.complexity}
- **Recommended Pattern**: ENTERPRISE_MULTI_STAGE_ANALYSIS
- **Expected Node Count**: ${context.expectedNodes.length}

### Technical Specifications

#### Data Input Requirements
- **Primary Input**: User query/data [Required]
- **Context Data**: Business context data [Optional]
- **Configuration**: Workflow-specific parameters [Optional]

#### Expected Outputs
- Processed result with business logic compliance
- Quality metrics and validation results
- Formatted output in appropriate format

#### Business Logic Requirements
${context.businessLogic.map(logic => `- ${logic}`).join('\n')}

#### Integration Requirements
${context.integrationNeeds.map(need => `- ${need}`).join('\n')}

#### Expected Node Types
${context.expectedNodes.map(node => `- ${node}`).join('\n')}

#### Generation Instructions

Please generate a complete Dify workflow DSL that:

1. **Implements the ENTERPRISE_MULTI_STAGE_ANALYSIS pattern** with ${context.expectedNodes.length}+ nodes
2. **Uses the new Phase 1.2 node generators** with advanced configurations:
   - Knowledge Retrieval nodes with hybrid search and reranking
   - IF/ELSE nodes with multi-condition business logic
   - Template Transform nodes with advanced Jinja2 templates
3. **Addresses all specified business logic requirements** with appropriate node configurations
4. **Implements comprehensive error handling** with fallback strategies
5. **Uses enterprise-grade variable flow** and data transformation patterns
6. **Includes proper positioning** following the layout formula

Return a complete, valid JSON DSL file following the exact Dify specification structure with enterprise-grade quality.
`
  }

  // Real LLM API call
  async callLLMAPI(prompt) {
    const response = await fetch(`${this.settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages: [
          {
            role: 'system',
            content: this.getEnhancedExpertPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.settings.temperature,
        max_tokens: this.settings.maxTokens
      })
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    }
  }

  // Comprehensive validation of generated workflow
  async validateWorkflow(userInput, testIndex) {
    console.log(`\\n🔍 DSL Compliance Test ${testIndex + 1}`)
    console.log(`📋 Input: ${userInput.substring(0, 60)}...`)

    try {
      const workflowRequest = this.createAdvancedWorkflowRequest(userInput, testIndex)
      const response = await this.callLLMAPI(workflowRequest)

      // Extract JSON content
      let jsonContent = response.content.trim()
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\\n/, '').replace(/\\n```$/, '')
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\\n/, '').replace(/\\n```$/, '')
      }

      // Validation 1: JSON Parsing
      const jsonResult = await this.validateJSONParsing(jsonContent)

      if (!jsonResult.success) {
        return this.recordValidationResult(testIndex, false, 'JSON parsing failed', jsonResult.error)
      }

      const workflowData = jsonResult.data

      // Validation 2: Structure Compliance
      const structureResult = await this.validateStructureCompliance(workflowData)

      // Validation 3: Node Type Compliance
      const nodeTypeResult = await this.validateNodeTypeCompliance(workflowData, testIndex)

      // Validation 4: Variable Flow Compliance
      const variableFlowResult = await this.validateVariableFlowCompliance(workflowData)

      // Validation 5: Business Logic Compliance
      const businessLogicResult = await this.validateBusinessLogicCompliance(workflowData, testIndex)

      // Validation 6: Performance Compliance
      const performanceResult = await this.validatePerformanceCompliance(workflowData)

      // Calculate overall compliance score
      const totalChecks = 6
      const passedChecks = [
        jsonResult.success,
        structureResult.success,
        nodeTypeResult.success,
        variableFlowResult.success,
        businessLogicResult.success,
        performanceResult.success
      ].filter(Boolean).length

      const complianceScore = (passedChecks / totalChecks) * 100

      console.log(`📊 Compliance Score: ${complianceScore.toFixed(1)}%`)
      console.log(`✅ Passed: ${passedChecks}/${totalChecks} validation checks`)

      // Save successful workflow for analysis
      if (complianceScore >= 85) {
        fs.writeFileSync(`compliant-workflow-${Date.now()}.json`, JSON.stringify(workflowData, null, 2))
      }

      return this.recordValidationResult(testIndex, complianceScore >= 85, 'Validation completed', null, {
        complianceScore,
        passedChecks,
        totalChecks,
        details: {
          jsonParsing: jsonResult.success,
          structureCompliance: structureResult.success,
          nodeTypeCompliance: nodeTypeResult.success,
          variableFlowCompliance: variableFlowResult.success,
          businessLogicCompliance: businessLogicResult.success,
          performanceCompliance: performanceResult.success
        }
      })

    } catch (error) {
      console.log(`❌ Test ${testIndex + 1} failed: ${error.message}`)
      return this.recordValidationResult(testIndex, false, 'Test execution failed', error.message)
    }
  }

  // JSON parsing validation
  async validateJSONParsing(jsonContent) {
    this.complianceMetrics.jsonParsing.total++

    try {
      const parsed = JSON.parse(jsonContent)
      this.complianceMetrics.jsonParsing.passed++
      console.log(`  ✅ JSON Parsing: SUCCESS`)
      return { success: true, data: parsed }
    } catch (error) {
      console.log(`  ❌ JSON Parsing: FAILED - ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  // Structure compliance validation
  async validateStructureCompliance(workflowData) {
    this.complianceMetrics.structureCompliance.total++

    const requiredFields = [
      'app',
      'app.name',
      'app.description',
      'app.mode',
      'kind',
      'version',
      'workflow',
      'workflow.graph',
      'workflow.graph.nodes',
      'workflow.graph.edges'
    ]

    const missingFields = []

    for (const field of requiredFields) {
      const fieldParts = field.split('.')
      let current = workflowData

      for (const part of fieldParts) {
        if (!current || !current.hasOwnProperty(part)) {
          missingFields.push(field)
          break
        }
        current = current[part]
      }
    }

    if (missingFields.length === 0) {
      this.complianceMetrics.structureCompliance.passed++
      console.log(`  ✅ Structure Compliance: SUCCESS`)
      return { success: true }
    } else {
      console.log(`  ❌ Structure Compliance: FAILED - Missing: ${missingFields.join(', ')}`)
      return { success: false, missingFields }
    }
  }

  // Node type compliance validation
  async validateNodeTypeCompliance(workflowData, testIndex) {
    this.complianceMetrics.nodeTypeCompliance.total++

    const nodes = workflowData.workflow?.graph?.nodes || []
    const nodeTypes = nodes.map(node => node.type)
    const uniqueNodeTypes = [...new Set(nodeTypes)]

    // Expected node types based on complexity
    const minRequiredTypes = ['start', 'end', 'llm']
    const advancedTypes = ['parameter-extractor', 'if-else', 'knowledge-retrieval', 'template-transform']

    const hasAllRequired = minRequiredTypes.every(type => uniqueNodeTypes.includes(type))
    const advancedTypeCount = advancedTypes.filter(type => uniqueNodeTypes.includes(type)).length

    // Compliance criteria
    const minNodes = 6
    const minAdvancedTypes = 2

    const hasMinNodes = nodes.length >= minNodes
    const hasAdvancedTypes = advancedTypeCount >= minAdvancedTypes

    if (hasAllRequired && hasMinNodes && hasAdvancedTypes) {
      this.complianceMetrics.nodeTypeCompliance.passed++
      console.log(`  ✅ Node Type Compliance: SUCCESS (${nodes.length} nodes, ${uniqueNodeTypes.length} types)`)
      return { success: true }
    } else {
      const issues = []
      if (!hasAllRequired) issues.push('Missing required node types')
      if (!hasMinNodes) issues.push(`Insufficient nodes (${nodes.length}/${minNodes})`)
      if (!hasAdvancedTypes) issues.push(`Insufficient advanced types (${advancedTypeCount}/${minAdvancedTypes})`)

      console.log(`  ❌ Node Type Compliance: FAILED - ${issues.join(', ')}`)
      return { success: false, issues }
    }
  }

  // Variable flow compliance validation
  async validateVariableFlowCompliance(workflowData) {
    this.complianceMetrics.variableFlowCompliance.total++

    const nodes = workflowData.workflow?.graph?.nodes || []
    const edges = workflowData.workflow?.graph?.edges || []

    // Check node ID consistency
    const nodeIds = nodes.map(n => n.id)
    const edgeNodes = [...new Set([...edges.map(e => e.source), ...edges.map(e => e.target)])]

    const invalidEdges = edgeNodes.filter(nodeId => !nodeIds.includes(nodeId))

    // Check for variable references (basic check)
    let hasValidVariableFlow = true

    for (const node of nodes) {
      if (node.type === 'llm' || node.type === 'template-transform') {
        // Check if node has input references
        const nodeString = JSON.stringify(node)
        const hasVariableReference = nodeString.includes('{{#') && nodeString.includes('#}}')

        if (!hasVariableReference && node.type !== 'start') {
          hasValidVariableFlow = false
          break
        }
      }
    }

    if (invalidEdges.length === 0 && hasValidVariableFlow) {
      this.complianceMetrics.variableFlowCompliance.passed++
      console.log(`  ✅ Variable Flow Compliance: SUCCESS`)
      return { success: true }
    } else {
      const issues = []
      if (invalidEdges.length > 0) issues.push('Invalid edge connections')
      if (!hasValidVariableFlow) issues.push('Missing variable references')

      console.log(`  ❌ Variable Flow Compliance: FAILED - ${issues.join(', ')}`)
      return { success: false, issues }
    }
  }

  // Business logic compliance validation
  async validateBusinessLogicCompliance(workflowData, testIndex) {
    this.complianceMetrics.businessLogicCompliance.total++

    const nodes = workflowData.workflow?.graph?.nodes || []

    // Check for business logic patterns
    const hasConditionalLogic = nodes.some(node => node.type === 'if-else')
    const hasKnowledgeRetrieval = nodes.some(node => node.type === 'knowledge-retrieval')
    const hasDataTransformation = nodes.some(node => node.type === 'template-transform' || node.type === 'parameter-extractor')

    // Check for proper workflow structure
    const hasStart = nodes.some(node => node.type === 'start')
    const hasEnd = nodes.some(node => node.type === 'end')
    const hasProcessingNodes = nodes.filter(node => !['start', 'end'].includes(node.type)).length >= 3

    const businessLogicScore = [
      hasConditionalLogic,
      hasKnowledgeRetrieval,
      hasDataTransformation,
      hasStart,
      hasEnd,
      hasProcessingNodes
    ].filter(Boolean).length

    if (businessLogicScore >= 5) {
      this.complianceMetrics.businessLogicCompliance.passed++
      console.log(`  ✅ Business Logic Compliance: SUCCESS (${businessLogicScore}/6 criteria)`)
      return { success: true }
    } else {
      console.log(`  ❌ Business Logic Compliance: FAILED (${businessLogicScore}/6 criteria)`)
      return { success: false, score: businessLogicScore }
    }
  }

  // Performance compliance validation
  async validatePerformanceCompliance(workflowData) {
    this.complianceMetrics.performanceCompliance.total++

    const nodes = workflowData.workflow?.graph?.nodes || []
    const edges = workflowData.workflow?.graph?.edges || []

    // Performance criteria
    const nodeCount = nodes.length
    const edgeCount = edges.length
    const avgPositionSpacing = this.calculateAverageSpacing(nodes)

    const hasOptimalNodeCount = nodeCount >= 6 && nodeCount <= 15
    const hasProperEdgeRatio = edgeCount >= (nodeCount - 1) && edgeCount <= (nodeCount + 3)
    const hasProperSpacing = avgPositionSpacing >= 200 && avgPositionSpacing <= 350

    const performanceScore = [hasOptimalNodeCount, hasProperEdgeRatio, hasProperSpacing].filter(Boolean).length

    if (performanceScore >= 2) {
      this.complianceMetrics.performanceCompliance.passed++
      console.log(`  ✅ Performance Compliance: SUCCESS (${performanceScore}/3 criteria)`)
      return { success: true }
    } else {
      console.log(`  ❌ Performance Compliance: FAILED (${performanceScore}/3 criteria)`)
      return { success: false, score: performanceScore }
    }
  }

  // Calculate average spacing between nodes
  calculateAverageSpacing(nodes) {
    if (nodes.length < 2) return 0

    let totalSpacing = 0
    let spacingCount = 0

    for (let i = 0; i < nodes.length - 1; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i]
        const node2 = nodes[j]

        if (node1.position && node2.position) {
          const dx = node1.position.x - node2.position.x
          const dy = node1.position.y - node2.position.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          totalSpacing += distance
          spacingCount++
        }
      }
    }

    return spacingCount > 0 ? totalSpacing / spacingCount : 0
  }

  // Record validation result
  recordValidationResult(testIndex, passed, message, error, details) {
    const result = {
      testIndex,
      passed,
      message,
      error,
      details,
      timestamp: new Date().toISOString()
    }

    this.validationResults.push(result)
    return result
  }

  // Calculate overall compliance metrics
  calculateOverallCompliance() {
    const metrics = {}

    for (const [category, data] of Object.entries(this.complianceMetrics)) {
      metrics[category] = {
        total: data.total,
        passed: data.passed,
        rate: data.total > 0 ? (data.passed / data.total) * 100 : 0
      }
    }

    const overallPassed = this.validationResults.filter(r => r.passed).length
    const overallTotal = this.validationResults.length
    const overallRate = overallTotal > 0 ? (overallPassed / overallTotal) * 100 : 0

    return {
      overall: {
        total: overallTotal,
        passed: overallPassed,
        rate: overallRate
      },
      categories: metrics
    }
  }

  // Generate comprehensive report
  generateComplianceReport() {
    const compliance = this.calculateOverallCompliance()

    console.log('\\n' + '='.repeat(60))
    console.log('🎯 DSL COMPLIANCE VALIDATION REPORT')
    console.log('='.repeat(60))

    console.log(`\\n📊 OVERALL COMPLIANCE`)
    console.log(`   Rate: ${compliance.overall.rate.toFixed(1)}%`)
    console.log(`   Passed: ${compliance.overall.passed}/${compliance.overall.total} tests`)
    console.log(`   Target: 85% compliance rate`)
    console.log(`   Status: ${compliance.overall.rate >= 85 ? '✅ TARGET ACHIEVED' : '❌ NEEDS IMPROVEMENT'}`)

    console.log(`\\n📋 CATEGORY BREAKDOWN`)
    for (const [category, metrics] of Object.entries(compliance.categories)) {
      const status = metrics.rate >= 85 ? '✅' : '❌'
      console.log(`   ${status} ${category}: ${metrics.rate.toFixed(1)}% (${metrics.passed}/${metrics.total})`)
    }

    if (compliance.overall.rate < 85) {
      console.log(`\\n🔧 IMPROVEMENT RECOMMENDATIONS`)
      for (const [category, metrics] of Object.entries(compliance.categories)) {
        if (metrics.rate < 85) {
          console.log(`   • Improve ${category}: Currently ${metrics.rate.toFixed(1)}%`)
        }
      }
    }

    return compliance
  }
}

// Enhanced test cases for comprehensive validation
const ENTERPRISE_TEST_CASES = [
  "Create a sophisticated customer service AI workflow with multi-stage analysis, sentiment evaluation, knowledge base integration, escalation logic, automated response generation, and quality scoring system",
  "Build an enterprise document processing pipeline with OCR extraction, content analysis, validation workflows, approval chains, and automated distribution to stakeholders",
  "Develop a comprehensive API integration workflow with authentication, data transformation, error handling, retry logic, response validation, and audit logging",
  "Implement an advanced content generation system with research automation, fact-checking, SEO optimization, multi-format publishing, and performance analytics",
  "Design a complex data processing workflow with batch operations, quality validation, transformation pipelines, error recovery, and comprehensive reporting"
]

// Execute comprehensive DSL compliance validation
async function runDSLComplianceValidation() {
  const validator = new DSLComplianceValidator()

  console.log('🚀 Starting Comprehensive DSL Compliance Validation...\\n')
  console.log('Target: 85% compliance rate with Phase 1.2 enhancements\\n')

  // Check API key availability
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test-key') {
    console.log('⚠️  No OPENAI_API_KEY found. Set environment variable for real testing.\\n')
    console.log('Example: export OPENAI_API_KEY="your-api-key-here"')
    return { compliance: { overall: { rate: 0 } } }
  }

  console.log('🔑 API Key found. Proceeding with enterprise-grade validation...\\n')

  // Execute all test cases
  for (const [index, testCase] of ENTERPRISE_TEST_CASES.entries()) {
    try {
      await validator.validateWorkflow(testCase, index)

      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000))

    } catch (error) {
      console.log(`❌ Test ${index + 1} failed:`, error.message)
      validator.recordValidationResult(index, false, 'Test execution failed', error.message)
    }
  }

  // Generate final compliance report
  const compliance = validator.generateComplianceReport()

  // Save detailed results
  fs.writeFileSync(
    path.join(__dirname, 'dsl-compliance-report.json'),
    JSON.stringify({
      compliance,
      details: validator.validationResults,
      timestamp: new Date().toISOString()
    }, null, 2)
  )

  console.log('\\nDetailed results saved to dsl-compliance-report.json')

  return { compliance, validator }
}

// Execute if run directly
if (require.main === module) {
  runDSLComplianceValidation()
    .then(({ compliance }) => {
      if (compliance && compliance.overall.rate >= 85) {
        console.log('\\n🎉 DSL COMPLIANCE TARGET ACHIEVED!')
        process.exit(0)
      } else {
        console.log('\\n⚠️  DSL compliance below target. Review recommendations.')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('Validation failed:', error)
      process.exit(1)
    })
}

module.exports = { DSLComplianceValidator }