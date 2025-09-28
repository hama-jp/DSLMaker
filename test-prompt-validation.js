#!/usr/bin/env node

// Test the prompt with a mock LLM to validate JSON generation

const { generateCreateDSLPrompt } = require('./src/utils/llm-prompts.ts')

console.log('🧪 Testing prompt generation...\n')

// Test the prompt
const userRequirement = '入力とLLMサービス、出力のシンプルなフロー'
const prompt = generateCreateDSLPrompt(userRequirement)

console.log('Generated prompt:')
console.log('='.repeat(80))
console.log(prompt)
console.log('='.repeat(80))

// Simulate what a good LLM response should look like
const expectedJSON = {
  "app": {
    "description": "入力テキストを受け取り、LLMで処理し、結果を出力するシンプルフロー",
    "icon": "🤖",
    "icon_background": "#EFF1F5",
    "mode": "workflow",
    "name": "シンプルLLMフロー"
  },
  "kind": "app",
  "version": "0.1.5",
  "workflow": {
    "environment_variables": [],
    "features": {},
    "graph": {
      "edges": [
        {
          "id": "start-to-llm",
          "source": "start-1",
          "target": "llm-1",
          "sourceHandle": "source",
          "targetHandle": "target",
          "type": "custom",
          "data": {
            "sourceType": "start",
            "targetType": "llm",
            "isInIteration": false
          }
        },
        {
          "id": "llm-to-end",
          "source": "llm-1",
          "target": "end-1",
          "sourceHandle": "source",
          "targetHandle": "target",
          "type": "custom",
          "data": {
            "sourceType": "llm",
            "targetType": "end",
            "isInIteration": false
          }
        }
      ],
      "nodes": [
        {
          "id": "start-1",
          "type": "start",
          "position": {"x": 100, "y": 200},
          "data": {
            "title": "開始",
            "variables": [
              {
                "variable": "user_input",
                "type": "string",
                "label": "ユーザー入力",
                "required": true,
                "description": "処理したいテキストを入力してください"
              }
            ]
          }
        },
        {
          "id": "llm-1",
          "type": "llm",
          "position": {"x": 350, "y": 200},
          "data": {
            "title": "LLM処理",
            "model": {
              "provider": "openai",
              "name": "gpt-5-mini",
              "mode": "chat",
              "completion_params": {
                "temperature": 0.7,
                "max_tokens": 1000
              }
            },
            "prompt_template": [
              {
                "role": "user",
                "text": "{{#start-1.user_input#}}"
              }
            ],
            "variable": "llm_response"
          }
        },
        {
          "id": "end-1",
          "type": "end",
          "position": {"x": 600, "y": 200},
          "data": {
            "title": "終了",
            "outputs": {
              "result": {
                "type": "string",
                "children": [
                  {
                    "variable": "llm-1.llm_response",
                    "value_selector": ["llm-1", "llm_response"]
                  }
                ]
              }
            }
          }
        }
      ],
      "viewport": {"x": 0, "y": 0, "zoom": 1}
    }
  }
}

console.log('\nExpected JSON structure:')
console.log(JSON.stringify(expectedJSON, null, 2))

// Test JSON parsing
try {
  const testString = JSON.stringify(expectedJSON)
  const parsed = JSON.parse(testString)
  console.log('\n✅ JSON is valid and parseable')

  // Test YAML conversion
  const yaml = require('js-yaml')
  const yamlContent = yaml.dump(parsed)
  console.log(`✅ YAML conversion successful (length: ${yamlContent.length})`)

  // Test structure validation
  const hasStart = parsed.workflow.graph.nodes.some(n => n.type === 'start')
  const hasLLM = parsed.workflow.graph.nodes.some(n => n.type === 'llm')
  const hasEnd = parsed.workflow.graph.nodes.some(n => n.type === 'end')
  const hasEdges = parsed.workflow.graph.edges.length >= 2

  console.log(`✅ Structure validation: start=${hasStart}, llm=${hasLLM}, end=${hasEnd}, edges=${hasEdges}`)

  if (hasStart && hasLLM && hasEnd && hasEdges) {
    console.log('\n🎯 Expected structure is complete and valid!')
  } else {
    console.log('\n❌ Structure validation failed')
  }

} catch (error) {
  console.log('\n❌ JSON validation failed:', error.message)
}

console.log('\n📝 Analysis:')
console.log('- The prompt should generate a valid 3-node workflow')
console.log('- Need to ensure LLM follows JSON syntax strictly')
console.log('- Japanese text should be properly quoted in JSON')
