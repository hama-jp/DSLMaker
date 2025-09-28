#!/usr/bin/env node

/**
 * Visual test script for if-else branching and aggregator merging
 */

import fs from 'fs'

console.log('🧪 Testing Visual Branching and Merging Logic\n')

async function analyzeWorkflowStructure() {
  console.log('📋 Test 1: Analyzing Branching Workflow Structure')

  try {
    // Load our test workflow
    const workflowData = JSON.parse(fs.readFileSync('test-branching-workflow.json', 'utf8'))
    const { nodes, edges } = workflowData.workflow.graph

    console.log('📊 Workflow Analysis:')
    console.log(`- Total nodes: ${nodes.length}`)
    console.log(`- Total edges: ${edges.length}`)

    // Check for if-else node
    const ifElseNodes = nodes.filter(n =>
      n.type === 'if-else' || n.type === 'if_else'
    )
    console.log(`- If-else nodes: ${ifElseNodes.length}`)

    if (ifElseNodes.length > 0) {
      console.log('  📍 If-else node details:')
      ifElseNodes.forEach(node => {
        console.log(`    - ID: ${node.id}`)
        console.log(`    - Title: ${node.data.title}`)
        console.log(`    - Position: (${node.position.x}, ${node.position.y})`)
      })
    }

    // Check for aggregator nodes
    const aggregatorNodes = nodes.filter(n =>
      n.type === 'variable-aggregator' || n.type === 'variable_aggregator'
    )
    console.log(`- Aggregator nodes: ${aggregatorNodes.length}`)

    if (aggregatorNodes.length > 0) {
      console.log('  📍 Aggregator node details:')
      aggregatorNodes.forEach(node => {
        console.log(`    - ID: ${node.id}`)
        console.log(`    - Title: ${node.data.title}`)
        console.log(`    - Position: (${node.position.x}, ${node.position.y})`)
      })
    }

    // Check branching edges (true/false handles)
    const branchingEdges = edges.filter(e =>
      e.sourceHandle === 'true' || e.sourceHandle === 'false'
    )
    console.log(`- Branching edges: ${branchingEdges.length}`)

    if (branchingEdges.length > 0) {
      console.log('  🔗 Branching edge details:')
      branchingEdges.forEach(edge => {
        console.log(`    - ${edge.source} --[${edge.sourceHandle}]--> ${edge.target}`)
      })
    }

    // Check merging edges (input1, input2, input3 handles)
    const mergingEdges = edges.filter(e =>
      e.targetHandle && e.targetHandle.startsWith('input')
    )
    console.log(`- Merging edges: ${mergingEdges.length}`)

    if (mergingEdges.length > 0) {
      console.log('  🔗 Merging edge details:')
      mergingEdges.forEach(edge => {
        console.log(`    - ${edge.source} --[${edge.targetHandle}]--> ${edge.target}`)
      })
    }

    // Display complete flow
    console.log('\n🗺️  Complete Flow Path:')
    edges.forEach((edge, index) => {
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)
      const handleInfo = edge.sourceHandle !== 'output' || edge.targetHandle !== 'input'
        ? ` [${edge.sourceHandle || 'default'} → ${edge.targetHandle || 'default'}]`
        : ''
      console.log(`${index + 1}. ${sourceNode?.data.title}${handleInfo} → ${targetNode?.data.title}`)
    })

    // Validate workflow correctness
    console.log('\n✅ Validation Results:')

    // Check if if-else has 2 outputs
    const ifElseOutputs = edges.filter(e => e.source === 'condition-1').length
    console.log(`- If-else outputs: ${ifElseOutputs} ${ifElseOutputs === 2 ? '✅' : '❌ (should be 2)'}`)

    // Check if aggregator has 2 inputs
    const aggregatorInputs = edges.filter(e => e.target === 'aggregator-1').length
    console.log(`- Aggregator inputs: ${aggregatorInputs} ${aggregatorInputs === 2 ? '✅' : '❌ (should be 2)'}`)

    // Check handle types
    const hasCorrectBranchHandles = branchingEdges.some(e => e.sourceHandle === 'true') &&
                                   branchingEdges.some(e => e.sourceHandle === 'false')
    console.log(`- Correct branch handles: ${hasCorrectBranchHandles ? '✅' : '❌'}`)

    const hasCorrectMergeHandles = mergingEdges.some(e => e.targetHandle === 'input1') &&
                                  mergingEdges.some(e => e.targetHandle === 'input2')
    console.log(`- Correct merge handles: ${hasCorrectMergeHandles ? '✅' : '❌'}`)

    if (ifElseOutputs === 2 && aggregatorInputs === 2 && hasCorrectBranchHandles && hasCorrectMergeHandles) {
      console.log('\n🎉 Workflow structure is correct!')
      console.log('✅ Ready for visual testing at http://localhost:3008')
      console.log('📥 Import the test-branching-workflow.json file to see the visual result')
    } else {
      console.log('\n❌ Workflow structure has issues that need fixing')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

async function createImportInstructions() {
  console.log('\n📋 Test 2: Visual Testing Instructions')
  console.log('\n🎯 How to test the visual branching:')
  console.log('1. Open browser to http://localhost:3008')
  console.log('2. Click "Import DSL" button')
  console.log('3. Select the test-branching-workflow.json file')
  console.log('4. Verify the following visual elements:')
  console.log('   ✅ If-else node shows 2 output handles (green=true, red=false)')
  console.log('   ✅ Variable-aggregator node shows 3 input handles (input1, input2, input3)')
  console.log('   ✅ Edges connect properly between branch and merge points')
  console.log('   ✅ All nodes display with correct titles and styling')
  console.log('   ✅ Workflow layout is clean and readable')
  console.log('\n🔍 Expected visual result:')
  console.log('   Start → Extract → If-Else')
  console.log('                      ├─(true)─→ LLM Positive ─┐')
  console.log('                      └─(false)→ LLM Negative ─┤')
  console.log('                                                ├─→ Aggregator → Template → End')
  console.log('                                                ┘')
}

// Run tests
(async () => {
  try {
    await analyzeWorkflowStructure()
    await createImportInstructions()
    console.log('\n🎉 All structure tests completed!')
    console.log('📱 Now proceed with visual testing in the browser')
  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
    process.exit(1)
  }
})()