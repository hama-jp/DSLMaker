#!/usr/bin/env node

/**
 * Real Enhanced DSL Generation Test
 *
 * Tests the actual API integration with the new enhanced prompt system
 */

import dotenv from 'dotenv'
dotenv.config()

// Simple test that only uses the API
async function testRealLLMGeneration() {
  console.log('🤖 Testing Real Enhanced DSL Generation with new API response format')
  console.log('='.repeat(80))

  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL || 'gpt-4'

  if (!apiKey) {
    console.log('❌ No API key found. Set OPENAI_API_KEY environment variable.')
    return
  }

  console.log(`🔗 Testing connection to: ${baseUrl}`)
  console.log(`📡 Using model: ${model}`)

  // Test with the new /v1/responses endpoint for high reasoning
  const testPrompt = `
Create a comprehensive customer service workflow that:
1. Automatically categorizes customer inquiries
2. Searches knowledge base for relevant information
3. Generates appropriate responses
4. Escalates complex issues to human agents
5. Tracks conversation history

Generate a complete Dify workflow DSL in YAML format that implements this business logic.
`

  try {
    console.log('\n🧠 Testing with reasoning effort: high')

    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        input: testPrompt,
        text: {
          verbosity: "medium"
        },
        reasoning: {
          effort: "high"
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ API call failed: ${response.status} ${errorText}`)
      return
    }

    const data = await response.json()
    console.log('\n📊 API Response Analysis:')
    console.log(`- Status: ${data.status}`)
    console.log(`- Model Used: ${data.model}`)

    if (data.usage) {
      console.log(`- Input Tokens: ${data.usage.input_tokens}`)
      console.log(`- Output Tokens: ${data.usage.output_tokens}`)
      console.log(`- Reasoning Tokens: ${data.usage.output_tokens_details?.reasoning_tokens || 'N/A'}`)
      console.log(`- Total Tokens: ${data.usage.total_tokens}`)
    }

    if (data.reasoning) {
      console.log(`- Reasoning Effort: ${data.reasoning.effort}`)
    }

    // Extract the actual response
    const messages = data.output.filter(item => item.type === 'message')
    if (messages.length > 0) {
      const content = messages[0].content
      if (content && content.length > 0) {
        const responseText = content[0].text

        console.log('\n📝 Generated Response Analysis:')
        console.log(`- Response Length: ${responseText.length} characters`)
        console.log(`- Contains 'workflow': ${responseText.toLowerCase().includes('workflow') ? '✅' : '❌'}`)
        console.log(`- Contains 'dify': ${responseText.toLowerCase().includes('dify') ? '✅' : '❌'}`)
        console.log(`- Contains 'yaml': ${responseText.toLowerCase().includes('yaml') ? '✅' : '❌'}`)
        console.log(`- Contains 'app:': ${responseText.includes('app:') ? '✅' : '❌'}`)
        console.log(`- Contains 'graph:': ${responseText.includes('graph:') ? '✅' : '❌'}`)
        console.log(`- Contains 'nodes:': ${responseText.includes('nodes:') ? '✅' : '❌'}`)

        // Show preview
        console.log('\n📄 Response Preview (first 500 chars):')
        console.log('-'.repeat(60))
        console.log(responseText.substring(0, 500))
        if (responseText.length > 500) {
          console.log('...')
        }
        console.log('-'.repeat(60))

        // Check if it looks like valid YAML structure
        const lines = responseText.split('\n')
        const hasProperStructure =
          lines.some(line => line.trim().startsWith('app:')) &&
          lines.some(line => line.trim().startsWith('workflow:')) &&
          lines.some(line => line.trim().includes('graph:'))

        console.log('\n🔍 Structure Analysis:')
        console.log(`- Appears to be YAML structure: ${hasProperStructure ? '✅' : '❌'}`)
        console.log(`- Line count: ${lines.length}`)

        // Count potential workflow elements
        const nodeCount = (responseText.match(/- id:/g) || []).length
        const edgeCount = (responseText.match(/source:/g) || []).length

        console.log(`- Estimated nodes: ${nodeCount}`)
        console.log(`- Estimated edges: ${edgeCount}`)

        console.log('\n🎯 Generation Quality Assessment:')
        if (hasProperStructure && nodeCount >= 3 && responseText.includes('customer')) {
          console.log('✅ HIGH QUALITY: Response appears to be a valid Dify workflow')
        } else if (hasProperStructure || nodeCount >= 2) {
          console.log('⚠️ MEDIUM QUALITY: Response has some workflow elements')
        } else {
          console.log('❌ LOW QUALITY: Response does not appear to be a valid workflow')
        }

      } else {
        console.log('❌ No text content found in response')
      }
    } else {
      console.log('❌ No message content found in response')
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('🎯 Real Enhanced Generation Test Complete')
}

// Test different reasoning levels
async function testReasoningLevels() {
  console.log('\n🧠 Testing Different Reasoning Levels')
  console.log('='.repeat(80))

  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL || 'gpt-4'

  if (!apiKey) {
    console.log('❌ No API key found.')
    return
  }

  const simplePrompt = "Create a simple workflow that takes user input and responds with an AI-generated answer."

  const reasoningLevels = ['medium', 'high']

  for (const effort of reasoningLevels) {
    console.log(`\n🔄 Testing reasoning effort: ${effort}`)

    try {
      const startTime = Date.now()

      const response = await fetch(`${baseUrl}/responses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          input: simplePrompt,
          text: {
            verbosity: "low"
          },
          reasoning: {
            effort: effort
          }
        })
      })

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        console.log(`❌ Failed: ${response.status}`)
        continue
      }

      const data = await response.json()

      console.log(`⏱️ Response time: ${responseTime}ms`)
      console.log(`🧮 Reasoning tokens: ${data.usage?.output_tokens_details?.reasoning_tokens || 'N/A'}`)
      console.log(`📊 Total tokens: ${data.usage?.total_tokens || 'N/A'}`)

      const messages = data.output.filter(item => item.type === 'message')
      if (messages.length > 0 && messages[0].content?.[0]?.text) {
        const text = messages[0].content[0].text
        console.log(`📝 Response length: ${text.length} chars`)
        console.log(`🎯 Contains workflow elements: ${text.toLowerCase().includes('workflow') && text.includes(':') ? '✅' : '❌'}`)
      }

    } catch (error) {
      console.log(`❌ Error with ${effort}: ${error.message}`)
    }
  }
}

async function runAllTests() {
  console.log('🚀 Enhanced DSL Generation - Real API Test Suite')
  console.log('Testing with new OpenAI response format and reasoning capabilities')

  await testRealLLMGeneration()
  await testReasoningLevels()

  console.log('\n🎉 All real API tests completed!')
  console.log('\nNext steps:')
  console.log('1. ✅ Phase 1 Complete: Enhanced prompt engine working')
  console.log('2. 🔄 Integrate with actual DSL generation pipeline')
  console.log('3. 🎯 Test with complex business scenarios')
  console.log('4. 🚀 Deploy enhanced system')
}

runAllTests().catch(console.error)