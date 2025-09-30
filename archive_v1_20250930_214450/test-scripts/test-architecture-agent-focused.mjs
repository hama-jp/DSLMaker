/**
 * Focused Real API Test for Workflow Architecture Agent
 * Quick validation of core architecture design capabilities
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

console.log('🏗️ Focused Workflow Architecture Agent Test')
console.log('=' .repeat(50))

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
      verbosity: options.verbosity || 'low'  // Use low verbosity for faster responses
    },
    reasoning: {
      effort: options.effort || 'medium'     // Use medium effort for balance
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

// Quick architecture design test
async function testQuickArchitectureDesign() {
  console.log('\n🚀 Quick Architecture Design Test')

  const systemPrompt = `You are a workflow architecture designer. Design a workflow architecture for the given requirements.

Respond concisely with:
1. PATTERN: [LINEAR_PROCESSING|CONDITIONAL_ROUTING|PARALLEL_PROCESSING|RAG_PIPELINE|RAG_WITH_ROUTING]
2. NODES: [estimated count]
3. PERFORMANCE: [expected response time in seconds]
4. REASONING: [brief explanation]`

  const testCase = {
    name: "Simple FAQ Bot",
    requirements: "Create a basic FAQ chatbot that answers common questions about a product using a knowledge base."
  }

  console.log(`\n📋 Test Case: ${testCase.name}`)
  console.log(`Requirements: ${testCase.requirements}`)

  try {
    const startTime = Date.now()

    const result = await makeGPT5Request(
      systemPrompt,
      testCase.requirements,
      { verbosity: 'low', effort: 'medium' }
    )

    const endTime = Date.now()
    console.log(`⏱️  Completed in ${endTime - startTime}ms`)

    console.log(`\n🤖 Architecture Response:`)
    console.log(result.content)

    // Validate response contains key components
    const content = result.content.toLowerCase()
    const hasPattern = /pattern|linear|conditional|parallel|rag/i.test(result.content)
    const hasNodes = /nodes|count|\d+/i.test(result.content)
    const hasPerformance = /performance|time|second/i.test(result.content)
    const hasReasoning = /reasoning|because|explanation/i.test(result.content)

    console.log(`\n📊 Response Quality:`)
    console.log(`- Pattern selection: ${hasPattern ? '✅' : '❌'}`)
    console.log(`- Node estimation: ${hasNodes ? '✅' : '❌'}`)
    console.log(`- Performance estimate: ${hasPerformance ? '✅' : '❌'}`)
    console.log(`- Reasoning provided: ${hasReasoning ? '✅' : '❌'}`)

    if (result.usage) {
      console.log(`\n📈 Token Usage: ${result.usage.total_tokens} tokens`)
    }

    const qualityScore = [hasPattern, hasNodes, hasPerformance, hasReasoning].filter(Boolean).length
    const passed = qualityScore >= 3

    if (passed) {
      console.log(`✅ Test PASSED - Quality: ${qualityScore}/4`)
    } else {
      console.log(`❌ Test FAILED - Quality: ${qualityScore}/4`)
    }

    return { passed, qualityScore, responseTime: endTime - startTime, usage: result.usage }

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`)
    return { passed: false, qualityScore: 0, responseTime: 0, usage: null }
  }
}

// Pattern selection validation
async function testPatternSelection() {
  console.log('\n🎯 Pattern Selection Validation Test')

  const systemPrompt = `You are a workflow pattern expert. For the given scenario, recommend the most appropriate pattern and explain briefly why.

Pattern Options:
- LINEAR_PROCESSING: Simple sequential steps
- CONDITIONAL_ROUTING: Branching based on conditions
- RAG_PIPELINE: Knowledge retrieval and processing
- PARALLEL_PROCESSING: Multiple simultaneous operations

Respond with:
PATTERN: [selected pattern]
WHY: [brief reason]`

  const testScenarios = [
    {
      scenario: "Simple email autoresponder that sends a thank you message",
      expectedPattern: "LINEAR",
      description: "Email autoresponder"
    },
    {
      scenario: "Document analysis system that searches knowledge base and generates reports",
      expectedPattern: "RAG",
      description: "Document analysis with knowledge base"
    }
  ]

  let correctCount = 0
  let totalCount = testScenarios.length

  for (const test of testScenarios) {
    console.log(`\n📝 Scenario: ${test.description}`)

    try {
      const result = await makeGPT5Request(
        systemPrompt,
        test.scenario,
        { verbosity: 'low', effort: 'medium' }
      )

      console.log(`🤖 Response: ${result.content.substring(0, 200)}...`)

      const matchesExpected = result.content.toLowerCase().includes(test.expectedPattern.toLowerCase())

      if (matchesExpected) {
        console.log(`✅ Pattern selection correct`)
        correctCount++
      } else {
        console.log(`⚠️  Pattern selection may need review`)
      }

    } catch (error) {
      console.error(`❌ Pattern test failed: ${error.message}`)
    }
  }

  const accuracy = (correctCount / totalCount) * 100
  console.log(`\n📊 Pattern Selection Accuracy: ${accuracy}% (${correctCount}/${totalCount})`)

  return { accuracy, correctCount, totalCount }
}

// Main test runner
async function runFocusedTests() {
  console.log('\n🚀 Running Focused Architecture Agent Tests')

  try {
    // Test 1: Quick Architecture Design
    const architectureResult = await testQuickArchitectureDesign()

    // Test 2: Pattern Selection
    const patternResult = await testPatternSelection()

    // Summary
    console.log('\n🏁 Focused Test Results Summary')
    console.log('=' .repeat(50))

    const totalTests = 2
    const passedTests = (architectureResult.passed ? 1 : 0) + (patternResult.accuracy >= 50 ? 1 : 0)
    const successRate = (passedTests / totalTests) * 100

    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`)
    console.log(`📊 Success Rate: ${successRate}%`)
    console.log(`⏱️  Average Response Time: ${architectureResult.responseTime}ms`)
    console.log(`🔢 Token Usage: ${architectureResult.usage?.total_tokens || 'N/A'} tokens`)

    if (successRate >= 80) {
      console.log('\n🎉 Architecture Agent is working well!')
      console.log('\n📝 Key Findings:')
      console.log(`- Architecture design quality: ${architectureResult.qualityScore}/4`)
      console.log(`- Pattern selection accuracy: ${patternResult.accuracy}%`)
      console.log(`- Performance: ${architectureResult.responseTime}ms response time`)
    } else {
      console.log('\n⚠️  Architecture Agent needs tuning.')
    }

    return {
      totalTests,
      passedTests,
      successRate,
      details: {
        architectureQuality: architectureResult.qualityScore,
        patternAccuracy: patternResult.accuracy,
        responseTime: architectureResult.responseTime,
        tokenUsage: architectureResult.usage?.total_tokens
      }
    }

  } catch (error) {
    console.error('💥 Focused test failure:', error)
    throw error
  }
}

// Run the focused tests
runFocusedTests()
  .then(results => {
    console.log('\n🔚 Focused Architecture Agent testing completed')
    process.exit(results?.successRate >= 80 ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error)
    process.exit(1)
  })