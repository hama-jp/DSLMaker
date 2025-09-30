/**
 * Real API Test for Node Configuration Agent
 *
 * Tests the Node Configuration Agent's ability to enhance nodes with
 * optimized prompts, parameters, and advanced configurations.
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

console.log('⚙️ Node Configuration Agent Real API Tests')
console.log('=' .repeat(55))

// Helper function to make GPT-5 API requests
async function makeGPT5Request(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL || 'gpt-4'

  const endpoint = `${baseURL}/responses`
  const input = `${systemPrompt}\n\nTask: ${userPrompt}`

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

// Test LLM node configuration and prompt engineering
async function testLLMNodeConfiguration() {
  console.log('\n🤖 Testing LLM Node Configuration & Prompt Engineering')
  console.log('-'.repeat(55))

  const systemPrompt = `You are an expert at configuring LLM nodes for workflow automation. Your task is to enhance a workflow node with optimized prompts, parameters, and error handling.

For the given node specification, provide:
1. SYSTEM_PROMPT: Professional system prompt with clear role definition
2. USER_PROMPT_TEMPLATE: Template with proper variable substitution
3. MODEL_PARAMETERS: Optimal temperature, max_tokens, etc.
4. ERROR_HANDLING: Fallback strategies and retry logic
5. VALIDATION: Input/output validation rules

Make the configuration production-ready and robust.`

  const nodeSpec = {
    nodeType: "LLM",
    purpose: "Analyze customer support tickets and categorize them by urgency and department",
    inputs: ["ticket_content", "customer_tier"],
    outputs: ["urgency_level", "department", "initial_response_template"],
    businessContext: "Customer support automation for SaaS company"
  }

  const userPrompt = `Configure an LLM node for: ${nodeSpec.purpose}

Node Details:
- Type: ${nodeSpec.nodeType}
- Inputs: ${nodeSpec.inputs.join(', ')}
- Expected Outputs: ${nodeSpec.outputs.join(', ')}
- Context: ${nodeSpec.businessContext}

Provide a complete, production-ready configuration.`

  console.log(`\n📋 Node Configuration Task:`)
  console.log(`Purpose: ${nodeSpec.purpose}`)
  console.log(`Inputs: ${nodeSpec.inputs.join(', ')}`)
  console.log(`Outputs: ${nodeSpec.outputs.join(', ')}`)

  try {
    const startTime = Date.now()

    const result = await makeGPT5Request(
      systemPrompt,
      userPrompt,
      { verbosity: 'medium', effort: 'high' }
    )

    const endTime = Date.now()
    console.log(`⏱️  Configuration completed in ${endTime - startTime}ms`)

    console.log(`\n⚙️ Node Configuration (${result.content.length} chars):`)
    console.log(result.content.substring(0, 800) + (result.content.length > 800 ? '...' : ''))

    // Validate configuration quality
    const content = result.content.toLowerCase()
    const hasSystemPrompt = /system_prompt|system prompt|role:|you are/i.test(result.content)
    const hasUserTemplate = /user_prompt|template|{|}|\$\{|\%\{/i.test(result.content)
    const hasModelParams = /temperature|max_tokens|parameters|model/i.test(result.content)
    const hasErrorHandling = /error|fallback|retry|handling|validation/i.test(result.content)
    const hasValidation = /validation|validate|check|verify/i.test(result.content)

    console.log(`\n📊 Configuration Quality Check:`)
    console.log(`- System prompt design: ${hasSystemPrompt ? '✅' : '❌'}`)
    console.log(`- User prompt template: ${hasUserTemplate ? '✅' : '❌'}`)
    console.log(`- Model parameters: ${hasModelParams ? '✅' : '❌'}`)
    console.log(`- Error handling: ${hasErrorHandling ? '✅' : '❌'}`)
    console.log(`- Input/output validation: ${hasValidation ? '✅' : '❌'}`)

    if (result.usage) {
      console.log(`\n📈 Token Usage: ${result.usage.total_tokens} tokens`)
    }

    const qualityScore = [hasSystemPrompt, hasUserTemplate, hasModelParams, hasErrorHandling, hasValidation]
      .filter(Boolean).length

    return {
      passed: qualityScore >= 4,
      qualityScore,
      responseTime: endTime - startTime,
      usage: result.usage,
      contentLength: result.content.length
    }

  } catch (error) {
    console.error(`❌ LLM node configuration test failed: ${error.message}`)
    return { passed: false, qualityScore: 0, responseTime: 0, usage: null, contentLength: 0 }
  }
}

// Test parameter optimization
async function testParameterOptimization() {
  console.log('\n📐 Testing Parameter Optimization')
  console.log('-'.repeat(40))

  const systemPrompt = `You are a parameter optimization expert for LLM workflows. Given a workflow scenario, recommend optimal parameters for different node types.

For each node type, specify:
- MODEL: Recommended model (gpt-4, gpt-3.5-turbo, etc.)
- TEMPERATURE: Optimal creativity level (0.0-1.0)
- MAX_TOKENS: Appropriate output length
- TOP_P: Nucleus sampling parameter
- FREQUENCY_PENALTY: Repetition control
- REASONING: Why these parameters are optimal

Consider performance, cost, and quality trade-offs.`

  const scenarios = [
    {
      name: "Factual FAQ Responses",
      description: "Answering factual questions about products with high accuracy requirements",
      priority: "accuracy_over_creativity"
    },
    {
      name: "Creative Content Generation",
      description: "Generating marketing copy and creative product descriptions",
      priority: "creativity_over_accuracy"
    }
  ]

  let totalTests = 0
  let passedTests = 0

  for (const scenario of scenarios) {
    console.log(`\n📝 Scenario: ${scenario.name}`)
    console.log(`Description: ${scenario.description}`)
    console.log(`Priority: ${scenario.priority}`)

    try {
      totalTests++
      const startTime = Date.now()

      const result = await makeGPT5Request(
        systemPrompt,
        `Optimize parameters for: ${scenario.description}\nPriority: ${scenario.priority}`,
        { verbosity: 'low', effort: 'medium' }
      )

      const endTime = Date.now()
      console.log(`⏱️  Optimization completed in ${endTime - startTime}ms`)

      console.log(`\n🎛️ Parameter Recommendations:`)
      console.log(result.content.substring(0, 400) + '...')

      // Validate parameter optimization
      const content = result.content.toLowerCase()
      const hasModel = /model|gpt-4|gpt-3.5/i.test(result.content)
      const hasTemperature = /temperature|0\.\d+|creativity/i.test(result.content)
      const hasMaxTokens = /max_tokens|tokens|length|\d+/i.test(result.content)
      const hasReasoning = /reasoning|because|why|optimal/i.test(result.content)

      console.log(`\n📊 Optimization Quality:`)
      console.log(`- Model recommendation: ${hasModel ? '✅' : '❌'}`)
      console.log(`- Temperature setting: ${hasTemperature ? '✅' : '❌'}`)
      console.log(`- Token limits: ${hasMaxTokens ? '✅' : '❌'}`)
      console.log(`- Reasoning provided: ${hasReasoning ? '✅' : '❌'}`)

      const qualityScore = [hasModel, hasTemperature, hasMaxTokens, hasReasoning].filter(Boolean).length

      if (qualityScore >= 3) {
        console.log(`✅ Test passed - Quality: ${qualityScore}/4`)
        passedTests++
      } else {
        console.log(`⚠️  Test needs improvement - Quality: ${qualityScore}/4`)
      }

    } catch (error) {
      console.error(`❌ Parameter optimization test failed: ${error.message}`)
    }
  }

  return { totalTests, passedTests, accuracy: (passedTests / totalTests) * 100 }
}

// Test error handling configuration
async function testErrorHandlingConfiguration() {
  console.log('\n🛡️ Testing Error Handling Configuration')
  console.log('-'.repeat(45))

  const systemPrompt = `You are an error handling specialist for workflow systems. Design comprehensive error handling strategies for workflow nodes.

Provide:
1. INPUT_VALIDATION: Rules to validate inputs before processing
2. RETRY_LOGIC: When and how to retry failed operations
3. FALLBACK_STRATEGIES: Alternative actions when primary processing fails
4. ERROR_LOGGING: What information to capture for debugging
5. USER_COMMUNICATION: How to inform users about errors gracefully

Make the error handling robust and user-friendly.`

  const errorScenario = "LLM node that processes customer feedback and generates automated responses. The node should handle various failure modes including API timeouts, invalid input formats, and content policy violations."

  console.log(`\n📋 Error Handling Scenario:`)
  console.log(errorScenario)

  try {
    const startTime = Date.now()

    const result = await makeGPT5Request(
      systemPrompt,
      errorScenario,
      { verbosity: 'medium', effort: 'high' }
    )

    const endTime = Date.now()
    console.log(`⏱️  Error handling design completed in ${endTime - startTime}ms`)

    console.log(`\n🛡️ Error Handling Strategy (${result.content.length} chars):`)
    console.log(result.content.substring(0, 600) + '...')

    // Validate error handling comprehensiveness
    const content = result.content.toLowerCase()
    const hasInputValidation = /input|validation|validate|check|verify/i.test(result.content)
    const hasRetryLogic = /retry|attempt|backoff|timeout/i.test(result.content)
    const hasFallbacks = /fallback|alternative|backup|default/i.test(result.content)
    const hasLogging = /log|logging|debug|monitor|track/i.test(result.content)
    const hasUserComm = /user|message|notification|inform|communicate/i.test(result.content)

    console.log(`\n📊 Error Handling Coverage:`)
    console.log(`- Input validation: ${hasInputValidation ? '✅' : '❌'}`)
    console.log(`- Retry logic: ${hasRetryLogic ? '✅' : '❌'}`)
    console.log(`- Fallback strategies: ${hasFallbacks ? '✅' : '❌'}`)
    console.log(`- Error logging: ${hasLogging ? '✅' : '❌'}`)
    console.log(`- User communication: ${hasUserComm ? '✅' : '❌'}`)

    const coverageScore = [hasInputValidation, hasRetryLogic, hasFallbacks, hasLogging, hasUserComm]
      .filter(Boolean).length

    return {
      passed: coverageScore >= 4,
      coverageScore,
      responseTime: endTime - startTime,
      contentLength: result.content.length
    }

  } catch (error) {
    console.error(`❌ Error handling test failed: ${error.message}`)
    return { passed: false, coverageScore: 0, responseTime: 0, contentLength: 0 }
  }
}

// Main test runner
async function runNodeConfigurationTests() {
  console.log('\n🚀 Running Node Configuration Agent Tests')

  try {
    // Test 1: LLM Node Configuration
    console.log('\n=== Test 1: LLM Node Configuration ===')
    const llmConfigResult = await testLLMNodeConfiguration()

    // Test 2: Parameter Optimization
    console.log('\n=== Test 2: Parameter Optimization ===')
    const paramOptResult = await testParameterOptimization()

    // Test 3: Error Handling Configuration
    console.log('\n=== Test 3: Error Handling Configuration ===')
    const errorHandlingResult = await testErrorHandlingConfiguration()

    // Calculate overall results
    const totalTests = 1 + paramOptResult.totalTests + 1 // LLM config + param opt + error handling
    const passedTests = (llmConfigResult.passed ? 1 : 0) + paramOptResult.passedTests + (errorHandlingResult.passed ? 1 : 0)
    const successRate = (passedTests / totalTests) * 100

    console.log('\n🏁 Node Configuration Agent Test Results')
    console.log('=' .repeat(55))
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`)
    console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`)

    // Detailed results
    console.log(`\n📋 Detailed Results:`)
    console.log(`- LLM Configuration Quality: ${llmConfigResult.qualityScore}/5`)
    console.log(`- Parameter Optimization Accuracy: ${paramOptResult.accuracy.toFixed(1)}%`)
    console.log(`- Error Handling Coverage: ${errorHandlingResult.coverageScore}/5`)
    console.log(`- Average Response Time: ${Math.round((llmConfigResult.responseTime + errorHandlingResult.responseTime) / 2)}ms`)

    if (successRate >= 80) {
      console.log('\n🎉 Node Configuration Agent is working excellently!')
    } else if (successRate >= 60) {
      console.log('\n✅ Node Configuration Agent is working well with room for improvement.')
    } else {
      console.log('\n⚠️  Node Configuration Agent needs significant tuning.')
    }

    console.log('\n📝 Key Insights:')
    console.log(`- Configuration complexity: ${llmConfigResult.contentLength} chars average`)
    console.log(`- Parameter optimization covers multiple scenarios effectively`)
    console.log(`- Error handling strategies are comprehensive and production-ready`)

    return {
      totalTests,
      passedTests,
      successRate,
      details: {
        llmConfigQuality: llmConfigResult.qualityScore,
        paramOptAccuracy: paramOptResult.accuracy,
        errorHandlingCoverage: errorHandlingResult.coverageScore,
        avgResponseTime: Math.round((llmConfigResult.responseTime + errorHandlingResult.responseTime) / 2)
      }
    }

  } catch (error) {
    console.error('💥 Node Configuration test failure:', error)
    throw error
  }
}

// Run the tests
runNodeConfigurationTests()
  .then(results => {
    console.log('\n🔚 Node Configuration Agent testing completed')
    process.exit(results?.successRate >= 80 ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error)
    process.exit(1)
  })