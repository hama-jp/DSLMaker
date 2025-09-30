#!/usr/bin/env node

/**
 * Test script for if-else branching and variable-aggregator merging logic
 */

// Simple test using the actual application
// We'll test via API calls to the running dev server

console.log('🧪 Testing Branching and Merging Logic\n')

async function testBranchingWorkflow() {
  console.log('📋 Test 1: Customer Service with Sentiment-based Branching')

  const requirement = `
Create a customer service workflow that:
1. Analyzes customer sentiment from input
2. If sentiment is positive (>0.7), route to positive response path
3. If sentiment is negative (<=0.7), route to escalation path
4. Both paths should merge at the end for final response formatting
5. Use parameter-extractor for sentiment analysis
6. Use if-else for branching
7. Use variable-aggregator to merge the paths
8. Use template-transform for final formatting
  `

  try {
    console.log('🔄 Generating workflow with branching...')
    const result = await generateWorkflowFromRequirement(requirement)

    if (result.success && result.data) {
      const workflow = result.data.workflow.graph

      console.log('📊 Analysis Results:')
      console.log(`- Total nodes: ${workflow.nodes.length}`)
      console.log(`- Total edges: ${workflow.edges.length}`)

      // Check for if-else node
      const ifElseNodes = workflow.nodes.filter(n =>
        n.type === 'if-else' || n.type === 'if_else'
      )
      console.log(`- If-else nodes: ${ifElseNodes.length}`)

      // Check for aggregator nodes
      const aggregatorNodes = workflow.nodes.filter(n =>
        n.type === 'variable-aggregator' || n.type === 'variable_aggregator'
      )
      console.log(`- Aggregator nodes: ${aggregatorNodes.length}`)

      // Check branching edges
      const branchingEdges = workflow.edges.filter(e =>
        e.sourceHandle === 'true' || e.sourceHandle === 'false'
      )
      console.log(`- Branching edges: ${branchingEdges.length}`)

      // Check merging edges
      const mergingEdges = workflow.edges.filter(e =>
        e.targetHandle && e.targetHandle.startsWith('input')
      )
      console.log(`- Merging edges: ${mergingEdges.length}`)

      // Display edge details
      console.log('\n🔗 Edge Analysis:')
      workflow.edges.forEach((edge, index) => {
        const sourceNode = workflow.nodes.find(n => n.id === edge.source)
        const targetNode = workflow.nodes.find(n => n.id === edge.target)
        console.log(`${index + 1}. ${sourceNode?.type}(${edge.sourceHandle || 'default'}) → ${targetNode?.type}(${edge.targetHandle || 'default'})`)
      })

      // Save result
      const timestamp = Date.now()
      const filename = `temp-files/branching-test-${timestamp}.json`

      await import('fs').then(fs => {
        fs.writeFileSync(filename, JSON.stringify(result.data, null, 2))
        console.log(`\n💾 Saved to: ${filename}`)
      })

      console.log('\n✅ Branching workflow generation completed!')

    } else {
      console.error('❌ Failed to generate workflow:', result.error)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

async function testValidation() {
  console.log('\n📋 Test 2: Validation of Branching Logic')

  // Test workflow with proper branching
  const mockWorkflow = {
    nodes: [
      { id: 'start-1', type: 'start' },
      { id: 'extract-1', type: 'parameter-extractor' },
      { id: 'condition-1', type: 'if-else' },
      { id: 'llm-positive', type: 'llm' },
      { id: 'llm-negative', type: 'llm' },
      { id: 'aggregator-1', type: 'variable-aggregator' },
      { id: 'end-1', type: 'end' }
    ],
    edges: [
      { source: 'start-1', target: 'extract-1' },
      { source: 'extract-1', target: 'condition-1' },
      { source: 'condition-1', target: 'llm-positive', sourceHandle: 'true' },
      { source: 'condition-1', target: 'llm-negative', sourceHandle: 'false' },
      { source: 'llm-positive', target: 'aggregator-1', targetHandle: 'input1' },
      { source: 'llm-negative', target: 'aggregator-1', targetHandle: 'input2' },
      { source: 'aggregator-1', target: 'end-1' }
    ]
  }

  try {
    const { validateWorkflow } = await import('./src/utils/dsl-parser.js')
    const result = validateWorkflow({
      workflow: {
        graph: mockWorkflow
      }
    })

    console.log('🔍 Validation Results:')
    console.log(`- Valid: ${result.isValid}`)
    console.log(`- Errors: ${result.errors.length}`)
    console.log(`- Warnings: ${result.warnings.length}`)

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:')
      result.errors.forEach((error, i) => console.log(`${i + 1}. ${error}`))
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      result.warnings.forEach((warning, i) => console.log(`${i + 1}. ${warning}`))
    }

    if (result.isValid) {
      console.log('\n✅ Branching/merging validation passed!')
    }

  } catch (error) {
    console.error('❌ Validation test failed:', error.message)
  }
}

// Run tests
(async () => {
  try {
    await testBranchingWorkflow()
    await testValidation()
    console.log('\n🎉 All branching logic tests completed!')
  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
    process.exit(1)
  }
})()