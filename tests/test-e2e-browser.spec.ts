import { test, expect } from '@playwright/test'

test('End-to-end workflow generation test', async ({ page }) => {
  console.log('🧪 Starting end-to-end test...')

  // Navigate to the app
  await page.goto('http://localhost:3002')
  await page.waitForLoadState('networkidle')

  // Configure API settings first
  console.log('⚙️ Setting up API configuration...')
  await page.click('button:has(svg.lucide-settings)')

  // Set API key and configuration
  await page.fill('input[placeholder*="API Key"], input[placeholder*="APIキー"]', process.env.OPENAI_API_KEY || 'test-key')
  await page.fill('input[placeholder*="Base URL"], input[placeholder*="ベースURL"]', 'https://api.openai.com/v1')

  // Select model
  await page.selectOption('select', 'gpt-4o-mini')

  // Set temperature
  await page.fill('input[type="range"]', '0.1')

  // Save settings
  await page.click('button:has-text("保存"), button:has-text("Save")')
  await page.waitForTimeout(1000)

  console.log('📝 Entering workflow requirement...')
  // Enter the workflow requirement in the header input
  const requirement = '入力とLLMサービス、出力のシンプルなフロー'
  await page.fill('input[placeholder*="Workflow name"]', requirement)

  console.log('🚀 Clicking generate button...')
  // Click generate button
  await page.click('button:has-text("Generate Workflow")')

  // Wait for either success or failure
  console.log('⏳ Waiting for generation result...')
  await page.waitForSelector('.text-green-600:has-text("✓"), .text-red-600', { timeout: 30000 })

  // Check if generation succeeded
  const successElement = await page.locator('.text-green-600:has-text("✓")').count()
  const errorElement = await page.locator('.text-red-600').count()

  if (successElement > 0) {
    console.log('✅ Generation succeeded!')

    // Wait for workflow to be displayed
    console.log('🔍 Checking for workflow display...')
    await page.waitForSelector('[data-testid="react-flow"], .react-flow', { timeout: 10000 })

    // Count nodes in the flow
    const nodeCount = await page.locator('.react-flow__node').count()
    console.log(`📊 Found ${nodeCount} nodes in the workflow`)

    // Check for specific node types
    const startNodes = await page.locator('.react-flow__node:has-text("Input"), .react-flow__node:has-text("開始"), .react-flow__node:has-text("入力")').count()
    const llmNodes = await page.locator('.react-flow__node:has-text("AI"), .react-flow__node:has-text("LLM"), .react-flow__node:has-text("Process")').count()
    const endNodes = await page.locator('.react-flow__node:has-text("Output"), .react-flow__node:has-text("終了"), .react-flow__node:has-text("出力")').count()

    console.log(`🔗 Node types: Start=${startNodes}, LLM=${llmNodes}, End=${endNodes}`)

    // Test export functionality
    console.log('📤 Testing export functionality...')
    await page.click('button:has-text("エクスポート"), button:has-text("Export")')

    // Wait for export dialog or download
    await page.waitForTimeout(2000)

    console.log('🎯 END-TO-END TEST RESULTS:')
    console.log(`✅ Generation: SUCCESS`)
    console.log(`✅ Workflow Display: ${nodeCount} nodes visible`)
    console.log(`✅ Node Structure: Start=${startNodes}, LLM=${llmNodes}, End=${endNodes}`)
    console.log(`✅ Export: Available`)

    expect(nodeCount).toBeGreaterThanOrEqual(3)
    expect(startNodes).toBeGreaterThanOrEqual(1)
    expect(endNodes).toBeGreaterThanOrEqual(1)

    return true

  } else if (errorElement > 0) {
    const errorText = await page.locator('.text-red-600').textContent()
    console.log('❌ Generation failed with error:', errorText)

    console.log('🎯 END-TO-END TEST RESULTS:')
    console.log(`❌ Generation: FAILED`)
    console.log(`❌ Error: ${errorText}`)

    throw new Error(`Generation failed: ${errorText}`)
  } else {
    console.log('❓ Unexpected state - no success or error indicator found')
    throw new Error('Unexpected test state')
  }
})

test.setTimeout(60000) // 1 minute timeout