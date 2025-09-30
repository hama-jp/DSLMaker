# Difyフロー実用化のための調査レポート

## 調査目的
- DSL Makerでより現実的・業務レベルなDify Workflow DSLを生成するために必要な要件を整理する。
- 既存ドキュメント（社内/外部）の知見を統合し、優先的に解決すべき課題と改善アクションを明確化する。

## 調査範囲と方法
- リポジトリ内検索（`rg "Dify"`）で既存の改善計画や仕様ドキュメントを抽出し、現状の制約を把握。
- Dify公式ドキュメント（GitHub: `langgenius/dify-docs`）からWorkflow関連のMarkdown（`en/guides/workflow/*.mdx`）を取得し、ノード機能・エラー処理・デバッグ・変数管理・構造化出力のベストプラクティスを整理。
- 得られた知見をDSL Makerに必要な機能要件と実装タスクへ落とし込む。

## DSL Maker現状の整理
- **ノード対応の不足**: `AI_WORKFLOW_GENERATION_IMPROVEMENT_PLAN.md`が指摘する通り、Start/LLM/End以外の主要ノード（条件分岐・ループ・HTTP・Knowledge Retrieval等）が生成対象外。
- **LLM出力の適合性問題**: `production-readiness-review.md`では、LLMがYAML出力に偏ることでJSON→YAML変換フローが破綻するリスクが示唆されている。
- **状態管理の未整備**: `docs/dify-workflow-analysis.md`は豊富なノード・変数仕様を整理しているが、DSL Makerの生成ロジックはこれらを十分に活用できていない。
- **エラー/検証機構の未実装**: 生成DSLの妥当性確認や実行時エラーに備えた仕組みが限定的。

## Dify公式ドキュメントから得た実践的要件
### ワークフロー構造と思考パターン
- Workflowはチャットフローと自動化フローの2系統があり、ユースケースに応じたノード構成テンプレートが推奨される（Introductionガイド[^intro]）。
- 代表的ユースケース（顧客対応、ドキュメント分析、タスク自動化など）ごとにノード組み合わせのパターン化が必要。

### 変数と状態管理
- Startノードでの入力変数設計、システム変数（`sys.*`）、環境変数、会話変数など複数レイヤーの変数が提供されており、DSL生成時に適切な参照パスを自動配線する必要がある（Variablesガイド[^variables]）。
- 機密情報は環境変数で保持し、ノード間には読み取り専用で引き回す前提。

### エラー処理と信頼性
- LLM / HTTP / Code / Toolノードにはリトライ設定・デフォルト値・Fail Branchによるフォールバックが標準装備されており、実践的なDSLではこれらの戦略を組み込む想定（Error Handlingガイド[^error_handling]）。
- ワークフローは成功／失敗／部分成功を明示的に区別し、ログで追跡可能にする。

### 構造化出力と検証
- JSON SchemaベースでのStructured Outputを推奨し、モデル選定・リトライ・Fail Branchとの組み合わせで堅牢性を確保する（Structured Outputsガイド[^structured_outputs]）。
- スキーマ違反時の自動修復ループ（例: Codeノードで再フォーマット）を用意することで実運用に耐える。

### ファイルやマルチモーダル対応
- `sys.files`を介したアップロードファイルのルーティング、Document Extractorによる前処理、Vision対応LLMの活用など、メディア種別ごとの分岐が求められる（Additional Featuresガイド[^additional_features]）。
- MixedモードではList Operationノードでフィルタリングし、ノード種別ごとに適切な処理系へ分配するのが推奨パターン。

### デバッグと運用観測
- Step Run／Variable Inspector／Run Historyといったデバッグ支援機能を前提に、ノード単位での検証可能な形にDSLを生成する必要がある（Debug Nodeガイド[^step_run]）。
- 生成DSLにも検証用のテストデータや実行コメントを添えると、利用者がDify上でのステップ実行を行いやすい。

## 実用的なフローを自動生成するための優先アクション
1. **ノードカバレッジ拡張**: `docs/dify-workflow-analysis.md`が列挙する主要ノードを型定義・プロンプト知識ベースに追加し、ユースケース別ブループリントとして抽象化。
2. **要件ヒアリングとワークフロー設計の分離**: 入力要件をIntent／入力データ種別／出力フォーマット／エラーポリシーに分解し、上記構造にマッピングする中間表現を導入。
3. **変数マッピング自動化**: Startノードでの環境変数・システム変数・会話変数のスキャフォールドを自動生成し、各ノードの入力パラメータに参照を配線するロジックを追加。
4. **信頼性オプションのデフォルト化**: 主要ノードにリトライ・Fail Branch・Default Valueの雛形を組み込み、例外時のフォールバック（例: 代替LLM、コード分割）もテンプレート化。
5. **構造化出力支援**: JSON Schemaの自動生成（モデル対応表付き）と、スキーマ違反時に再フォーマットするError Branchの生成を標準装備。
6. **マルチモーダル処理のルーティング**: `sys.files`のリスト操作やDocument Extractorとの連携を自動挿入し、アップロードファイルの型に応じた分岐パターンを提供。
7. **デバッグメタデータ生成**: Step Run用のダミー入力、Variable Inspectorで確認すべきキー情報、Run Historyで追跡するためのノード名規約を生成物に含める。
8. **検証・Lintパイプライン**: 生成DSLに対してローカルで構造検証／ノード接続チェック／変数参照検証を行うテストスイートを整備し、失敗時は改善フィードバックをLLMに返すループを構築。

## 推奨次のステップ
- 既存`src/utils/workflow-state-helpers.ts`を中心に、ノードスキーマと変数辞書の拡充タスクを洗い出す。
- プロンプト側のシステムインストラクションを、上記テンプレート・エラーハンドリング・構造化出力要件を反映する形に再設計。
- 生成DSLをDify上でインポート→Step Run→エラーハンドリング確認まで行う回帰シナリオを`tests/`配下に追加し、実効性の検証を自動化。

## 参考資料
- Dify Docs — Workflow Introduction[^intro]
- Dify Docs — Additional Features[^additional_features]
- Dify Docs — Variables[^variables]
- Dify Docs — Error Handling[^error_handling]
- Dify Docs — Structured Outputs[^structured_outputs]
- Dify Docs — Debug Node (Step Run)[^step_run]
- DSL Makerリポジトリ内ドキュメント: `AI_WORKFLOW_GENERATION_IMPROVEMENT_PLAN.md`, `production-readiness-review.md`, `docs/dify-workflow-analysis.md`

[^intro]: https://raw.githubusercontent.com/langgenius/dify-docs/main/en/guides/workflow/README.mdx
[^additional_features]: https://raw.githubusercontent.com/langgenius/dify-docs/main/en/guides/workflow/additional-features.mdx
[^variables]: https://raw.githubusercontent.com/langgenius/dify-docs/main/en/guides/workflow/variables.mdx
[^error_handling]: https://raw.githubusercontent.com/langgenius/dify-docs/main/en/guides/workflow/error-handling/README.mdx
[^structured_outputs]: https://raw.githubusercontent.com/langgenius/dify-docs/main/en/guides/workflow/structured-outputs.mdx
[^step_run]: https://raw.githubusercontent.com/langgenius/dify-docs/main/en/guides/workflow/debug-and-preview/step-run.mdx

## 改善タスクドラフト（Issue化下書き）
1. **[P0] ノードタイプ定義の網羅と同期**
   - 背景: `src/constants/node-types.ts:1` が Start/LLM/End など最小集合のみを保持し、`src/types/dify-workflow.ts:210` 以降に定義されている Agent／Document Extractor／Loop 等との整合が取れていない。React Flow変換ロジック（`src/utils/flow-converter.ts:500` 付近）でも文字列リテラルを直接スイッチしており、型安全性と拡張性が欠如。
   - 対応: NODE_TYPES へ公式仕様の全ノードタイプを追加し、`DifyNode` ユニオン・Flow変換・生成器（`src/utils/node-generators/*`）で共通定数を使用。Answerノードなど未定義タイプも型追加。
   - 成功条件: 新ノードタイプを追加しても型エラーが発生せず、デフォルトノード生成が共通定数を参照。ユニットテスト（最低限 lint + 型チェック）で差分確認。

2. **[P1] デフォルトノードデータの構造整備とエラーポリシー雛形**
   - 背景: `src/utils/flow-converter.ts:520` 以降で生成するデフォルトデータが仕様と乖離（例: Variable Assignerは `assignments` キーだが型は `variables` を要求）。Error HandlingやRetry設定が欠落し、DSL出力が実用レベルにならない。
   - 対応: 各ノードタイプのデフォルトデータを `DifyNode` 型に準拠させ、Error Handling関連フィールド（`error_strategy`、`max_retries`、`retry_interval` 等）を初期化。Structured Output/JSON Schema を利用するLLMノードのベース設定もここで注入。
   - 成功条件: 代表ノードのデフォルト値がDifyにインポート可能、既存テストに失敗なし、必要なら追加テストでノード生成結果をスナップショット確認。

3. **[P1] 変数スキャフォールドと辞書管理の導入**
   - 背景: 現実運用では `sys.*` や環境変数のスキャフォールド生成が必須だが、`workflow-state-helpers.ts:8` 周辺では単純クローンのみで変数辞書管理が欠落。Startノードの変数やノード間参照を自動補完できず、生成されたDSLの手直しが多い。
   - 対応: Startノード変数テンプレート、システム変数の参照辞書、ノード生成時の `value_selector` 自動配線ロジックをユーティリティとして追加。Requirement Analyzerの出力と連携して入力意図→変数定義を自動化。
   - 成功条件: 代表ユースケース（ドキュメント処理、RAG、自動化）で生成されたDSLが Start ノードと後続ノード間で適切に変数参照を構築。追加のユニットテストで変数辞書が欠落していないことを検証。

4. **[P2] 検証・デバッグ用メタデータの自動付与**
   - 背景: レポートで言及した Step Run / Variable Inspector を活用するためには、ノード名規約やテスト入力が必要だが現状未サポート。
   - 対応: `workflow-state-helpers.ts` または関連ストアで、プレビュー用スナップショットにデバッグメタデータ（例: `__test_inputs__`, `__debug_notes__`）を付与し、生成DSLへコメント/メタ情報を埋め込むオプションを追加。
   - 成功条件: 生成DSLをDifyにインポート後すぐにStep Runが可能で、推奨テスト入力がUI上に反映されることを手動確認。

> 優先度は P0 → P2 の順で着手。各タスク完了後にE2Eの回帰（最小構成: DSL生成→構造検証→Difyインポート）を実施すること。
