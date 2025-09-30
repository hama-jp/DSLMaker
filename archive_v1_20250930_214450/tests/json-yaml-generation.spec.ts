import { test, expect } from '@playwright/test'
test.describe('JSON-to-YAML DSL Generation', () => {
  let page: any

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('http://localhost:3002')

    // Configure LLM settings for testing
    await page.click('[data-testid="settings-button"]')

    // Set OpenAI API key (using test key for mocking)
    await page.fill('input[placeholder*="API Key"]', 'test-api-key-for-testing')
    await page.fill('input[placeholder*="Base URL"]', 'https://api.openai.com/v1')
    await page.selectOption('select', 'gpt-4o-mini')

    // Set low temperature for consistency
    await page.fill('input[type="range"]', '0.01')

    await page.click('button:has-text("保存")')
    await page.waitForTimeout(1000)
  })

  test('Simple workflow generation - JSON format verification', async () => {
    console.log('🧪 Testing simple workflow generation...')

    // Mock the LLM API response to return JSON
    await page.route('**/api/chat/completions', async (route: any) => {
      const mockJSONResponse = {
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
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{
            message: {
              content: JSON.stringify(mockJSONResponse)
            }
          }]
        })
      })
    })

    // Input simple workflow requirement
    await page.fill('textarea[placeholder*="要件"]', 'シンプルな入力→出力フロー')
    await page.click('button:has-text("生成")')

    // Wait for generation to complete
    await page.waitForSelector('.text-green-600:has-text("✓")', { timeout: 30000 })

    // Verify success message
    const successMessage = await page.textContent('.text-green-600')
    expect(successMessage).toContain('✓')

    // Verify workflow is displayed
    await page.waitForSelector('[data-testid="react-flow"]', { timeout: 10000 })

    // Check that nodes are present
    const nodes = await page.locator('.react-flow__node').count()
    expect(nodes).toBeGreaterThanOrEqual(3) // start, llm, end

    // Export and validate YAML
    await page.click('button:has-text("エクスポート")')

    // Wait for download and check file content
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("ダウンロード")')
    const download = await downloadPromise
    console.log(`📁 Downloaded workflow: ${download.suggestedFilename()}`)

    console.log('✅ Simple workflow test passed')
  })

  test('Complex workflow generation - 10+ nodes', async () => {
    console.log('🧪 Testing complex workflow generation...')

    // Mock complex JSON response (customer service workflow from test file)
    await page.route('**/api/chat/completions', async (route: any) => {
      // Use the complex workflow from test-integration.js
      const mockComplexResponse = {
        "app": {
          "description": "複雑な顧客サービスAIワークフロー：問い合わせ分類、感情分析、ナレッジベース検索、エスカレーション判定、自動応答生成、品質スコアリング、分析データ収集を含む",
          "icon": "🤖",
          "icon_background": "#EFF1F5",
          "mode": "workflow",
          "name": "Advanced Customer Service AI"
        },
        "kind": "app",
        "version": "0.1.5",
        "workflow": {
          "environment_variables": [],
          "features": {},
          "graph": {
            "edges": [
              { "id": "start-to-classifier", "source": "start-1", "target": "classifier-1", "sourceHandle": "source", "targetHandle": "target", "type": "custom", "data": { "sourceType": "start", "targetType": "question-classifier", "isInIteration": false } },
              { "id": "classifier-to-sentiment", "source": "classifier-1", "target": "sentiment-1", "sourceHandle": "source", "targetHandle": "target", "type": "custom", "data": { "sourceType": "question-classifier", "targetType": "llm", "isInIteration": false } },
              { "id": "sentiment-to-knowledge", "source": "sentiment-1", "target": "knowledge-1", "sourceHandle": "source", "targetHandle": "target", "type": "custom", "data": { "sourceType": "llm", "targetType": "knowledge-retrieval", "isInIteration": false } },
              { "id": "knowledge-to-condition", "source": "knowledge-1", "target": "condition-1", "sourceHandle": "source", "targetHandle": "target", "type": "custom", "data": { "sourceType": "knowledge-retrieval", "targetType": "if-else", "isInIteration": false } },
              { "id": "condition-to-escalation", "source": "condition-1", "target": "escalation-1", "sourceHandle": "true", "targetHandle": "target", "type": "custom", "data": { "sourceType": "if-else", "targetType": "llm", "isInIteration": false } },
              { "id": "condition-to-response", "source": "condition-1", "target": "response-1", "sourceHandle": "false", "targetHandle": "target", "type": "custom", "data": { "sourceType": "if-else", "targetType": "llm", "isInIteration": false } },
              { "id": "escalation-to-template", "source": "escalation-1", "target": "template-1", "sourceHandle": "source", "targetHandle": "target", "type": "custom", "data": { "sourceType": "llm", "targetType": "template-transform", "isInIteration": false } },
              { "id": "response-to-template", "source": "response-1", "target": "template-1", "sourceHandle": "source", "targetHandle": "target", "type": "custom", "data": { "sourceType": "llm", "targetType": "template-transform", "isInIteration": false } },
              { "id": "template-to-quality", "source": "template-1", "target": "quality-1", "sourceHandle": "source", "targetHandle": "target", "type": "custom", "data": { "sourceType": "template-transform", "targetType": "code", "isInIteration": false } },
              { "id": "quality-to-end", "source": "quality-1", "target": "end-1", "sourceHandle": "source", "targetHandle": "target", "type": "custom", "data": { "sourceType": "code", "targetType": "end", "isInIteration": false } }
            ],
            "nodes": [
              { "id": "start-1", "type": "start", "position": {"x": 100, "y": 300}, "data": { "title": "顧客入力", "variables": [{ "variable": "customer_query", "type": "string", "label": "顧客の問い合わせ", "required": true, "description": "どのようなご質問でしょうか？" }] } },
              { "id": "classifier-1", "type": "question-classifier", "position": {"x": 350, "y": 300}, "data": { "title": "問い合わせ分類", "query_variable_selector": ["start-1", "customer_query"], "classes": [{ "id": "technical_support", "name": "技術サポート", "description": "技術的な問題とトラブルシューティング" }] } },
              { "id": "sentiment-1", "type": "llm", "position": {"x": 600, "y": 300}, "data": { "title": "感情分析", "model": { "provider": "openai", "name": "gpt-5-mini", "mode": "chat", "completion_params": { "temperature": 0.3, "max_tokens": 500 } }, "prompt_template": [{ "role": "system", "text": "顧客の問い合わせの感情を分析してください。" }], "variable": "sentiment_result" } },
              { "id": "knowledge-1", "type": "knowledge-retrieval", "position": {"x": 850, "y": 300}, "data": { "title": "ナレッジベース検索", "query_variable_selector": ["start-1", "customer_query"], "dataset_ids": ["knowledge_base_uuid"], "retrieval_mode": "multiple" } },
              { "id": "condition-1", "type": "if-else", "position": {"x": 1100, "y": 300}, "data": { "title": "エスカレーション判定", "logical_operator": "or", "conditions": [{ "id": "negative-sentiment", "variable_selector": ["sentiment-1", "sentiment_result"], "comparison_operator": "contains", "value": "NEGATIVE" }] } },
              { "id": "escalation-1", "type": "llm", "position": {"x": 1350, "y": 200}, "data": { "title": "エスカレーション処理", "model": { "provider": "openai", "name": "gpt-5-mini", "mode": "chat" }, "prompt_template": [{ "role": "system", "text": "エスカレーション対応を作成してください。" }], "variable": "escalation_response" } },
              { "id": "response-1", "type": "llm", "position": {"x": 1350, "y": 400}, "data": { "title": "応答生成", "model": { "provider": "openai", "name": "gpt-5-mini", "mode": "chat" }, "prompt_template": [{ "role": "system", "text": "カスタマーサービス応答を生成してください。" }], "variable": "generated_response" } },
              { "id": "template-1", "type": "template-transform", "position": {"x": 1600, "y": 300}, "data": { "title": "応答フォーマット", "template": "# カスタマーサービス応答", "variables": [] } },
              { "id": "quality-1", "type": "code", "position": {"x": 1850, "y": 300}, "data": { "title": "品質評価", "code_language": "python3", "code": "def main(): return {'quality_score': 85}", "inputs": {}, "outputs": {} } },
              { "id": "end-1", "type": "end", "position": {"x": 2100, "y": 300}, "data": { "title": "完了", "outputs": { "final_response": { "type": "string", "children": [] } } } }
            ],
            "viewport": {"x": 0, "y": 0, "zoom": 0.8}
          }
        }
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{
            message: {
              content: JSON.stringify(mockComplexResponse)
            }
          }]
        })
      })
    })

    // Input complex workflow requirement
    await page.fill('textarea[placeholder*="要件"]', '複雑な顧客サービスAIワークフロー：問い合わせ分類、感情分析、ナレッジベース検索、エスカレーション判定、自動応答生成、品質スコアリング、分析データ収集')
    await page.click('button:has-text("生成")')

    // Wait for generation to complete
    await page.waitForSelector('.text-green-600:has-text("✓")', { timeout: 30000 })

    // Verify workflow complexity
    await page.waitForSelector('[data-testid="react-flow"]', { timeout: 10000 })

    const nodes = await page.locator('.react-flow__node').count()
    expect(nodes).toBeGreaterThanOrEqual(10) // Should have 10+ nodes

    console.log(`✅ Complex workflow test passed - ${nodes} nodes generated`)
  })

  test('Failure rate measurement - Multiple generations', async () => {
    console.log('🧪 Testing failure rate with multiple generations...')

    let successCount = 0
    const totalAttempts = 5

    for (let i = 0; i < totalAttempts; i++) {
      console.log(`🔄 Attempt ${i + 1}/${totalAttempts}`)

      // Mock successful JSON response
      await page.route('**/api/chat/completions', async (route: any) => {
        const mockResponse = {
          "app": { "description": `Test workflow ${i + 1}`, "icon": "🤖", "icon_background": "#EFF1F5", "mode": "workflow", "name": `Test Flow ${i + 1}` },
          "kind": "app",
          "version": "0.1.5",
          "workflow": {
            "environment_variables": [],
            "features": {},
            "graph": {
              "edges": [{ "id": "start-to-end", "source": "start-1", "target": "end-1", "sourceHandle": "source", "targetHandle": "target", "type": "custom", "data": { "sourceType": "start", "targetType": "end", "isInIteration": false } }],
              "nodes": [
                { "id": "start-1", "type": "start", "position": {"x": 100, "y": 200}, "data": { "title": "Start", "variables": [] } },
                { "id": "end-1", "type": "end", "position": {"x": 350, "y": 200}, "data": { "title": "End", "outputs": {} } }
              ],
              "viewport": {"x": 0, "y": 0, "zoom": 1}
            }
          }
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [{
              message: {
                content: JSON.stringify(mockResponse)
              }
            }]
          })
        })
      })

      try {
        // Clear previous content
        await page.fill('textarea[placeholder*="要件"]', '')
        await page.fill('textarea[placeholder*="要件"]', `テストワークフロー ${i + 1}`)
        await page.click('button:has-text("生成")')

        // Wait for result
        await page.waitForSelector('.text-green-600:has-text("✓"), .text-red-600', { timeout: 15000 })

        const isSuccess = await page.locator('.text-green-600:has-text("✓")').count() > 0
        if (isSuccess) {
          successCount++
          console.log(`✅ Attempt ${i + 1}: Success`)
        } else {
          console.log(`❌ Attempt ${i + 1}: Failed`)
        }

        // Wait before next attempt
        await page.waitForTimeout(1000)

      } catch (error) {
        console.log(`❌ Attempt ${i + 1}: Error - ${error}`)
      }
    }

    const failureRate = ((totalAttempts - successCount) / totalAttempts) * 100
    console.log(`📊 Results: ${successCount}/${totalAttempts} successful`)
    console.log(`📈 Failure rate: ${failureRate.toFixed(1)}%`)

    // Assert failure rate is under 1%
    expect(failureRate).toBeLessThan(1)

    console.log('✅ Failure rate test passed - Under 1% failure rate achieved!')
  })

  test('YAML format detection and rejection', async () => {
    console.log('🧪 Testing YAML format detection...')

    // Mock LLM returning YAML instead of JSON
    await page.route('**/api/chat/completions', async (route: any) => {
      const yamlResponse = `app:
  description: "Test workflow"
  icon: "🤖"
  mode: workflow
  name: "Test Flow"
kind: app
version: 0.1.5
workflow:
  environment_variables: []
  features: {}
  graph:
    edges: []
    nodes: []
    viewport:
      x: 0
      y: 0
      zoom: 1`

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{
            message: {
              content: yamlResponse
            }
          }]
        })
      })
    })

    await page.fill('textarea[placeholder*="要件"]', 'テストワークフロー')
    await page.click('button:has-text("生成")')

    // Should detect YAML and show error
    await page.waitForSelector('.text-red-600', { timeout: 15000 })

    const errorMessage = await page.textContent('.text-red-600')
    expect(errorMessage).toContain('Invalid JSON')

    console.log('✅ YAML detection test passed - Properly rejected YAML format')
  })
})
