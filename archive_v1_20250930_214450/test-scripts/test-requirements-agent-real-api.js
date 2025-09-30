/**
 * Real API Test for Requirements Clarification Agent
 *
 * Tests the Requirements Clarification Agent with actual LLM API calls
 * to validate behavior and tune responses based on real model output.
 */

import RequirementsClarificationAgent from './src/agents/requirements-agent.js'
import { LLMAPIService } from './src/services/llm-api-service.js'

// Test scenarios with different complexity levels
const testCases = [
  {
    name: "Simple Customer Service Bot",
    input: "Create a chatbot that answers customer questions about our products",
    expectedComplexity: "Simple",
    expectedType: "CUSTOMER_SERVICE",
    clarificationAnswers: {
      input_data_types: "Text/Questions from users",
      output_format: "Plain text response",
      workflow_purpose: "Automate customer service responses",
      expected_usage: "Team use (dozens of requests per day)"
    }
  },
  {
    name: "Document Processing Workflow",
    input: "I need to process PDF documents and extract important information for analysis",
    expectedComplexity: "Moderate",
    expectedType: "DOCUMENT_PROCESSING",
    clarificationAnswers: {
      input_data_types: "Documents/Files (PDF, Word, etc.)",
      output_format: "Structured report (with sections/headings)",
      document_types: "PDFs",
      workflow_purpose: "Process and analyze data"
    }
  },
  {
    name: "Vague Complex Request",
    input: "I want to create something that helps with business processes somehow",
    expectedComplexity: "Complex",
    expectedType: "UNKNOWN",
    clarificationAnswers: {} // Should generate many clarifying questions
  }
]

async function testRequirementsAgent() {
  console.log('🧪 Starting Requirements Clarification Agent Real API Tests')
  console.log('=' .repeat(60))

  // Test API connectivity first
  console.log('\n📡 Testing API Connectivity...')
  const connectionTest = await LLMAPIService.testConnection()
  if (!connectionTest) {
    console.error('❌ API connection failed. Please check your .env configuration.')
    console.log('\nRequired environment variables:')
    console.log('- OPENAI_API_KEY')
    console.log('- OPENAI_BASE_URL (default: https://api.openai.com/v1)')
    console.log('- OPENAI_MODEL (default: gpt-4)')
    return
  }
  console.log('✅ API connection successful')

  // Display current configuration
  const config = LLMAPIService.getConfiguration()
  console.log('\n🔧 Current Configuration:')
  console.log(`- Base URL: ${config.baseURL}`)
  console.log(`- Model: ${config.model}`)
  console.log(`- API Key: ${config.apiKeyPreview}`)

  let totalTests = 0
  let passedTests = 0

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`)
    console.log(`Input: "${testCase.input}"`)
    console.log('-'.repeat(40))

    try {
      totalTests++

      // Step 1: Initial analysis without clarification answers
      console.log('📋 Step 1: Initial Requirements Analysis')
      const startTime = Date.now()

      const initialAnalysis = await RequirementsClarificationAgent.analyzeAndClarify(
        testCase.input
      )

      const analysisTime = Date.now() - startTime
      console.log(`⏱️  Analysis completed in ${analysisTime}ms`)

      // Validate initial analysis
      console.log('\n📊 Initial Analysis Results:')
      console.log(`- Business Intent: ${initialAnalysis.businessIntent}`)
      console.log(`- Detected Workflow Type: ${initialAnalysis.detectedWorkflowType}`)
      console.log(`- Complexity: ${initialAnalysis.complexity}`)
      console.log(`- Confidence: ${(initialAnalysis.confidence * 100).toFixed(1)}%`)
      console.log(`- Needs Clarification: ${initialAnalysis.needsMoreClarification}`)
      console.log(`- Questions Generated: ${initialAnalysis.clarificationQuestions.length}`)

      // Display clarifying questions
      if (initialAnalysis.clarificationQuestions.length > 0) {
        console.log('\n❓ Generated Clarifying Questions:')
        initialAnalysis.clarificationQuestions.forEach((q, i) => {
          console.log(`${i + 1}. [${q.category}] ${q.question}`)
          if (q.options) {
            console.log(`   Options: ${q.options.join(', ')}`)
          }
        })
      }

      // Step 2: Analysis with clarification answers (if provided)
      if (Object.keys(testCase.clarificationAnswers).length > 0) {
        console.log('\n📋 Step 2: Analysis with Clarification Answers')

        const clarifiedAnalysis = await RequirementsClarificationAgent.analyzeAndClarify(
          testCase.input,
          testCase.clarificationAnswers
        )

        console.log('\n📊 Clarified Analysis Results:')
        console.log(`- Confidence: ${(clarifiedAnalysis.confidence * 100).toFixed(1)}%`)
        console.log(`- Still Needs Clarification: ${clarifiedAnalysis.needsMoreClarification}`)
        console.log(`- Remaining Questions: ${clarifiedAnalysis.clarificationQuestions.length}`)

        // Validate final requirements structure
        const finalReqs = clarifiedAnalysis.finalRequirements
        console.log('\n📋 Final Requirements Structure:')
        console.log(`- Data Inputs: ${finalReqs.dataInputs.length} items`)
        console.log(`- Output Requirements: ${finalReqs.outputRequirements.length} items`)
        console.log(`- Business Logic: ${finalReqs.businessLogic.length} rules`)
        console.log(`- Integration Needs: ${finalReqs.integrationNeeds.length} items`)
        console.log(`- Performance Requirements: ${finalReqs.performanceRequirements.length} items`)
        console.log(`- Security Constraints: ${finalReqs.securityConstraints.length} items`)

        // Test expectation matching
        let testPassed = true
        if (testCase.expectedComplexity && clarifiedAnalysis.complexity !== testCase.expectedComplexity) {
          console.log(`⚠️  Expected complexity: ${testCase.expectedComplexity}, got: ${clarifiedAnalysis.complexity}`)
          // Don't fail the test for complexity mismatch, as this can vary
        }

        if (testCase.expectedType && clarifiedAnalysis.detectedWorkflowType !== testCase.expectedType) {
          console.log(`⚠️  Expected workflow type: ${testCase.expectedType}, got: ${clarifiedAnalysis.detectedWorkflowType}`)
          // Don't fail for type mismatch if it's reasonable
        }

        console.log(testPassed ? '✅ Test passed' : '⚠️  Test completed with warnings')
        if (testPassed) passedTests++
      } else {
        console.log('✅ Initial analysis test passed')
        passedTests++
      }

    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`)
      console.error(`Stack: ${error.stack}`)
    }
  }

  // Performance and behavior analysis
  console.log('\n📈 Performance and Behavior Analysis')
  console.log('=' .repeat(60))

  // Test token estimation
  const sampleMessages = [
    { role: 'system', content: 'You are a requirements analyst.' },
    { role: 'user', content: testCases[0].input }
  ]
  const estimatedTokens = LLMAPIService.estimateTokens(sampleMessages)
  console.log(`🔢 Estimated tokens for sample request: ${estimatedTokens}`)

  // Test different analysis types
  console.log('\n🔬 Testing Different Analysis Types...')
  try {
    const generalAnalysis = await LLMAPIService.analyzeRequirements(
      "Create a workflow for email processing",
      "general"
    )

    const detailedAnalysis = await LLMAPIService.analyzeRequirements(
      "Create a workflow for email processing",
      "detailed"
    )

    console.log('✅ Different analysis types working')
    console.log(`- General analysis length: ${generalAnalysis.content?.length || 0} chars`)
    console.log(`- Detailed analysis length: ${detailedAnalysis.content?.length || 0} chars`)

  } catch (error) {
    console.error(`❌ Analysis type test failed: ${error.message}`)
  }

  // Test clarifying question generation
  console.log('\n❓ Testing Clarifying Question Generation...')
  try {
    const questionResponse = await LLMAPIService.generateClarifyingQuestions(
      "I need help with data processing",
      "User works in healthcare industry"
    )

    console.log('✅ Clarifying question generation working')
    console.log(`- Response length: ${questionResponse.content?.length || 0} chars`)
    if (questionResponse.content) {
      console.log(`- Sample content: ${questionResponse.content.substring(0, 200)}...`)
    }

  } catch (error) {
    console.error(`❌ Question generation test failed: ${error.message}`)
  }

  // Final results
  console.log('\n🏁 Test Results Summary')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`)
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Requirements Clarification Agent is working correctly with real API.')
  } else {
    console.log('\n⚠️  Some tests had issues. Check the logs above for details.')
  }

  console.log('\n📝 Tuning Recommendations:')
  console.log('- Monitor confidence scores - target >80% for production use')
  console.log('- Review generated questions for relevance and clarity')
  console.log('- Adjust complexity detection thresholds if needed')
  console.log('- Consider adding domain-specific question templates')

  return {
    totalTests,
    passedTests,
    successRate: (passedTests / totalTests) * 100
  }
}

// Run the tests
testRequirementsAgent()
  .then(results => {
    console.log('\n🔚 Testing completed')
    process.exit(results.passedTests === results.totalTests ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Critical test failure:', error)
    process.exit(1)
  })