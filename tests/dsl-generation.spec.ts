import { test, expect, Page } from '@playwright/test'
import * as yaml from 'js-yaml'

// Complex workflow test cases for 10+ node workflows
const complexWorkflowRequests = [
  "Create a comprehensive customer service AI workflow with: user query classification, sentiment analysis, knowledge base search, escalation logic for negative sentiment, automated response generation, human handoff decision, response formatting, quality scoring, and feedback collection with analytics",

  "Build an advanced content moderation pipeline with: content ingestion, language detection, inappropriate content filtering, image analysis, user reputation checking, severity scoring, automated actions, human review queue, notification system, and audit logging",

  "Design a multi-step e-commerce recommendation engine with: user behavior analysis, product catalog search, collaborative filtering, content-based filtering, price optimization, inventory checking, personalization scoring, A/B testing logic, conversion tracking, and performance analytics",

  "Create a sophisticated document processing workflow with: file upload validation, format detection, OCR processing, content extraction, entity recognition, classification, quality assessment, human verification, output formatting, and storage management",

  "Build a complex lead qualification system with: lead data enrichment, company information lookup, scoring algorithms, behavioral analysis, marketing attribution, sales readiness assessment, routing logic, CRM integration, follow-up scheduling, and performance tracking"
]

class DSLTestRunner {
  private page: Page
  private testResults: Array<{
    request: string
    success: boolean
    error?: string
    nodeCount?: number
    yamlValid?: boolean
    hasRequiredStructure?: boolean
  }> = []

  constructor(page: Page) {
    this.page = page
  }

  async setup() {
    // Navigate to the application
    await this.page.goto('http://localhost:3000')
    await this.page.waitForLoadState('networkidle')

    // Check if settings modal is needed
    const settingsButton = this.page.locator('[data-testid="settings-button"]').first()
    if (await settingsButton.isVisible()) {
      await settingsButton.click()

      // Configure LLM settings for testing
      await this.page.fill('[data-testid="api-key-input"]', 'test-api-key-for-testing')
      await this.page.click('[data-testid="save-settings"]')
      await this.page.waitForTimeout(1000)
    }
  }

  async testWorkflowGeneration(request: string): Promise<boolean> {
    try {
      console.log(`Testing: ${request.substring(0, 80)}...`)

      // Clear previous content
      await this.page.locator('[data-testid="chat-input"]').clear()

      // Enter the workflow request
      await this.page.fill('[data-testid="chat-input"]', request)
      await this.page.click('[data-testid="send-button"]')

      // Wait for response with longer timeout for complex workflows
      await this.page.waitForTimeout(2000)

      // Look for generated YAML content in various possible locations
      const yamlSelectors = [
        'code[class*="language-yaml"]',
        'pre code',
        '[data-testid="generated-yaml"]',
        '.prose code',
        'code'
      ]

      let yamlContent = ''
      for (const selector of yamlSelectors) {
        const element = this.page.locator(selector).last()
        if (await element.isVisible()) {
          yamlContent = await element.textContent() || ''
          if (yamlContent.includes('app:') && yamlContent.includes('workflow:')) {
            break
          }
        }
      }

      if (!yamlContent || !yamlContent.includes('app:')) {
        // Try getting from chat messages
        const chatMessages = this.page.locator('[data-testid="chat-message"]')
        const lastMessage = chatMessages.last()
        const messageContent = await lastMessage.textContent() || ''

        // Extract YAML from message content
        const yamlMatch = messageContent.match(/```yaml\n([\s\S]*?)\n```/) ||
                         messageContent.match(/```\n([\s\S]*?)\n```/)

        if (yamlMatch) {
          yamlContent = yamlMatch[1]
        }
      }

      if (!yamlContent) {
        throw new Error('No YAML content found in response')
      }

      // Validate YAML syntax
      let parsedYaml: any
      try {
        parsedYaml = yaml.load(yamlContent)
      } catch (yamlError) {
        throw new Error(`YAML parsing failed: ${yamlError.message}`)
      }

      // Validate required structure
      if (!parsedYaml?.app || !parsedYaml?.workflow || !parsedYaml?.kind) {
        throw new Error('Missing required top-level keys: app, workflow, kind')
      }

      if (!parsedYaml.workflow.graph?.nodes || !Array.isArray(parsedYaml.workflow.graph.nodes)) {
        throw new Error('Missing or invalid workflow.graph.nodes array')
      }

      const nodeCount = parsedYaml.workflow.graph.nodes.length
      if (nodeCount < 8) {
        throw new Error(`Insufficient complexity: only ${nodeCount} nodes (expected 8+)`)
      }

      // Check for required node types
      const hasStart = parsedYaml.workflow.graph.nodes.some((node: any) => node.type === 'start')
      const hasEnd = parsedYaml.workflow.graph.nodes.some((node: any) => node.type === 'end')

      if (!hasStart || !hasEnd) {
        throw new Error('Missing required start or end nodes')
      }

      // Validate edges
      if (!parsedYaml.workflow.graph.edges || !Array.isArray(parsedYaml.workflow.graph.edges)) {
        throw new Error('Missing or invalid edges array')
      }

      console.log(`✅ Success: ${nodeCount} nodes, valid YAML structure`)

      this.testResults.push({
        request: request.substring(0, 100),
        success: true,
        nodeCount,
        yamlValid: true,
        hasRequiredStructure: true
      })

      return true

    } catch (error) {
      console.log(`❌ Failed: ${error.message}`)

      this.testResults.push({
        request: request.substring(0, 100),
        success: false,
        error: error.message,
        yamlValid: false,
        hasRequiredStructure: false
      })

      return false
    }
  }

  getResults() {
    const total = this.testResults.length
    const successful = this.testResults.filter(r => r.success).length
    const failureRate = ((total - successful) / total) * 100

    return {
      total,
      successful,
      failed: total - successful,
      failureRate: failureRate.toFixed(2),
      results: this.testResults
    }
  }

  logDetailedResults() {
    const results = this.getResults()

    console.log('\n=== DSL GENERATION TEST RESULTS ===')
    console.log(`Total Tests: ${results.total}`)
    console.log(`Successful: ${results.successful}`)
    console.log(`Failed: ${results.failed}`)
    console.log(`Failure Rate: ${results.failureRate}%`)
    console.log(`Target: <1% failure rate`)
    console.log(`Status: ${parseFloat(results.failureRate) < 1 ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`)

    if (results.failed > 0) {
      console.log('\n=== FAILURE ANALYSIS ===')
      this.testResults.filter(r => !r.success).forEach((result, index) => {
        console.log(`${index + 1}. ${result.request}`)
        console.log(`   Error: ${result.error}`)
      })
    }

    return results
  }
}

test.describe('DSL Generation Quality Tests', () => {
  test('Complex 10+ Node Workflow Generation', async ({ page }) => {
    const runner = new DSLTestRunner(page)
    await runner.setup()

    // Run tests on all complex workflow requests
    for (const request of complexWorkflowRequests) {
      await runner.testWorkflowGeneration(request)
      // Small delay between tests
      await page.waitForTimeout(1000)
    }

    // Run additional random variations
    for (let i = 0; i < 5; i++) {
      const randomRequest = `Create a complex workflow with ${10 + Math.floor(Math.random() * 5)} different processing steps for ${['data analysis', 'content processing', 'user management', 'order fulfillment', 'quality assurance'][Math.floor(Math.random() * 5)]}`
      await runner.testWorkflowGeneration(randomRequest)
      await page.waitForTimeout(1000)
    }

    const results = runner.logDetailedResults()

    // Assert that we meet the <1% failure rate requirement
    expect(parseFloat(results.failureRate)).toBeLessThan(1)
  })

  test('Edge Cases and Error Scenarios', async ({ page }) => {
    const runner = new DSLTestRunner(page)
    await runner.setup()

    const edgeCases = [
      "Create a workflow with exactly 15 nodes including conditional branches, loops, and error handling",
      "Build a multi-path workflow with 3 different processing branches that merge at the end",
      "Design a workflow with nested conditions, parameter extraction, and complex data transformations"
    ]

    for (const edgeCase of edgeCases) {
      await runner.testWorkflowGeneration(edgeCase)
      await page.waitForTimeout(1500)
    }

    const results = runner.logDetailedResults()
    expect(parseFloat(results.failureRate)).toBeLessThan(5) // More lenient for edge cases
  })
})