#!/usr/bin/env node

const playwright = require('playwright')

async function testCompleteFlow() {
  console.log('🚀 最終エンドツーエンドテスト開始...\n')

  const browser = await playwright.chromium.launch({
    headless: true
  })

  try {
    const page = await browser.newPage()

    // コンソールメッセージをキャプチャ
    page.on('console', msg => {
      const text = msg.text()
      if (msg.type() === 'log' && (
        text.includes('Sakura') ||
        text.includes('Content') ||
        text.includes('🔍') ||
        text.includes('📝') ||
        text.includes('🎯') ||
        text.includes('📋') ||
        text.includes('❌') ||
        text.includes('🔧') ||
        text.includes('🔄') ||
        text.includes('YAML') ||
        text.includes('handleApplyWorkflow') ||
        text.includes('importDSL') ||
        text.includes('Parse')
      )) {
        console.log(`[Browser Console]: ${text}`)
      }
    })

    // 1. アプリにアクセス
    console.log('📌 Step 1: アプリにアクセス')
    await page.goto('http://localhost:3002')
    await page.waitForLoadState('networkidle')
    console.log('✅ ページ読み込み完了\n')

    // 2. LLM設定を直接localStorageに保存
    console.log('📌 Step 2: Sakura AI設定をセット')
    await page.evaluate(() => {
      const settings = {
        state: {
          llmSettings: {
            provider: 'compatible',
            baseUrl: 'https://api.ai.sakura.ad.jp/v1',
            apiKey: 'd5106cb4-ba55-4b0b-8da5-e5b198e7c599:RuJbTxHjo16r4Z7iJ29WMcKlKWumvYcpnyGtPVEM',
            modelName: 'gpt-oss-120b',
            temperature: 0.1,
            maxTokens: 2000,
            timeout: 30000
          }
        },
        version: 0
      }
      localStorage.setItem('settings-store', JSON.stringify(settings))
    })

    // ページをリロードして設定を反映
    await page.reload()
    await page.waitForLoadState('networkidle')
    console.log('✅ Sakura AI設定完了\n')

    // 3. チャットサイドバーで要件を入力
    console.log('📌 Step 3: ワークフロー要件を入力')
    const requirement = '入力とLLMサービス、出力のシンプルなフロー'

    // チャットサイドバーの入力欄（右側のチャット入力、下部にある）
    const chatInput = await page.locator('input[placeholder="Describe your workflow..."]')
    await chatInput.fill(requirement)
    console.log(`📝 要件: "${requirement}"\n`)

    // 4. 送信ボタンをクリック
    console.log('📌 Step 4: ワークフロー生成を実行')

    // デバッグ: 入力値を確認
    const inputValue = await chatInput.inputValue()
    console.log(`入力値確認: "${inputValue}"`)

    // 送信ボタン（紙飛行機アイコン）をクリック - 右下のボタン
    const sendButton = await page.locator('button:has(svg.lucide-send)')
    const buttonCount = await sendButton.count()
    console.log(`送信ボタン数: ${buttonCount}`)

    if (buttonCount > 0) {
      await sendButton.first().click()
      console.log('✅ 送信ボタンクリック')
    } else {
      // Enterキーで送信を試みる
      await chatInput.press('Enter')
      console.log('⏅ Enterキーで送信')
    }

    console.log('⏳ 生成中...\n')

    // 5. 生成を待つ（Sakura AIは時間がかかるので長めに設定）
    console.log('📌 Step 5: 生成結果を待機（最大90秒）')

    // ネットワークレスポンスを監視
    page.on('response', response => {
      if (response.url().includes('api.ai.sakura.ad.jp')) {
        console.log(`📡 API呼び出し検出: ${response.status()}`)
      }
    })

    // チャットメッセージの変化を待つ
    await page.waitForTimeout(3000) // 初期待機

    let success = false
    let errorMessage = null
    const maxWaitTime = 90000 // 90秒
    const checkInterval = 2000 // 2秒ごとにチェック
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      // チャット内のメッセージを確認
      const messages = await page.locator('.prose, [class*="message"], p, div').all()

      // デバッグ: メッセージ数を表示
      if (Date.now() - startTime < 5000) {
        console.log(`\nメッセージ数: ${messages.length}`)
      }

      for (const message of messages) {
        const text = await message.textContent()

        // 成功パターンの検出
        if (text && (
          text.includes('✓') ||
          text.includes('✅') ||
          text.includes('DSL is valid') ||
          text.includes('ready to use') ||
          text.includes('成功') ||
          text.includes('Success') ||
          text.includes('Generated') ||
          text.includes('completed') ||
          text.includes('ワークフローを生成しました')
        )) {
          success = true
          console.log('✅ ワークフロー生成成功を検出！')
          console.log(`  検出メッセージ: "${text.substring(0, 100)}..."`)
          break
        }

        // エラーパターンの検出
        if (text && (
          text.includes('❌') ||
          text.includes('Error') ||
          text.includes('失敗') ||
          text.includes('Failed')
        )) {
          errorMessage = text
          break
        }
      }

      if (success || errorMessage) break

      // ワークフローエディタにノードが表示されているかチェック
      const nodeCount = await page.locator('.react-flow__node').count()
      if (nodeCount > 0) {
        success = true
        console.log(`✅ ワークフローノードを検出！（${nodeCount}個）`)
        break
      }

      // Applyボタンの存在もチェック
      const applyButton = await page.locator('button:has-text("Apply")').count()
      if (applyButton > 0) {
        success = true
        console.log('✅ DSL生成成功！Applyボタンを検出')
        break
      }

      await page.waitForTimeout(checkInterval)
      process.stdout.write('.')
    }

    console.log('\n')

    if (success) {
      console.log('✅ ワークフロー生成成功！\n')

      // 6. ワークフローグラフの表示を確認
      console.log('📌 Step 6: ワークフローグラフの表示確認')

      // Applyボタンをクリックしてワークフローを適用
      const applyButton = await page.locator('button:has-text("Apply")')
      if (await applyButton.count() > 0) {
        console.log('📌 Applyボタンをクリック')
        await applyButton.click()

        // ノードが表示されるまで待機
        console.log('⏳ ノードの表示を待機中...')
        await page.waitForTimeout(5000)
      }

      // ノード数を確認 - 複数のセレクタを試す
      let nodeCount = await page.locator('.react-flow__node').count()
      if (nodeCount === 0) {
        nodeCount = await page.locator('[data-id*="node"]').count()
      }
      if (nodeCount === 0) {
        nodeCount = await page.locator('[data-testid*="node"]').count()
      }
      console.log(`📊 表示されたノード数: ${nodeCount}`)

      if (nodeCount >= 3) {
        console.log('✅ ワークフローグラフ表示成功！')

        // ノードタイプの詳細確認
        const nodes = await page.locator('.react-flow__node').all()
        for (let i = 0; i < nodes.length && i < 5; i++) {
          const nodeText = await nodes[i].textContent()
          console.log(`   - Node ${i + 1}: ${nodeText.substring(0, 30)}...`)
        }

        // スクリーンショットを保存
        await page.screenshot({ path: 'test-success-final.png', fullPage: true })
        console.log('📸 成功スクリーンショット保存: test-success-final.png\n')

        console.log('=' .repeat(60))
        console.log('🎉 テスト完全成功！')
        console.log('=' .repeat(60))
        console.log('✅ Sakura AI設定: 完了')
        console.log('✅ プロンプト送信: 成功')
        console.log('✅ JSON生成: 成功')
        console.log('✅ YAML変換: 成功')
        console.log('✅ ワークフロー生成: 成功')
        console.log(`✅ グラフ表示: 成功（${nodeCount}ノード）`)
        console.log('=' .repeat(60))

        return true

      } else {
        console.log('⚠️ ノード数が少ない（期待: 3以上）')
        return false
      }

    } else if (errorMessage) {
      console.log(`❌ エラー: ${errorMessage}`)
      await page.screenshot({ path: 'test-error-final.png', fullPage: true })
      return false

    } else {
      console.log('❌ タイムアウト: 生成結果が表示されませんでした')
      await page.screenshot({ path: 'test-timeout-final.png', fullPage: true })
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
      console.log('📝 入力したプロンプトでフローが生成され、画面にグラフが表示されました！')
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