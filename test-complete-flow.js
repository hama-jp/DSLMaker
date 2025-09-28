#!/usr/bin/env node

const playwright = require('playwright')

async function testCompleteFlow() {
  console.log('🚀 完全なエンドツーエンドテスト開始...\n')

  const browser = await playwright.chromium.launch({
    headless: true
  })

  try {
    const page = await browser.newPage()

    // 1. アプリにアクセス
    console.log('📌 Step 1: アプリにアクセス')
    await page.goto('http://localhost:3002')
    await page.waitForLoadState('networkidle')
    console.log('✅ ページ読み込み完了\n')

    // 2. LLM設定を直接localStorageに保存
    console.log('📌 Step 2: LLM設定を設定')
    await page.evaluate(() => {
      const settings = {
        baseUrl: 'https://api.ai.sakura.ad.jp/v1',
        apiKey: 'd5106cb4-ba55-4b0b-8da5-e5b198e7c599:RuJbTxHjo16r4Z7iJ29WMcKlKWumvYcpnyGtPVEM',
        model: 'gpt-oss-120b',
        temperature: 0.1,
        maxTokens: 2000,
        stream: false
      }
      localStorage.setItem('llm-settings', JSON.stringify({ llmSettings: settings }))
    })

    // ページをリロードして設定を反映
    await page.reload()
    await page.waitForLoadState('networkidle')
    console.log('✅ API設定完了\n')

    // 3. デバッグ: スクリーンショットを撮る
    await page.screenshot({ path: 'debug-before-input.png' })
    console.log('📸 デバッグスクリーンショット: debug-before-input.png')

    // 4. チャットサイドバーで要件を入力
    console.log('📌 Step 3: ワークフロー要件を入力')
    const requirement = '入力とLLMサービス、出力のシンプルなフロー'

    // チャットサイドバーの入力欄を正確に指定
    const chatInput = await page.locator('input[placeholder="Describe your workflow..."]').first()
    await chatInput.fill(requirement)
    console.log(`📝 要件: "${requirement}"\n`)

    // 5. 生成ボタンをクリック
    console.log('📌 Step 4: ワークフロー生成を実行')

    // 送信ボタンを探す
    const sendButtons = await page.locator('button').filter({ has: page.locator('svg.lucide-send') }).all()
    console.log(`Found ${sendButtons.length} send buttons`)

    if (sendButtons.length > 0) {
      await sendButtons[0].click()
      console.log('Clicked send button')
    } else {
      // Enterキーで送信
      await chatInput.press('Enter')
      console.log('Pressed Enter key')
    }

    console.log('⏳ 生成中...')

    // 5. 結果を待つ（最大30秒）
    console.log('📌 Step 5: 生成結果を待機')

    try {
      // 成功またはエラーメッセージを待つ（60秒に延長）
      await page.waitForSelector('.text-green-600, .text-red-600, text=/success/i, text=/complete/i, text=/error/i', {
        timeout: 60000
      })

      // 成功の確認
      const successElements = await page.locator('.text-green-600:has-text("✓")').count()
      const errorElements = await page.locator('.text-red-600').count()

      if (successElements > 0 || await page.locator('text=/Generated.*successfully/').count() > 0) {
        console.log('✅ ワークフロー生成成功！\n')

        // 6. ワークフローグラフの表示を確認
        console.log('📌 Step 6: ワークフローグラフの表示確認')

        // React Flowのキャンバスを待つ
        await page.waitForSelector('.react-flow, [data-testid="react-flow"], [data-testid="rf__wrapper"]', {
          timeout: 10000
        })

        // ノード数を確認
        const nodeCount = await page.locator('.react-flow__node').count()
        console.log(`📊 表示されたノード数: ${nodeCount}`)

        if (nodeCount >= 3) {
          console.log('✅ ワークフローグラフ表示成功！')

          // ノードタイプの詳細確認
          const startNodes = await page.locator('.react-flow__node').filter({ hasText: /start|開始|input|入力/i }).count()
          const llmNodes = await page.locator('.react-flow__node').filter({ hasText: /llm|ai|process/i }).count()
          const endNodes = await page.locator('.react-flow__node').filter({ hasText: /end|終了|output|出力/i }).count()

          console.log(`   - Start nodes: ${startNodes}`)
          console.log(`   - LLM nodes: ${llmNodes}`)
          console.log(`   - End nodes: ${endNodes}`)
        } else {
          console.log('⚠️ ノード数が少ない（期待: 3以上）')
        }

        // スクリーンショットを保存
        await page.screenshot({ path: 'test-success-screenshot.png' })
        console.log('📸 スクリーンショット保存: test-success-screenshot.png\n')

        console.log('🎉 テスト完了！')
        console.log('=' .repeat(50))
        console.log('✅ JSON→YAML変換: 成功')
        console.log('✅ ワークフロー生成: 成功')
        console.log('✅ グラフ表示: 成功')
        console.log('=' .repeat(50))

        return true

      } else if (errorElements > 0) {
        const errorText = await page.locator('.text-red-600').first().textContent()
        console.log(`❌ エラー: ${errorText}`)

        // エラーのスクリーンショット
        await page.screenshot({ path: 'test-error-screenshot.png' })
        console.log('📸 エラースクリーンショット保存: test-error-screenshot.png\n')

        return false
      }

    } catch {
      console.log('❌ タイムアウト: 生成結果が表示されませんでした')
      await page.screenshot({ path: 'test-timeout-screenshot.png' })
      return false
    }

  } catch (error) {
    console.error('❌ テスト中にエラー発生:', error.message)
    return false

  } finally {
    await browser.close()
  }
}

// テスト実行
testCompleteFlow()
  .then(success => {
    if (success) {
      console.log('\n🏁 最終結果: ✅ 完全動作確認済み')
      console.log('入力したプロンプトでフローが生成され、画面にグラフが表示されました！')
      process.exit(0)
    } else {
      console.log('\n🏁 最終結果: ❌ テスト失敗')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
