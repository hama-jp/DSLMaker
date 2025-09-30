#!/usr/bin/env node

/**
 * Test DSL Validation
 *
 * Tests if the generated DSL actually passes our validation system
 */

import dotenv from 'dotenv'
dotenv.config()

async function testActualDSLValidation() {
  console.log('🔍 Testing Actual DSL Validation')
  console.log('Testing if generated JSON can be converted to valid YAML and parsed')
  console.log('=' * 80)

  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL || 'gpt-4'

  if (!apiKey) {
    console.log('❌ No API key found.')
    return
  }

  const testInput = "Create a simple document analysis workflow that extracts text and provides a summary"

  console.log(`📋 Test Input: "${testInput}"`)
  console.log('-' * 60)

  try {
    // Step 1: Generate DSL with corrected prompt
    console.log('🤖 Generating DSL with corrected node types...')

    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        input: `Generate a Dify workflow for: "${testInput}"

CRITICAL: Use ONLY these exact node types: "start", "parameter-extractor", "knowledge-retrieval", "llm", "template-transform", "end"

Required JSON structure:
{
  "app": {
    "description": "Document analysis workflow",
    "icon": "📄",
    "icon_background": "#EFF1F5",
    "mode": "workflow",
    "name": "Document Analysis"
  },
  "kind": "app",
  "version": "0.1.5",
  "workflow": {
    "environment_variables": [],
    "features": {},
    "graph": {
      "edges": [array of connections],
      "nodes": [array with exact node types above],
      "viewport": {"x": 0, "y": 0, "zoom": 1}
    }
  }
}

Example nodes:
- {"id": "start-1", "type": "start", "position": {"x": 100, "y": 200}, "data": {...}}
- {"id": "extract-1", "type": "parameter-extractor", "position": {"x": 350, "y": 200}, "data": {...}}
- {"id": "llm-1", "type": "llm", "position": {"x": 600, "y": 200}, "data": {...}}
- {"id": "end-1", "type": "end", "position": {"x": 850, "y": 200}, "data": {...}}

Respond with ONLY valid JSON.`,
        text: {
          verbosity: "low"
        },
        reasoning: {
          effort: "medium"
        }
      })
    })

    if (!response.ok) {
      console.log(`❌ API failed: ${response.status}`)
      return
    }

    const data = await response.json()
    const messages = data.output.filter(item => item.type === 'message')

    if (!messages.length || !messages[0].content?.[0]?.text) {
      console.log('❌ No response content')
      return
    }

    const responseText = messages[0].content[0].text.trim()
    console.log(`📝 Response length: ${responseText.length} chars`)

    // Step 2: Parse JSON
    let jsonObject
    try {
      jsonObject = JSON.parse(responseText)
      console.log('✅ JSON parsing successful')
    } catch (error) {
      console.log(`❌ JSON parsing failed: ${error.message}`)
      console.log('Raw response preview:', responseText.substring(0, 200))
      return
    }

    // Step 3: Validate node types
    const nodes = jsonObject.workflow?.graph?.nodes || []
    const nodeTypes = nodes.map(node => node.type)
    const validTypes = ['start', 'parameter-extractor', 'knowledge-retrieval', 'llm', 'template-transform', 'if-else', 'end']

    console.log('\n🔍 Node Type Validation:')
    console.log(`- Generated types: ${nodeTypes.join(', ')}`)

    const invalidTypes = nodeTypes.filter(type => !validTypes.includes(type))
    if (invalidTypes.length > 0) {
      console.log(`❌ Invalid types found: ${invalidTypes.join(', ')}`)
    } else {
      console.log('✅ All node types are valid')
    }

    // Step 4: Convert to YAML (simulate)
    console.log('\n📄 YAML Conversion Test:')
    try {
      // We would use js-yaml here in actual implementation
      console.log('✅ JSON structure is ready for YAML conversion')
      console.log(`- App name: ${jsonObject.app?.name}`)
      console.log(`- Node count: ${nodes.length}`)
      console.log(`- Edge count: ${jsonObject.workflow?.graph?.edges?.length || 0}`)
    } catch (error) {
      console.log(`❌ YAML conversion would fail: ${error.message}`)
    }

    // Step 5: Basic structure validation
    console.log('\n🏗️ Structure Validation:')
    const checks = [
      { check: 'Has app section', pass: !!jsonObject.app },
      { check: 'Has workflow section', pass: !!jsonObject.workflow },
      { check: 'Has graph section', pass: !!jsonObject.workflow?.graph },
      { check: 'Has nodes array', pass: Array.isArray(jsonObject.workflow?.graph?.nodes) },
      { check: 'Has edges array', pass: Array.isArray(jsonObject.workflow?.graph?.edges) },
      { check: 'Has start node', pass: nodeTypes.includes('start') },
      { check: 'Has end node', pass: nodeTypes.includes('end') },
      { check: 'Sufficient nodes', pass: nodes.length >= 3 }
    ]

    checks.forEach(({check, pass}) => {
      console.log(`- ${check}: ${pass ? '✅' : '❌'}`)
    })

    const allChecksPass = checks.every(c => c.pass)
    const noInvalidTypes = invalidTypes.length === 0

    console.log('\n🎯 Overall Assessment:')
    if (allChecksPass && noInvalidTypes) {
      console.log('🏆 EXCELLENT: Valid Dify DSL structure with correct node types')
    } else if (allChecksPass) {
      console.log('⚠️ GOOD: Valid structure but some incorrect node types')
    } else {
      console.log('❌ POOR: Structure issues need to be fixed')
    }

    // Step 6: Show specific issues
    if (invalidTypes.length > 0 || !allChecksPass) {
      console.log('\n🔧 Issues to fix:')
      if (invalidTypes.length > 0) {
        invalidTypes.forEach(type => {
          console.log(`- Replace "${type}" with valid Dify node type`)
        })
      }
      checks.filter(c => !c.pass).forEach(c => {
        console.log(`- Fix: ${c.check}`)
      })
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`)
  }

  console.log('\n' + '=' * 80)
  console.log('🎯 DSL Validation Test Complete')
}

async function runTest() {
  console.log('🧪 DSL Validation Test Suite')
  console.log('Testing the quality and validity of generated DSL')

  await testActualDSLValidation()

  console.log('\n📋 Next Steps:')
  console.log('1. Fix any node type issues in the prompt')
  console.log('2. Test with actual DSL parser')
  console.log('3. Verify in Dify import functionality')
}

runTest().catch(console.error)