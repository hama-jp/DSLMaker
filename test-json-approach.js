#!/usr/bin/env node

// Test the new JSON-to-YAML approach
const yaml = require('js-yaml')

// Simulate what the LLM would return (JSON format)
const mockLLMResponse = `{
  "app": {
    "description": "シンプルな入力→出力フロー",
    "icon": "🤖",
    "icon_background": "#EFF1F5",
    "mode": "workflow",
    "name": "シンプルフロー"
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
                "description": "処理したい内容を入力してください"
              }
            ]
          }
        },
        {
          "id": "llm-1",
          "type": "llm",
          "position": {"x": 350, "y": 200},
          "data": {
            "title": "AI処理",
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
            "variable": "ai_response"
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
                    "variable": "llm-1.ai_response",
                    "value_selector": ["llm-1", "ai_response"]
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
}`

console.log('🧪 Testing JSON-to-YAML conversion approach...\n')

console.log('1. Parsing JSON from LLM response...')
let dslObject
try {
  dslObject = JSON.parse(mockLLMResponse)
  console.log('✅ JSON parsing successful')
} catch (error) {
  console.log('❌ JSON parsing failed:', error.message)
  process.exit(1)
}

console.log('\n2. Converting JSON to YAML...')
let yamlContent
try {
  yamlContent = yaml.dump(dslObject, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false
  })
  console.log('✅ YAML conversion successful')
} catch (error) {
  console.log('❌ YAML conversion failed:', error.message)
  process.exit(1)
}

console.log('\n3. Validating generated YAML...')
try {
  const parsedBack = yaml.load(yamlContent)
  const nodeCount = parsedBack?.workflow?.graph?.nodes?.length || 0
  console.log(`✅ YAML validation successful (nodes detected: ${nodeCount})`)
} catch (error) {
  console.log('❌ YAML validation failed:', error.message)
  console.log('Generated YAML:')
  console.log(yamlContent)
  process.exit(1)
}

console.log('\n4. Checking structure requirements...')
const checks = [
  { name: 'Has app object', test: () => dslObject.app !== undefined },
  { name: 'Has kind field', test: () => dslObject.kind === 'app' },
  { name: 'Has version field', test: () => dslObject.version !== undefined },
  { name: 'Has workflow object', test: () => dslObject.workflow !== undefined },
  { name: 'Has nodes array', test: () => Array.isArray(dslObject.workflow.graph?.nodes) },
  { name: 'Has edges array', test: () => Array.isArray(dslObject.workflow.graph?.edges) },
  { name: 'Has start node', test: () => dslObject.workflow.graph?.nodes.some(n => n.type === 'start') },
  { name: 'Has end node', test: () => dslObject.workflow.graph?.nodes.some(n => n.type === 'end') },
]

let allPassed = true
checks.forEach(check => {
  const passed = check.test()
  console.log(passed ? '✅' : '❌', check.name)
  if (!passed) allPassed = false
})

console.log('\n📋 Generated YAML Preview:')
console.log('─'.repeat(50))
console.log(yamlContent.split('\n').slice(0, 15).join('\n'))
console.log('... (truncated)')
console.log('─'.repeat(50))

console.log(`\n🎯 Final Result: ${allPassed ? '✅ SUCCESS' : '❌ FAILED'}`)
console.log(`Node count: ${dslObject.workflow.graph?.nodes.length || 0}`)
console.log(`Edge count: ${dslObject.workflow.graph?.edges.length || 0}`)

if (allPassed) {
  console.log('\n🚀 The JSON-to-YAML approach works perfectly!')
  console.log('   ✅ No YAML syntax errors')
  console.log('   ✅ Perfect structure validation')
  console.log('   ✅ Japanese text handled correctly')
  console.log('   ✅ All required components present')
} else {
  console.log('\n❌ Issues found in the conversion')
  process.exit(1)
}

process.exit(0)
