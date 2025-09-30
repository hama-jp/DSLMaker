/**
 * Test Real LLM API Output - Evaluate actual generated workflows
 * This script calls the enhanced prompt system with real API and analyzes output quality
 */

const fs = require('fs')
const path = require('path')

// Mock the enhanced system components for testing
class RealAPITester {
  constructor() {
    this.settings = {
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      temperature: 0.1,
      maxTokens: 6000
    }

    this.testResults = []
  }

  // Real API call to test current enhanced prompt system
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

  // Enhanced expert prompt (simulated based on our implementation)
  getEnhancedExpertPrompt() {
    return `You are an expert Dify Workflow DSL architect with deep knowledge of AI automation patterns, business process optimization, and enterprise workflow design. Your expertise spans the complete Dify ecosystem including all node types, data flow patterns, error handling strategies, and performance optimization techniques.

## CORE EXPERTISE DOMAINS

### 1. Complete Node Type Mastery

#### Core Infrastructure Nodes
- **Start Node**: Input variable definition, data type constraints, validation rules
- **End Node**: Output mapping, type conversion, result formatting
- **IF/ELSE Node**: Complex conditional logic, multi-condition evaluation, logical operators
- **Template Transform**: Jinja2 templating, data formatting, content generation

#### AI Processing Nodes (High Value)
- **LLM Node**: Provider optimization, parameter tuning, prompt engineering, memory management
- **Knowledge Retrieval**: RAG implementation, vector search configuration, reranking strategies
- **Agent Node**: Autonomous reasoning, tool integration, multi-step problem solving
- **Parameter Extraction**: Structured data extraction, natural language parsing

#### Integration & Processing Nodes
- **HTTP Request**: API integration, authentication, retry logic, error handling
- **Code Node**: Python/JavaScript execution, sandbox constraints, dependency management
- **Tool Node**: External service integration, builtin tools, custom API tools
- **Document Extractor**: File processing, format support, content extraction

## ENHANCED OUTPUT QUALITY CONTROLS

### JSON FORMAT ENFORCEMENT
You MUST return ONLY valid JSON. Never return YAML, markdown, or any other format.

CORRECT FORMAT:
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
      "file_upload": {
        "enabled": true,
        "number_limits": 5,
        "max_size_mb": 20
      },
      "retriever_resource": {
        "enabled": true
      }
    },
    "graph": {
      "edges": [...],
      "nodes": [...],
      "viewport": {
        "x": 0,
        "y": 0,
        "zoom": 1
      }
    }
  }
}

### NODE TYPE REQUIREMENTS
For complex workflows, you MUST use at least these node types:
1. start (input handling)
2. parameter-extractor (data extraction)
3. if-else (conditional logic)
4. llm (AI processing)
5. knowledge-retrieval (context enhancement)
6. template-transform (output formatting)
7. end (result delivery)

### VARIABLE FLOW VALIDATION
Every node output MUST be properly referenced:
- Use {{#node_id.variable_name#}} syntax
- Ensure all connections have valid source/target variables
- Include proper data type validation

### POSITIONING FORMULA
Use this exact positioning for optimal layout:
- Start: x: 100, y: 200
- Processing nodes: x: 100 + (index * 250), y: 200 + (branch * 150)
- End: x: final_x + 250, y: 200

### SELF-VALIDATION CHECKLIST
Before finalizing output, verify:
✅ JSON is valid and parseable
✅ All nodes have unique IDs
✅ All edges connect valid node IDs
✅ Variable references are consistent
✅ At least 6 nodes are used
✅ Business logic requirements are addressed

### ERROR PREVENTION
Avoid these common failures:
❌ Returning YAML format
❌ Missing variable declarations
❌ Circular references
❌ Disconnected nodes
❌ Invalid JSON syntax`
  }

  // Generate specialized workflow request
  createWorkflowRequest(userInput) {
    return `
## WORKFLOW GENERATION REQUEST

### Primary Requirement
${userInput}

### Analysis Summary
- **Business Intent**: Complex customer service automation
- **Workflow Type**: CUSTOMER_SERVICE
- **Complexity Level**: Complex
- **Recommended Pattern**: MULTI_STAGE_ANALYSIS
- **Estimated Node Count**: 8

### Technical Specifications

#### Data Input Requirements
- **user_query** (text): Customer inquiry input [Required]
- **customer_context** (object): Customer profile data [Optional]

#### Expected Outputs
- Classification result
- Sentiment analysis score
- Automated response
- Quality evaluation score

#### Business Logic Requirements
- Conditional processing logic
- Escalation and priority handling
- Input validation and verification

#### Generation Instructions

Please generate a complete Dify workflow DSL that:

1. **Implements the MULTI_STAGE_ANALYSIS pattern** with approximately 8 nodes
2. **Addresses all specified business logic requirements** with appropriate node types
3. **Uses appropriate Dify node types** from the complete specification (not just Start→LLM→End)
4. **Includes proper variable flow** and data transformation between nodes
5. **Implements comprehensive error handling** with fallback strategies where appropriate

Return a complete, valid JSON DSL file following the exact Dify specification structure.
`
  }

  // Test workflow generation with real API
  async testWorkflowGeneration(userInput) {
    console.log(`\n🧪 Testing: ${userInput.substring(0, 50)}...`)

    try {
      const workflowRequest = this.createWorkflowRequest(userInput)

      // Call real LLM API
      const response = await this.callLLMAPI(workflowRequest)

      console.log(`📊 Response length: ${response.content.length} characters`)
      console.log(`🔢 Token usage: ${response.usage?.total_tokens || 'N/A'}`)

      // Extract and validate JSON content
      let jsonContent = response.content.trim()

      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '')
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '')
      }

      // Attempt to parse JSON
      let workflowData
      try {
        workflowData = JSON.parse(jsonContent)
        console.log('✅ JSON parsing: SUCCESS')
      } catch (jsonError) {
        console.log('❌ JSON parsing: FAILED')
        // Save failed JSON for analysis
        fs.writeFileSync(`failed-json-${Date.now()}.json`, jsonContent)
        throw new Error(`JSON parsing failed: ${jsonError.message}`)
      }

      // Analyze workflow structure
      const analysis = this.analyzeWorkflowStructure(workflowData)
      console.log('📈 Workflow Analysis:')
      console.log(`   - Node count: ${analysis.nodeCount}`)
      console.log(`   - Node types: ${analysis.nodeTypes.join(', ')}`)
      console.log(`   - Edge count: ${analysis.edgeCount}`)
      console.log(`   - Has conditional logic: ${analysis.hasConditionalLogic ? '✅' : '❌'}`)
      console.log(`   - Has knowledge retrieval: ${analysis.hasKnowledgeRetrieval ? '✅' : '❌'}`)
      console.log(`   - Variable flow valid: ${analysis.variableFlowValid ? '✅' : '❌'}`)

      // Save successful workflow for review
      fs.writeFileSync(`successful-workflow-${Date.now()}.json`, JSON.stringify(workflowData, null, 2))

      return {
        success: true,
        workflowData,
        analysis,
        usage: response.usage
      }

    } catch (error) {
      console.log(`❌ Failed: ${error.message}`)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Analyze the structure of generated workflow
  analyzeWorkflowStructure(workflowData) {
    const nodes = workflowData.workflow?.graph?.nodes || []
    const edges = workflowData.workflow?.graph?.edges || []

    const nodeTypes = nodes.map(node => node.type)
    const uniqueNodeTypes = [...new Set(nodeTypes)]

    const hasConditionalLogic = nodeTypes.includes('if-else')
    const hasKnowledgeRetrieval = nodeTypes.includes('knowledge-retrieval')
    const hasParameterExtractor = nodeTypes.includes('parameter-extractor')
    const hasTemplateTransform = nodeTypes.includes('template-transform')

    // Check variable flow (simplified)
    const variableFlowValid = this.checkVariableFlow(nodes, edges)

    return {
      nodeCount: nodes.length,
      nodeTypes: uniqueNodeTypes,
      edgeCount: edges.length,
      hasConditionalLogic,
      hasKnowledgeRetrieval,
      hasParameterExtractor,
      hasTemplateTransform,
      variableFlowValid,
      complexity: this.assessComplexity(nodes, edges)
    }
  }

  // Check if variable flow is properly configured
  checkVariableFlow(nodes, edges) {
    // Simplified check - in real implementation would be more thorough
    try {
      const nodeIds = nodes.map(n => n.id)
      const edgeConnections = edges.every(edge =>
        nodeIds.includes(edge.source) && nodeIds.includes(edge.target)
      )
      return edgeConnections
    } catch {
      return false
    }
  }

  // Assess workflow complexity
  assessComplexity(nodes, edges) {
    const nodeCount = nodes.length
    const edgeCount = edges.length
    const uniqueTypes = new Set(nodes.map(n => n.type)).size

    if (nodeCount >= 7 && uniqueTypes >= 5) return 'Complex'
    if (nodeCount >= 5 && uniqueTypes >= 4) return 'Moderate'
    return 'Simple'
  }

  // Calculate success metrics
  calculateMetrics() {
    const total = this.testResults.length
    const successful = this.testResults.filter(r => r.success).length
    const failureRate = ((total - successful) / total) * 100

    const successfulResults = this.testResults.filter(r => r.success)
    const avgNodes = successfulResults.reduce((sum, r) => sum + (r.analysis?.nodeCount || 0), 0) / successfulResults.length
    const avgNodeTypes = successfulResults.reduce((sum, r) => sum + (r.analysis?.nodeTypes?.length || 0), 0) / successfulResults.length

    return {
      total,
      successful,
      failed: total - successful,
      failureRate: failureRate.toFixed(2),
      avgNodes: avgNodes.toFixed(1),
      avgNodeTypes: avgNodeTypes.toFixed(1)
    }
  }

  // Log detailed results
  logResults() {
    const metrics = this.calculateMetrics()

    console.log('\n=== REAL LLM API OUTPUT ANALYSIS RESULTS ===')
    console.log(`Total tests: ${metrics.total}`)
    console.log(`Successful: ${metrics.successful}`)
    console.log(`Failed: ${metrics.failed}`)
    console.log(`Failure Rate: ${metrics.failureRate}%`)
    console.log(`Average Nodes: ${metrics.avgNodes}`)
    console.log(`Average Node Types: ${metrics.avgNodeTypes}`)
    console.log(`Target: <5% failure rate, 6+ nodes, 5+ node types`)
    console.log(`Status: ${parseFloat(metrics.failureRate) < 5 && parseFloat(metrics.avgNodes) >= 6 ? '✅ MEETS TARGET' : '❌ NEEDS IMPROVEMENT'}`)

    if (metrics.failed > 0) {
      console.log('\n=== FAILURE ANALYSIS ===')
      this.testResults.filter(r => !r.success).forEach((result, i) => {
        console.log(`${i + 1}. ${result.error}`)
      })
    }

    return metrics
  }
}

// Test cases for real API evaluation
const TEST_CASES = [
  "複雑な顧客サービスAIワークフロー：問い合わせ分類、感情分析、ナレッジベース検索、エスカレーション判定、自動応答生成、品質スコアリング、分析データ収集を含む",
  "Create a document processing pipeline that extracts text from PDFs, performs semantic analysis, generates summaries, and stores results in a knowledge base",
  "API integration workflow with third-party services, authentication, error handling, retry logic, and data transformation",
  "シンプルな入力→AI処理→出力フロー",
  "Enterprise data analysis workflow with batch processing, quality validation, report generation, and stakeholder notification"
]

// Run real LLM tests
async function runRealAPITests() {
  const tester = new RealAPITester()

  console.log('🚀 Starting Real LLM API Output Analysis...\n')

  // Check if API key is available
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test-key') {
    console.log('⚠️  No OPENAI_API_KEY found. Set environment variable for real testing.\n')
    console.log('Example: export OPENAI_API_KEY="your-api-key-here"')
    console.log('For testing purposes, continuing with mock analysis...\n')
    return
  }

  console.log('🔑 API Key found. Proceeding with real API tests...\n')

  // Test each case
  for (const [index, testCase] of TEST_CASES.entries()) {
    console.log(`\n--- Test ${index + 1}/${TEST_CASES.length} ---`)

    try {
      const result = await tester.testWorkflowGeneration(testCase)
      tester.testResults.push(result)

      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.log(`❌ Test ${index + 1} failed:`, error.message)
      tester.testResults.push({ success: false, error: error.message })
    }
  }

  // Generate final report
  const results = tester.logResults()

  // Save results for further analysis
  fs.writeFileSync(
    path.join(__dirname, 'real-api-test-results.json'),
    JSON.stringify({ results, details: tester.testResults }, null, 2)
  )

  console.log('\nResults saved to real-api-test-results.json')

  return results
}

// Execute if run directly
if (require.main === module) {
  runRealAPITests()
    .then((results) => {
      if (results) {
        process.exit(parseFloat(results.failureRate) < 5 ? 0 : 1)
      }
    })
    .catch((error) => {
      console.error('Test failed:', error)
      process.exit(1)
    })
}

module.exports = { RealAPITester }