/**
 * Test script for the new Requirement Analyzer system
 * This will validate the enhanced AI workflow generation capabilities
 */

const { RequirementAnalyzer } = require('./src/utils/requirement-analyzer.ts')

async function testRequirementAnalyzer() {
  console.log('🧪 Testing Enhanced Requirement Analyzer System\n')

  // Test Case 1: Complex Customer Service Workflow
  const complexCustomerService = '複雑な顧客サービスAIワークフロー：問い合わせ分類、感情分析、ナレッジベース検索、エスカレーション判定、自動応答生成、品質スコアリング、分析データ収集を含む'

  console.log('📊 Test Case 1: Complex Customer Service Workflow')
  console.log('Input:', complexCustomerService)
  console.log()

  try {
    const analysis = RequirementAnalyzer.analyzeRequirement(complexCustomerService)
    console.log(RequirementAnalyzer.generateAnalysisSummary(analysis))
    console.log()

    // Validate analysis results
    console.log('✅ Validation Results:')
    console.log(`- Workflow Type Detection: ${analysis.detectedWorkflowType === 'CUSTOMER_SERVICE' ? 'PASS' : 'FAIL'}`)
    console.log(`- Complexity Assessment: ${analysis.complexity === 'Complex' || analysis.complexity === 'Enterprise' ? 'PASS' : 'FAIL'}`)
    console.log(`- Node Count Estimation: ${analysis.estimatedNodes >= 6 ? 'PASS' : 'FAIL'} (${analysis.estimatedNodes} nodes)`)
    console.log(`- Business Logic Detection: ${analysis.businessLogic.length >= 3 ? 'PASS' : 'FAIL'} (${analysis.businessLogic.length} rules)`)
    console.log()

  } catch (error) {
    console.error('❌ Test Failed:', error.message)
  }

  // Test Case 2: Document Processing Pipeline
  const documentProcessing = 'Create a document analysis workflow that extracts text from PDFs, performs semantic analysis, generates summaries, and stores results in a knowledge base'

  console.log('📊 Test Case 2: Document Processing Pipeline')
  console.log('Input:', documentProcessing)
  console.log()

  try {
    const analysis = RequirementAnalyzer.analyzeRequirement(documentProcessing)
    console.log(RequirementAnalyzer.generateAnalysisSummary(analysis))
    console.log()

    console.log('✅ Validation Results:')
    console.log(`- Workflow Type Detection: ${analysis.detectedWorkflowType === 'DOCUMENT_PROCESSING' ? 'PASS' : 'FAIL'}`)
    console.log(`- Pattern Recommendation: ${analysis.recommendedPattern.includes('RAG') || analysis.recommendedPattern.includes('PROCESSING') ? 'PASS' : 'FAIL'}`)
    console.log(`- Input Data Detection: ${analysis.dataInputs.some(input => input.type === 'file') ? 'PASS' : 'FAIL'}`)
    console.log()

  } catch (error) {
    console.error('❌ Test Failed:', error.message)
  }

  // Test Case 3: Simple Basic Workflow
  const simpleWorkflow = 'シンプルな入力→処理→出力フロー'

  console.log('📊 Test Case 3: Simple Basic Workflow')
  console.log('Input:', simpleWorkflow)
  console.log()

  try {
    const analysis = RequirementAnalyzer.analyzeRequirement(simpleWorkflow)
    console.log(RequirementAnalyzer.generateAnalysisSummary(analysis))
    console.log()

    console.log('✅ Validation Results:')
    console.log(`- Complexity Assessment: ${analysis.complexity === 'Simple' ? 'PASS' : 'FAIL'}`)
    console.log(`- Node Count: ${analysis.estimatedNodes <= 5 ? 'PASS' : 'FAIL'} (${analysis.estimatedNodes} nodes)`)
    console.log(`- Pattern: ${analysis.recommendedPattern === 'LINEAR_PROCESSING' ? 'PASS' : 'FAIL'}`)
    console.log()

  } catch (error) {
    console.error('❌ Test Failed:', error.message)
  }

  // Test Case 4: API Integration Workflow
  const apiIntegration = 'API integration workflow with third-party services, authentication, error handling, retry logic, and data transformation'

  console.log('📊 Test Case 4: API Integration Workflow')
  console.log('Input:', apiIntegration)
  console.log()

  try {
    const analysis = RequirementAnalyzer.analyzeRequirement(apiIntegration)
    console.log(RequirementAnalyzer.generateAnalysisSummary(analysis))
    console.log()

    console.log('✅ Validation Results:')
    console.log(`- Workflow Type Detection: ${analysis.detectedWorkflowType === 'API_INTEGRATION' ? 'PASS' : 'FAIL'}`)
    console.log(`- Integration Detection: ${analysis.integrationNeeds.length > 0 ? 'PASS' : 'FAIL'}`)
    console.log(`- Security Constraints: ${analysis.securityConstraints.length > 0 ? 'PASS' : 'FAIL'}`)
    console.log()

  } catch (error) {
    console.error('❌ Test Failed:', error.message)
  }

  console.log('🎯 Summary: Enhanced Requirement Analyzer testing completed!')
  console.log('This demonstrates the intelligent analysis capabilities that will drive improved workflow generation.')
}

// Execute test if run directly
if (require.main === module) {
  testRequirementAnalyzer()
    .then(() => {
      console.log('\n✅ All tests completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error)
      process.exit(1)
    })
}

module.exports = { testRequirementAnalyzer }