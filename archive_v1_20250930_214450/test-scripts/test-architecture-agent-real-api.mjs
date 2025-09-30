/**
 * Real API Test for Workflow Architecture Agent
 *
 * Tests the Workflow Architecture Agent with actual LLM API calls
 * to validate pattern selection, architecture design, and performance estimation.
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

console.log('🏗️ Starting Workflow Architecture Agent Real API Tests')
console.log('=' .repeat(60))

// Helper function to make GPT-5 API requests
async function makeGPT5Request(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL || 'gpt-4'

  const endpoint = `${baseURL}/responses`
  const input = `${systemPrompt}\n\nUser Request: ${userPrompt}`

  const requestBody = {
    model: model,
    input: input,
    text: {
      verbosity: options.verbosity || 'medium'
    },
    reasoning: {
      effort: options.effort || 'high'
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`API Error (${response.status}): ${await response.text()}`)
  }

  const data = await response.json()

  // Extract content from GPT-5 response
  let content = ''
  if (data.output && Array.isArray(data.output)) {
    const messageOutput = data.output.find(output => output.type === 'message')
    if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
      const textContent = messageOutput.content.find(c => c.type === 'output_text')
      content = textContent?.text || ''
    }
  }

  return {
    content,
    usage: data.usage
  }
}

// Test cases representing different complexity levels and workflow types
const architectureTestCases = [
  {
    name: "Simple Linear Workflow",
    clarifiedRequirements: {
      businessIntent: "Create a simple customer service chatbot that answers product questions",
      detectedWorkflowType: "CUSTOMER_SERVICE",
      complexity: "Simple",
      finalRequirements: {
        dataInputs: [
          { name: "user_question", type: "text", description: "Customer question", required: true }
        ],
        outputRequirements: ["Clear answer to customer question"],
        businessLogic: ["Use knowledge base to find relevant information"],
        integrationNeeds: [],
        performanceRequirements: ["Handle 50 requests per day"],
        securityConstraints: []
      }
    },
    expectedPattern: "LINEAR_PROCESSING"
  },
  {
    name: "Complex RAG Pipeline",
    clarifiedRequirements: {
      businessIntent: "Process legal documents and provide detailed analysis with source citations",
      detectedWorkflowType: "DOCUMENT_PROCESSING",
      complexity: "Complex",
      finalRequirements: {
        dataInputs: [
          { name: "document_files", type: "file", description: "Legal documents for analysis", required: true },
          { name: "analysis_type", type: "text", description: "Type of analysis needed", required: true }
        ],
        outputRequirements: [
          "Detailed legal analysis with citations",
          "Summary of key findings",
          "Risk assessment"
        ],
        businessLogic: [
          "Extract text from documents",
          "Identify legal precedents",
          "Cross-reference with legal database",
          "Generate comprehensive analysis"
        ],
        integrationNeeds: ["Legal knowledge database", "Document parsing service"],
        performanceRequirements: ["Handle large documents up to 100MB", "Complete analysis within 10 minutes"],
        securityConstraints: ["Maintain attorney-client privilege", "Secure document handling"]
      }
    },
    expectedPattern: "RAG_PIPELINE"
  },
  {
    name: "Conditional Routing Workflow",
    clarifiedRequirements: {
      businessIntent: "Route customer inquiries to appropriate departments based on content analysis",
      detectedWorkflowType: "CUSTOMER_SERVICE",
      complexity: "Moderate",
      finalRequirements: {
        dataInputs: [
          { name: "customer_message", type: "text", description: "Customer inquiry", required: true },
          { name: "customer_priority", type: "text", description: "VIP or regular customer", required: false }
        ],
        outputRequirements: [
          "Route to appropriate department",
          "Priority level assignment",
          "Initial response template"
        ],
        businessLogic: [
          "Analyze message sentiment and topic",
          "Determine routing based on content",
          "Escalate if high priority or complex issue",
          "Generate appropriate response template"
        ],
        integrationNeeds: ["CRM system", "Department routing system"],
        performanceRequirements: ["Process within 30 seconds", "99% uptime"],
        securityConstraints: ["Customer data protection"]
      }
    },
    expectedPattern: "CONDITIONAL_ROUTING"
  }
]

// Test architecture design functionality
async function testArchitectureDesign() {
  console.log('\n🏗️ Testing Architecture Design Functionality')
  console.log('-'.repeat(50))

  const systemPrompt = `You are an expert workflow architecture designer. Based on the provided requirements, design an optimal workflow architecture.

Your task:
1. Analyze the requirements and select the most appropriate workflow pattern
2. Design the node sequence with proper dependencies
3. Estimate performance characteristics (tokens, response time, costs)
4. Provide specific recommendations for optimization

Available patterns:
- LINEAR_PROCESSING: Simple sequential workflow
- CONDITIONAL_ROUTING: Decision-based routing with branching
- PARALLEL_PROCESSING: Multi-faceted analysis with parallel paths
- RAG_PIPELINE: Knowledge retrieval with document processing
- RAG_WITH_ROUTING: Hybrid approach combining RAG and routing

Provide your response in this format:
SELECTED_PATTERN: [pattern name]
ESTIMATED_NODES: [number]
NODE_SEQUENCE: [list of node types]
PERFORMANCE_ESTIMATE: [tokens: X, time: Y seconds, cost: $Z]
OPTIMIZATION_RECOMMENDATIONS: [specific recommendations]`

  let totalTests = 0
  let passedTests = 0

  for (const testCase of architectureTestCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`)
    console.log(`Expected Pattern: ${testCase.expectedPattern}`)

    try {
      totalTests++
      const startTime = Date.now()

      // Create requirements summary for the prompt
      const requirementsSummary = `
Business Intent: ${testCase.clarifiedRequirements.businessIntent}
Workflow Type: ${testCase.clarifiedRequirements.detectedWorkflowType}
Complexity: ${testCase.clarifiedRequirements.complexity}
Data Inputs: ${testCase.clarifiedRequirements.finalRequirements.dataInputs.map(i => i.name).join(', ')}
Output Requirements: ${testCase.clarifiedRequirements.finalRequirements.outputRequirements.join('; ')}
Business Logic: ${testCase.clarifiedRequirements.finalRequirements.businessLogic.join('; ')}
Integration Needs: ${testCase.clarifiedRequirements.finalRequirements.integrationNeeds.join('; ')}
Performance Requirements: ${testCase.clarifiedRequirements.finalRequirements.performanceRequirements.join('; ')}`

      const result = await makeGPT5Request(
        systemPrompt,
        requirementsSummary,
        { verbosity: 'high', effort: 'high' }
      )

      const endTime = Date.now()
      console.log(`⏱️  Architecture design completed in ${endTime - startTime}ms`)

      console.log(`📝 Architecture Design (${result.content.length} chars):`)
      console.log(result.content.substring(0, 500) + (result.content.length > 500 ? '...' : ''))

      // Parse and validate architecture design
      const content = result.content.toLowerCase()

      // Check for key components
      const hasPatternSelection = /selected_pattern|pattern|linear|conditional|parallel|rag/i.test(result.content)
      const hasNodeEstimate = /nodes|estimated_nodes|\d+\s*nodes/i.test(result.content)
      const hasPerformanceEstimate = /performance|tokens|time|cost|estimate/i.test(result.content)
      const hasOptimizations = /optimization|recommend|improve|enhance/i.test(result.content)

      console.log('\n📊 Architecture Quality Check:')
      console.log(`- Pattern selection logic: ${hasPatternSelection ? '✅' : '❌'}`)
      console.log(`- Node count estimation: ${hasNodeEstimate ? '✅' : '❌'}`)
      console.log(`- Performance estimation: ${hasPerformanceEstimate ? '✅' : '❌'}`)
      console.log(`- Optimization recommendations: ${hasOptimizations ? '✅' : '❌'}`)

      // Token usage analysis
      if (result.usage) {
        console.log(`\n📈 Token Usage:`)
        console.log(`- Input tokens: ${result.usage.input_tokens}`)
        console.log(`- Output tokens: ${result.usage.output_tokens}`)
        console.log(`- Total tokens: ${result.usage.total_tokens}`)
      }

      const qualityScore = [hasPatternSelection, hasNodeEstimate, hasPerformanceEstimate, hasOptimizations]
        .filter(Boolean).length

      if (qualityScore >= 3) {
        console.log(`✅ Test passed - Architecture design quality: ${qualityScore}/4`)
        passedTests++
      } else {
        console.log(`⚠️  Test partially passed - Quality: ${qualityScore}/4 (needs improvement)`)
        passedTests += 0.5 // Partial credit
      }

    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`)
    }
  }

  return { totalTests, passedTests }
}

// Test pattern selection logic
async function testPatternSelection() {
  console.log('\n🎯 Testing Pattern Selection Logic')
  console.log('-'.repeat(40))

  const systemPrompt = `You are a workflow pattern selection expert. Given requirements, recommend the best workflow pattern and explain your reasoning.

Pattern Options:
1. LINEAR_PROCESSING - For simple sequential workflows
2. CONDITIONAL_ROUTING - For decision-based routing and branching
3. PARALLEL_PROCESSING - For multi-faceted analysis requiring parallel paths
4. RAG_PIPELINE - For knowledge retrieval and document processing
5. RAG_WITH_ROUTING - For hybrid approaches combining knowledge retrieval with routing

Respond with:
RECOMMENDED_PATTERN: [pattern name]
REASONING: [detailed explanation]
ALTERNATIVES: [other viable patterns]
CONFIDENCE: [1-10 scale]`

  const testScenarios = [
    {
      scenario: "Simple FAQ chatbot for a small business",
      expectedCategory: "LINEAR"
    },
    {
      scenario: "Complex legal research system with document analysis and case law references",
      expectedCategory: "RAG"
    },
    {
      scenario: "Customer support system that routes tickets to different departments based on content analysis",
      expectedCategory: "CONDITIONAL"
    }
  ]

  let correctSelections = 0
  let totalScenarios = testScenarios.length

  for (const test of testScenarios) {
    console.log(`\n📋 Scenario: ${test.scenario}`)

    try {
      const result = await makeGPT5Request(
        systemPrompt,
        test.scenario,
        { verbosity: 'medium', effort: 'high' }
      )

      console.log(`🤖 Pattern Recommendation:`)
      console.log(result.content.substring(0, 300) + '...')

      // Check if recommendation aligns with expected category
      const content = result.content.toLowerCase()
      const matchesExpected = content.includes(test.expectedCategory.toLowerCase())

      if (matchesExpected) {
        console.log(`✅ Pattern selection aligned with expectations`)
        correctSelections++
      } else {
        console.log(`⚠️  Pattern selection may need review`)
      }

    } catch (error) {
      console.error(`❌ Pattern selection test failed: ${error.message}`)
    }
  }

  const accuracy = (correctSelections / totalScenarios) * 100
  console.log(`\n📊 Pattern Selection Accuracy: ${accuracy.toFixed(1)}% (${correctSelections}/${totalScenarios})`)

  return accuracy >= 66.7 // At least 2/3 correct
}

// Test performance estimation capabilities
async function testPerformanceEstimation() {
  console.log('\n⚡ Testing Performance Estimation')
  console.log('-'.repeat(40))

  const systemPrompt = `You are a workflow performance analyst. Given a workflow description, provide realistic performance estimates.

Estimate the following for the given workflow:
- TOKEN_USAGE: Approximate tokens per request (input + output)
- RESPONSE_TIME: Expected response time in seconds
- COST_ESTIMATE: Approximate cost per request in USD
- THROUGHPUT: Requests per hour the workflow can handle
- BOTTLENECKS: Potential performance bottlenecks

Be specific and realistic in your estimates based on typical LLM and workflow performance characteristics.`

  const workflow = "A document analysis workflow that processes PDF legal contracts, extracts key terms, compares against a knowledge base of legal precedents, and generates a risk assessment report with citations."

  try {
    const result = await makeGPT5Request(
      systemPrompt,
      workflow,
      { verbosity: 'high', effort: 'high' }
    )

    console.log(`📊 Performance Analysis (${result.content.length} chars):`)
    console.log(result.content)

    // Check for key performance metrics
    const content = result.content.toLowerCase()
    const hasTokenEstimate = /token|input|output|\d+k?\s*tokens/i.test(result.content)
    const hasTimeEstimate = /time|second|minute|\d+\s*(s|sec|seconds|min|minutes)/i.test(result.content)
    const hasCostEstimate = /cost|dollar|\$|price|\d+\s*cents?/i.test(result.content)
    const hasThroughput = /throughput|requests|per hour|rph|\d+.*hour/i.test(result.content)
    const hasBottlenecks = /bottleneck|limitation|constraint|slow/i.test(result.content)

    console.log('\n📈 Performance Estimation Quality:')
    console.log(`- Token usage estimation: ${hasTokenEstimate ? '✅' : '❌'}`)
    console.log(`- Response time estimation: ${hasTimeEstimate ? '✅' : '❌'}`)
    console.log(`- Cost estimation: ${hasCostEstimate ? '✅' : '❌'}`)
    console.log(`- Throughput analysis: ${hasThroughput ? '✅' : '❌'}`)
    console.log(`- Bottleneck identification: ${hasBottlenecks ? '✅' : '❌'}`)

    const qualityScore = [hasTokenEstimate, hasTimeEstimate, hasCostEstimate, hasThroughput, hasBottlenecks]
      .filter(Boolean).length

    return qualityScore >= 3

  } catch (error) {
    console.error(`❌ Performance estimation test failed: ${error.message}`)
    return false
  }
}

// Main test runner
async function runArchitectureTests() {
  try {
    // Test 1: Architecture Design
    console.log('\n🚀 Running Architecture Design Tests...')
    const { totalTests, passedTests } = await testArchitectureDesign()

    // Test 2: Pattern Selection
    console.log('\n🚀 Running Pattern Selection Tests...')
    const patternSuccess = await testPatternSelection()

    // Test 3: Performance Estimation
    console.log('\n🚀 Running Performance Estimation Tests...')
    const performanceSuccess = await testPerformanceEstimation()

    // Calculate overall results
    const overallTests = totalTests + 2 // pattern selection + performance estimation
    const overallPassed = passedTests + (patternSuccess ? 1 : 0) + (performanceSuccess ? 1 : 0)

    console.log('\n🏁 Architecture Agent Test Results Summary')
    console.log('=' .repeat(60))
    console.log(`✅ Passed: ${overallPassed}/${overallTests} tests`)
    console.log(`📊 Success Rate: ${((overallPassed / overallTests) * 100).toFixed(1)}%`)

    if (overallPassed >= overallTests * 0.8) {
      console.log('\n🎉 Architecture Agent is working well with real API!')
    } else {
      console.log('\n⚠️  Architecture Agent needs tuning for optimal performance.')
    }

    console.log('\n📝 Architecture Agent Tuning Recommendations:')
    console.log('- Monitor pattern selection accuracy with diverse test cases')
    console.log('- Validate performance estimates against actual workflow metrics')
    console.log('- Consider adding domain-specific pattern templates')
    console.log('- Implement feedback loop for continuous improvement')

    return {
      totalTests: overallTests,
      passedTests: overallPassed,
      successRate: (overallPassed / overallTests) * 100
    }

  } catch (error) {
    console.error('💥 Critical architecture test failure:', error)
    throw error
  }
}

// Run the tests
runArchitectureTests()
  .then(results => {
    console.log('\n🔚 Architecture Agent testing completed')
    process.exit(results?.passedTests >= results?.totalTests * 0.8 ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Architecture Agent test execution failed:', error)
    process.exit(1)
  })