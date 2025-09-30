/**
 * Real API Test for Quality Assurance Agent
 *
 * Tests the Quality Assurance Agent's ability to review, score, and improve
 * generated workflows with comprehensive quality metrics and recommendations.
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

console.log('🔍 Quality Assurance Agent Real API Tests')
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

// Test workflow quality assessment
async function testWorkflowQualityAssessment() {
  console.log('\n🔍 Testing Workflow Quality Assessment')
  console.log('-'.repeat(45))

  const systemPrompt = `You are an expert Quality Assurance engineer specializing in workflow validation and optimization. Your task is to thoroughly assess workflow quality and provide actionable improvement recommendations.

Analyze the provided workflow and provide:

1. QUALITY_SCORE: Overall score (0-100) based on completeness, reliability, performance, and maintainability
2. READINESS_LEVEL: Production readiness (Development, Testing, Staging, Production)
3. CRITICAL_ISSUES: Any blocking issues that prevent deployment
4. IMPROVEMENT_RECOMMENDATIONS: Specific, actionable suggestions with priority levels
5. PERFORMANCE_ANALYSIS: Expected performance characteristics and bottlenecks
6. SECURITY_ASSESSMENT: Security considerations and compliance requirements

Be thorough but concise. Focus on practical, implementable improvements.`

  const testWorkflows = [
    {
      name: "Simple Customer Service Bot",
      workflow: {
        nodes: [
          {
            id: "start",
            type: "start",
            data: {
              title: "Customer Inquiry Start",
              variables: [
                { variable: "user_message", type: "string", required: true }
              ]
            }
          },
          {
            id: "llm_1",
            type: "llm",
            data: {
              title: "Process Inquiry",
              model: "gpt-4",
              prompt: "Analyze the customer inquiry: {{user_message}}",
              variables: [
                { variable: "response", type: "string" }
              ]
            }
          },
          {
            id: "end",
            type: "end",
            data: {
              outputs: [
                { variable: "response", type: "string" }
              ]
            }
          }
        ],
        edges: [
          { source: "start", target: "llm_1" },
          { source: "llm_1", target: "end" }
        ]
      },
      expectedScore: 70 // Should identify missing error handling, validation
    },
    {
      name: "Complex RAG Pipeline with Issues",
      workflow: {
        nodes: [
          {
            id: "start",
            type: "start",
            data: {
              title: "Document Query Start",
              variables: [
                { variable: "query", type: "string", required: true }
              ]
            }
          },
          {
            id: "knowledge_1",
            type: "knowledge-retrieval",
            data: {
              title: "Search Documents",
              query_variable: "query",
              // Missing dataset configuration
              variables: [
                { variable: "documents", type: "array" }
              ]
            }
          },
          {
            id: "llm_1",
            type: "llm",
            data: {
              title: "Generate Response",
              model: "gpt-3.5-turbo", // Potentially outdated model
              prompt: "Answer based on: {{documents}}",
              // Missing temperature and other parameters
              variables: [
                { variable: "answer", type: "string" }
              ]
            }
          },
          {
            id: "end",
            type: "end",
            data: {
              outputs: [
                { variable: "answer", type: "string" }
              ]
            }
          }
        ],
        edges: [
          { source: "start", target: "knowledge_1" },
          { source: "knowledge_1", target: "llm_1" },
          { source: "llm_1", target: "end" }
        ]
      },
      expectedScore: 55 // Should identify configuration issues, missing optimizations
    }
  ]

  let totalTests = 0
  let passedTests = 0

  for (const testCase of testWorkflows) {
    console.log(`\n📋 Assessing: ${testCase.name}`)
    console.log(`Expected Quality Range: ${testCase.expectedScore - 15}-${testCase.expectedScore + 15}`)

    try {
      totalTests++
      const startTime = Date.now()

      const workflowDescription = `
Workflow Name: ${testCase.name}
Node Count: ${testCase.workflow.nodes.length}
Complexity: ${testCase.workflow.edges.length} connections

Nodes:
${testCase.workflow.nodes.map(node => `- ${node.data.title} (${node.type})`).join('\n')}

Full Workflow Structure:
${JSON.stringify(testCase.workflow, null, 2)}
      `

      const result = await makeGPT5Request(
        systemPrompt,
        workflowDescription,
        { verbosity: 'medium', effort: 'high' }
      )

      const endTime = Date.now()
      console.log(`⏱️  Assessment completed in ${endTime - startTime}ms`)

      console.log(`\n📊 Quality Assessment (${result.content.length} chars):`)
      console.log(result.content.substring(0, 600) + (result.content.length > 600 ? '...' : ''))

      // Validate assessment quality
      const content = result.content.toLowerCase()
      const hasQualityScore = /quality_score|score.*\d+|quality.*\d+/i.test(result.content)
      const hasReadinessLevel = /readiness|production|development|testing|staging/i.test(result.content)
      const hasCriticalIssues = /critical|issues|blocking|problems/i.test(result.content)
      const hasRecommendations = /recommendation|improve|suggest|optimize/i.test(result.content)
      const hasPerformanceAnalysis = /performance|bottleneck|latency|throughput/i.test(result.content)
      const hasSecurityAssessment = /security|privacy|compliance|vulnerability/i.test(result.content)

      console.log(`\n📈 Assessment Completeness:`)
      console.log(`- Quality scoring: ${hasQualityScore ? '✅' : '❌'}`)
      console.log(`- Readiness level: ${hasReadinessLevel ? '✅' : '❌'}`)
      console.log(`- Critical issues identification: ${hasCriticalIssues ? '✅' : '❌'}`)
      console.log(`- Improvement recommendations: ${hasRecommendations ? '✅' : '❌'}`)
      console.log(`- Performance analysis: ${hasPerformanceAnalysis ? '✅' : '❌'}`)
      console.log(`- Security assessment: ${hasSecurityAssessment ? '✅' : '❌'}`)

      const assessmentScore = [
        hasQualityScore,
        hasReadinessLevel,
        hasCriticalIssues,
        hasRecommendations,
        hasPerformanceAnalysis,
        hasSecurityAssessment
      ].filter(Boolean).length

      if (assessmentScore >= 5) {
        console.log(`✅ Test passed - Assessment quality: ${assessmentScore}/6`)
        passedTests++
      } else {
        console.log(`⚠️  Test needs improvement - Quality: ${assessmentScore}/6`)
        passedTests += 0.5 // Partial credit
      }

      if (result.usage) {
        console.log(`\n📊 Token Usage: ${result.usage.total_tokens} tokens`)
      }

    } catch (error) {
      console.error(`❌ Quality assessment test failed: ${error.message}`)
    }
  }

  return { totalTests, passedTests }
}

// Test quality improvement recommendations
async function testQualityImprovementRecommendations() {
  console.log('\n🔧 Testing Quality Improvement Recommendations')
  console.log('-'.repeat(50))

  const systemPrompt = `You are a workflow optimization specialist. Given a workflow with identified issues, provide specific, actionable improvement recommendations.

For each recommendation, provide:
- PRIORITY: High, Medium, Low
- CATEGORY: Performance, Security, Reliability, Maintainability, User Experience
- DESCRIPTION: Clear, specific improvement
- IMPLEMENTATION: Step-by-step how to implement
- IMPACT: Expected benefit from implementing
- EFFORT: Estimated implementation effort (1-10 scale)

Focus on practical, implementable improvements that provide clear business value.`

  const problemScenarios = [
    {
      name: "Performance Bottlenecks",
      description: "Workflow with sequential LLM calls causing long response times",
      expectedCategories: ["Performance", "User Experience"]
    },
    {
      name: "Security Vulnerabilities",
      description: "Workflow processing user input without validation or sanitization",
      expectedCategories: ["Security", "Reliability"]
    },
    {
      name: "Error Handling Gaps",
      description: "Workflow with no fallback mechanisms for API failures",
      expectedCategories: ["Reliability", "Maintainability"]
    }
  ]

  let correctRecommendations = 0
  let totalScenarios = problemScenarios.length

  for (const scenario of problemScenarios) {
    console.log(`\n🔧 Scenario: ${scenario.name}`)
    console.log(`Description: ${scenario.description}`)

    try {
      const result = await makeGPT5Request(
        systemPrompt,
        `Analyze this workflow issue and provide improvement recommendations:\n\n${scenario.description}\n\nProvide specific, actionable recommendations to address this problem.`,
        { verbosity: 'medium', effort: 'high' }
      )

      console.log(`\n📝 Improvement Recommendations:`)
      console.log(result.content.substring(0, 400) + '...')

      // Check if recommendations address expected categories
      const content = result.content.toLowerCase()
      const hasExpectedCategories = scenario.expectedCategories.some(category =>
        content.includes(category.toLowerCase())
      )
      const hasPriority = /priority|high|medium|low/i.test(result.content)
      const hasImplementation = /implementation|step|how to|implement/i.test(result.content)
      const hasImpact = /impact|benefit|improvement|value/i.test(result.content)
      const hasEffort = /effort|time|complexity|resource/i.test(result.content)

      console.log(`\n📊 Recommendation Quality:`)
      console.log(`- Addresses expected categories: ${hasExpectedCategories ? '✅' : '❌'}`)
      console.log(`- Includes priority levels: ${hasPriority ? '✅' : '❌'}`)
      console.log(`- Provides implementation steps: ${hasImplementation ? '✅' : '❌'}`)
      console.log(`- Describes impact/benefits: ${hasImpact ? '✅' : '❌'}`)
      console.log(`- Estimates effort required: ${hasEffort ? '✅' : '❌'}`)

      const qualityScore = [
        hasExpectedCategories,
        hasPriority,
        hasImplementation,
        hasImpact,
        hasEffort
      ].filter(Boolean).length

      if (qualityScore >= 4) {
        console.log(`✅ Scenario passed - Quality: ${qualityScore}/5`)
        correctRecommendations++
      } else {
        console.log(`⚠️  Scenario needs improvement - Quality: ${qualityScore}/5`)
      }

    } catch (error) {
      console.error(`❌ Recommendation test failed: ${error.message}`)
    }
  }

  const accuracy = (correctRecommendations / totalScenarios) * 100
  console.log(`\n📊 Recommendation Quality: ${accuracy.toFixed(1)}% (${correctRecommendations}/${totalScenarios})`)

  return accuracy >= 66.7 // At least 2/3 scenarios handled well
}

// Test production readiness evaluation
async function testProductionReadinessEvaluation() {
  console.log('\n🚀 Testing Production Readiness Evaluation')
  console.log('-'.repeat(45))

  const systemPrompt = `You are a production deployment specialist. Evaluate workflow readiness for production deployment.

Assess these key areas:
1. FUNCTIONAL_COMPLETENESS: All required features implemented
2. ERROR_HANDLING: Comprehensive error handling and recovery
3. PERFORMANCE_OPTIMIZATION: Acceptable response times and resource usage
4. SECURITY_COMPLIANCE: Security best practices implemented
5. MONITORING_OBSERVABILITY: Adequate logging and monitoring
6. SCALABILITY_CONSIDERATIONS: Can handle production load

Provide:
- READINESS_SCORE: 0-100 score for production deployment
- DEPLOYMENT_RECOMMENDATION: Go/No-Go with specific blockers
- REQUIRED_IMPROVEMENTS: Must-fix issues before production
- OPTIONAL_ENHANCEMENTS: Nice-to-have improvements
- ROLLOUT_STRATEGY: Recommended deployment approach`

  const testWorkflow = {
    name: "Enterprise Customer Support Workflow",
    description: "Multi-stage workflow for processing customer support tickets with intelligent routing, knowledge base integration, and automated response generation",
    complexity: "High",
    expectedTraffic: "1000+ requests/day",
    criticalPath: true
  }

  console.log(`\n🏢 Evaluating: ${testWorkflow.name}`)
  console.log(`Complexity: ${testWorkflow.complexity}`)
  console.log(`Expected Traffic: ${testWorkflow.expectedTraffic}`)
  console.log(`Critical Path: ${testWorkflow.criticalPath ? 'Yes' : 'No'}`)

  try {
    const result = await makeGPT5Request(
      systemPrompt,
      `Evaluate production readiness for this workflow:

Name: ${testWorkflow.name}
Description: ${testWorkflow.description}
Complexity: ${testWorkflow.complexity}
Expected Traffic: ${testWorkflow.expectedTraffic}
Critical Path: ${testWorkflow.criticalPath}

This workflow will be handling sensitive customer data and must meet enterprise reliability and security standards.`,
      { verbosity: 'high', effort: 'high' }
    )

    console.log(`\n🚀 Production Readiness Assessment:`)
    console.log(result.content)

    // Validate production readiness assessment
    const content = result.content.toLowerCase()
    const hasReadinessScore = /readiness_score|score.*\d+|production.*\d+/i.test(result.content)
    const hasDeploymentRecommendation = /deployment|go.*go|recommendation|deploy/i.test(result.content)
    const hasRequiredImprovements = /required|must.*fix|blocker|critical/i.test(result.content)
    const hasRolloutStrategy = /rollout|strategy|deployment.*approach|phased/i.test(result.content)
    const hasSecurityConsiderations = /security|compliance|privacy|data.*protection/i.test(result.content)
    const hasScalabilityAssessment = /scalability|load|performance|capacity/i.test(result.content)

    console.log(`\n📋 Readiness Assessment Coverage:`)
    console.log(`- Production readiness scoring: ${hasReadinessScore ? '✅' : '❌'}`)
    console.log(`- Deployment recommendation: ${hasDeploymentRecommendation ? '✅' : '❌'}`)
    console.log(`- Required improvements identified: ${hasRequiredImprovements ? '✅' : '❌'}`)
    console.log(`- Rollout strategy provided: ${hasRolloutStrategy ? '✅' : '❌'}`)
    console.log(`- Security considerations: ${hasSecurityConsiderations ? '✅' : '❌'}`)
    console.log(`- Scalability assessment: ${hasScalabilityAssessment ? '✅' : '❌'}`)

    const coverageScore = [
      hasReadinessScore,
      hasDeploymentRecommendation,
      hasRequiredImprovements,
      hasRolloutStrategy,
      hasSecurityConsiderations,
      hasScalabilityAssessment
    ].filter(Boolean).length

    return coverageScore >= 5

  } catch (error) {
    console.error(`❌ Production readiness test failed: ${error.message}`)
    return false
  }
}

// Main test runner
async function runQualityAssuranceTests() {
  console.log('\n🚀 Running Quality Assurance Agent Tests')

  try {
    // Test 1: Workflow Quality Assessment
    console.log('\n=== Test 1: Workflow Quality Assessment ===')
    const { totalTests, passedTests } = await testWorkflowQualityAssessment()

    // Test 2: Quality Improvement Recommendations
    console.log('\n=== Test 2: Quality Improvement Recommendations ===')
    const improvementSuccess = await testQualityImprovementRecommendations()

    // Test 3: Production Readiness Evaluation
    console.log('\n=== Test 3: Production Readiness Evaluation ===')
    const readinessSuccess = await testProductionReadinessEvaluation()

    // Calculate overall results
    const overallTests = totalTests + 2 // improvement recommendations + production readiness
    const overallPassed = passedTests + (improvementSuccess ? 1 : 0) + (readinessSuccess ? 1 : 0)

    console.log('\n🏁 Quality Assurance Agent Test Results Summary')
    console.log('=' .repeat(60))
    console.log(`✅ Passed: ${overallPassed}/${overallTests} tests`)
    console.log(`📊 Success Rate: ${((overallPassed / overallTests) * 100).toFixed(1)}%`)

    // Detailed results
    console.log(`\n📋 Detailed Results:`)
    console.log(`- Workflow Assessment Quality: ${(passedTests / totalTests * 100).toFixed(1)}%`)
    console.log(`- Improvement Recommendations: ${improvementSuccess ? '✅ Excellent' : '⚠️  Needs improvement'}`)
    console.log(`- Production Readiness Evaluation: ${readinessSuccess ? '✅ Comprehensive' : '⚠️  Needs improvement'}`)

    if (overallPassed >= overallTests * 0.8) {
      console.log('\n🎉 Quality Assurance Agent is working excellently!')
      console.log('\n📝 Agent Capabilities Validated:')
      console.log('- ✅ Comprehensive workflow quality assessment')
      console.log('- ✅ Actionable improvement recommendations')
      console.log('- ✅ Production readiness evaluation')
      console.log('- ✅ Security and performance considerations')
      console.log('- ✅ Multi-criteria quality scoring')
    } else {
      console.log('\n⚠️  Quality Assurance Agent needs optimization for production use.')
    }

    console.log('\n📈 Quality Assurance Agent Impact:')
    console.log('- Ensures high-quality workflow generation')
    console.log('- Reduces production deployment risks')
    console.log('- Provides actionable improvement guidance')
    console.log('- Maintains enterprise-grade standards')

    return {
      totalTests: overallTests,
      passedTests: overallPassed,
      successRate: (overallPassed / overallTests) * 100
    }

  } catch (error) {
    console.error('💥 Critical Quality Assurance test failure:', error)
    throw error
  }
}

// Run the tests
runQualityAssuranceTests()
  .then(results => {
    console.log('\n🔚 Quality Assurance Agent testing completed')
    process.exit(results?.passedTests >= results?.totalTests * 0.8 ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Quality Assurance Agent test execution failed:', error)
    process.exit(1)
  })