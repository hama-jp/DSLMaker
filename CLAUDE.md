# CLAUDE.md - Development Guidelines and Lessons Learned

## 開発時のテスト戦略

### 必須テスト実行手順
開発を進める際は以下の **両方のテスト** を必ず実行してください：

#### 1. 単体テスト（Vitest）
```bash
npm test                    # 全単体テスト実行
# または
npx vitest run             # 直接実行
npx vitest                 # ウォッチモード（開発中推奨）
```

**対象**: ユーティリティ関数、状態管理、データ変換ロジック
**重要性**: コードの基本動作を保証し、リグレッションを防ぐ

#### 2. E2Eテスト（Playwright）
```bash
npx playwright test        # 全E2Eテスト実行
```

**対象**: ブラウザでの実際のユーザー操作、UI統合
**重要性**: 実際の使用環境での動作を保証

### 開発ワークフロー
1. **コード変更**
2. **単体テスト実行** - `npm test`
3. **E2Eテスト実行** - `npx playwright test`
4. **linting** - `npm run lint`
5. **ビルド確認** - `npm run build`

### 追加のスモークテスト
本格的な統合確認時は以下も実行：
```bash
node test-complete-flow-final.js    # E2E統合フローテスト
node test-real-llm.js               # 実LLM統合テスト（API Key必要）
```

## プルリクエスト作成時の注意事項

### 1. 実装前の準備
- **バックアップを取る**: 重要なファイルは作業前にバックアップディレクトリに保存
  ```bash
  mkdir -p ~/backup_$(date +%Y%m%d_%H%M%S)
  cp -r important_files/ ~/backup_$(date +%Y%m%d_%H%M%S)/
  ```
- **ブランチ戦略**: 必ずfeatureブランチを作成してから作業を開始

### 2. コード変更時の原則
- **最小限の変更**: 基底クラスやコアモジュールへの変更は最小限に
- **影響範囲の考慮**: 変更が他のコンポーネントに与える影響を常に確認
- **None/Nullチェック**: 特にPythonでは、Noneが渡される可能性を常に考慮
  ```python
  # Good
  if self.content is None:
      return []

  # Bad - NoneTypeエラーの原因
  for item in self.content:  # content がNoneの場合エラー
  ```

### 3. テスト戦略
- **段階的なテスト**: 単純なケースから複雑なケースへ
  1. 基本的な動作確認（単体テスト）
  2. エッジケースの確認（単体テスト）
  3. 統合テスト（E2Eテスト）
  4. パフォーマンステスト

- **モックを活用**: インタラクティブな入力が必要な場合はモックを使用
- **ログの確認**: WARNING/ERRORログは必ず原因を調査

### 4. デバッグのアプローチ
- **エラーメッセージを丁寧に読む**: `TypeError: 'NoneType' object is not iterable` などは典型的
- **段階的な修正**: 一度に多くを変更せず、一つずつ問題を解決
- **フォールバック機構**: エラー時の自動フォールバックを実装
  ```typescript
  try {
    // 新機能の処理
    result = await newFeatureProcess()
  } catch (error) {
    console.warn(`New feature failed, falling back: ${error}`)
    result = legacyProcess()  // フォールバック
  }
  ```

### 5. プルリクエストの管理
- **こまめなコミット**: バグ修正は発見次第すぐにコミット・プッシュ
- **説明は英語で丁寧に**: Known Limitations も含めて正直に記載
- **テスト結果を明記**: 成功したテストケースを具体的に示す
- **両方のテスト**: 単体テスト（Vitest）とE2Eテスト（Playwright）の両方を実行して結果を報告

### 6. パフォーマンス測定
- **Before/After の比較**: 改善前後の数値を具体的に示す
- **複数回の測定**: 単発ではなく複数回測定して平均を取る

## プロジェクト固有の注意事項

### DSL Maker 特有の考慮点
- **YAML生成**: DSL生成後は必ずYAMLパースが成功することを確認
- **ノードタイプ**: 新しいワークフローノードを追加する際は`NODE_TYPES`を拡張
- **状態同期**: React FlowとZustandストアの同期を常に考慮
- **バリデーション**: DSL構造とノード接続の両方を検証

### AI機能のAPI設定
**重要**: AI機能を使用するには必ず以下のAPI設定を行ってください：

#### 1. 環境変数の設定（推奨）
プロジェクトルートに `.env.local` ファイルを作成：

```bash
# .env.local ファイル
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
```

#### 2. セッション変更時の注意
**問題**: セッションが変わるとブラウザの設定がリセットされる
**解決**: 必ず `.env.local` で環境変数設定を行う

#### 3. 設定確認方法
```bash
# 環境変数が正しく読み込まれているか確認
echo $OPENAI_API_KEY
```

#### 4. トラブルシューティング
- `❌ Error: ⚠️ Please configure your LLM settings first` が出る場合
  → `.env.local` ファイルが正しく設定されているか確認
  → 開発サーバーを再起動（`npm run dev:clean`）

### 一般的なベストプラクティス
- **TypeScript活用**: 可能な限り型ヒントを活用してバグを予防
- **エラーハンドリング**: graceful degradationを心がける
- **セキュリティ**: APIキーや機密情報をコードに含めない

## 開発サーバー管理

### ポート衝突対策
開発サーバーを起動する前に、既存のプロセスを確実に停止する：

```bash
# 既存の開発サーバーを停止（推奨方法）
lsof -ti:3000,3001,3002,3003,3004 | xargs -r kill -9

# 開発サーバーを起動
npm run dev
```

### 開発サーバーの状態確認
```bash
# 実行中のnpm run devプロセスを確認
ps aux | grep "npm run dev" | grep -v grep

# 特定ポートの使用状況を確認
lsof -i:3000

# ポート使用中のプロセスを強制終了
lsof -ti:3000 | xargs kill -9
```

### トラブルシューティング
- **ポート衝突**: 上記のポート停止コマンドを実行
- **プロセス残存**: `ps aux | grep node` でNode.jsプロセスを確認
- **キャッシュ問題**: `.next`フォルダを削除して再起動

## コマンドリファレンス

### よく使うコマンド
```bash
# 開発サーバー（ポート衝突対策含む）
npm run dev:clean              # 推奨：自動クリーンアップ付き起動
# または手動で
lsof -ti:3000,3001,3002,3003,3004 | xargs -r kill -9 && npm run dev

# テスト関連
npm test                    # Vitestで単体テスト実行
npx playwright test         # Playwright E2Eテスト実行
npx vitest                  # ウォッチモードで単体テスト
npx vitest --ui            # UIモードで単体テスト（ブラウザ）

# コード品質
npm run lint               # ESLint実行
npm run build              # プロダクションビルド

# Git関連
git checkout -b feature/xxx     # featureブランチ作成
git add -p                      # 対話的にステージング
git commit --amend             # 直前のコミットを修正

# 手動テスト
node test-complete-flow-final.js  # E2E統合テスト
node test-real-llm.js             # LLM統合テスト
```

## 今回の教訓
1. **完璧を求めすぎない**: 動くコードを作ってから改善
2. **エラーは成長の機会**: エラーから学んで堅牢なコードへ
3. **テストの重要性**: 単体テストとE2Eテストの両方で品質を保証
4. **コミュニティへの貢献**: 不完全でも価値ある貢献になる
5. **過剰評価の禁止**: 失敗を成功として報告することは絶対に避ける

## 🚨 重要：API設定に関する絶対的なルール

### 実装作業時の必須確認事項
**API設定を変更する前に必ず以下を確認すること：**

1. **現在の動作確認**: 既存の機能が正常に動作しているかを最初に確認
2. **.envファイルの確認**: 既存の設定値を記録してから変更
3. **ブラウザ設定の確認**: 実際に使用されている設定を確認
4. **バックアップ**: 動作している設定は必ず記録・保存

### API設定変更時の絶対禁止事項
- ❌ **推測による設定変更**: 「たぶんこれだろう」で設定を変更してはならない
- ❌ **動作確認なしの変更**: 現在の動作状況を確認せずに変更してはならない
- ❌ **エラー原因の思い込み**: エラーが出たときに原因を推測で決めつけてはならない
- ❌ **設定の破壊**: 動作している設定を勝手に「修正」してはならない

### 正しいトラブルシューティング手順
1. **エラー内容の正確な把握**: 実際のエラーメッセージを詳細に確認
2. **設定値の確認**: .envファイルとブラウザ設定の両方を確認
3. **API仕様の確認**: 使用するモデル/エンドポイントの正しい仕様を確認
4. **段階的修正**: 一度に一つずつ設定を変更してテスト

### DSLMaker固有のAPI設定
- **正しい設定**: `OPENAI_BASE_URL=https://api.openai.com/v1`, `OPENAI_MODEL=gpt-5-mini`
- **gpt-5-mini**: `/responses` エンドポイントを使用
- **設定場所**: ブラウザの設定モーダル（歯車アイコン）で確認・変更可能

---
*Last Updated: 2025-09-28*