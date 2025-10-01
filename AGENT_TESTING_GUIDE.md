# Agent Testing and Improvement Guide

## 完成した作業 ✅

### 1. Difyノード実装（フロントエンド）
- ✅ 全15種類のDifyノードタイプを実装完了
- ✅ イテレーションノードの子ノード包含機能を実装
- ✅ React Flowの親子関係（`parentId`, `extent: 'parent'`）に対応
- ✅ DeepResearchワークフロー（23ノード）で動作確認済み
- ✅ Unknown Nodes: 0個

### 2. プロンプト改善の基盤構築（バックエンド）
- ✅ 実Difyワークフローから13種類のノード例を抽出
- ✅ 18のワークフローパターンを分類・整理
- ✅ ノードテンプレートを `backend/prompts/` に生成
- ✅ 包括的なエージェント設計ドキュメント作成
- ✅ RequirementsAgent用の単体テスト作成（10テストケース）
- ✅ ArchitectureAgent用の単体テスト作成（15テストケース）

## 作業の成果物

### 生成されたファイル

```
backend/
├── docs/
│   └── agent_design.md                    # エージェント設計の詳細ドキュメント
├── prompts/
│   ├── node_examples.json                 # 13種類のノードの実例
│   ├── node_templates.md                  # プロンプト用ノードテンプレート
│   └── workflow_patterns.json             # 18のワークフローパターン
├── extract_node_examples.py               # ノード例抽出スクリプト
├── run_agent_tests.sh                     # テスト実行スクリプト
└── tests/
    └── agents/
        ├── test_requirements_agent.py     # RequirementsAgentテスト（10ケース）
        └── test_architecture_agent.py     # ArchitectureAgentテスト（15ケース）
```

## 次のステップ（優先順位順）

### Phase 1: テスト環境のセットアップ ⚡ 最優先

```bash
# 1. バックエンドの依存関係インストール
cd backend
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-cov

# 2. テストを実行して現状確認
./run_agent_tests.sh

# 3. 失敗したテストを分析
# - どのテストが失敗しているか
# - なぜ失敗しているか
# - エージェントプロンプトの何を改善すべきか
```

### Phase 2: エージェントプロンプトの改善

#### RequirementsAgent の改善
現在のプロンプト（`backend/app/agents/requirements_agent.py`）を、実際のDifyノードタイプを意識したものに更新：

```python
# 改善前（抽象的）
SYSTEM_PROMPT = """Extract requirements from user input..."""

# 改善後（Dify DSL特化）
SYSTEM_PROMPT = """
You are a requirements analyst for Dify workflow generation.

Extract requirements and map them to these EXACT Dify node types:
- start: Entry point
- llm: LLM processing (GPT-4, Claude, etc.)
- tool: External tools (tavily_search, http_request, etc.)
- knowledge-retrieval: Search knowledge base
- if-else: Conditional branching
- iteration: Loop over arrays
- code: Python/NodeJS code execution
- template-transform: Format output
- end/answer: Workflow completion

Examples from real workflows:
1. "Create a chatbot" → capabilities: ["start", "llm", "end"]
2. "Search web and summarize" → capabilities: ["start", "tool", "llm", "end"]
3. "Process list of items" → capabilities: ["start", "iteration", "llm", "end"]

Extract:
{
  "business_intent": "Brief description",
  "required_capabilities": ["start", "llm", ...],  // Exact Dify node types
  "constraints": ["use GPT-4", ...],
  "input_format": "text|array|document",
  "output_format": "text|json|markdown"
}
"""
```

#### ArchitectureAgent の改善
`backend/prompts/node_templates.md` から実例を読み込んでプロンプトに組み込む：

```python
# prompts/node_templates.md を読み込み
with open('prompts/node_templates.md', 'r') as f:
    node_templates = f.read()

SYSTEM_PROMPT = f"""
You are a Dify workflow architect.

{node_templates}

Design workflow using these templates. Ensure:
1. Correct node types from the list above
2. Proper data flow between nodes
3. Variable references use {{node_id.output}} format
4. Node positions are arranged left-to-right

Return valid JSON architecture.
"""
```

### Phase 3: イテレーションとチューニング

```
1. テスト実行 → 2. 失敗分析 → 3. プロンプト改善 → 1に戻る

目標:
- RequirementsAgent: >80% テストパス率
- ArchitectureAgent: >80% テストパス率
- 平均レイテンシ: <5秒
- 生成DSLのDifyスキーマ準拠率: >95%
```

### Phase 4: ConfigurationAgentとQualityAgentの改善

Requirements/Architectureが安定したら、次の2つを改善：

1. **ConfigurationAgent**:
   - ノードの詳細設定（model, temperature, promptなど）
   - `node_examples.json` から実例を参照
   - 正しいプロバイダー設定（openai, anthropic, etc.）

2. **QualityAgent**:
   - Dify Pydanticスキーマでバリデーション
   - 変数参照の妥当性チェック
   - エッジ接続の検証
   - スコアリングロジックの改善

## 実装の優先順位

### 今すぐやるべきこと（1-2日）
1. ✅ バックエンド依存関係インストール
2. ✅ テスト実行して現状把握
3. ✅ RequirementsAgentプロンプトを実例ベースに更新
4. ✅ テスト再実行して改善確認

### 今週中にやるべきこと
5. ArchitectureAgentプロンプトを更新
6. ConfigurationAgentに実ノード設定を追加
7. QualityAgentにDifyスキーマバリデーションを追加
8. 全エージェントで >80% テストパス率を達成

### 来週以降
9. RAGベースのパターン検索を実装
10. フィードバックループで継続改善
11. 実ユーザー要求でのE2Eテスト
12. パフォーマンス最適化

## テスト実行方法

### 全テスト実行
```bash
cd backend
./run_agent_tests.sh
```

### 特定エージェントのみ
```bash
python3 -m pytest tests/agents/test_requirements_agent.py -v
python3 -m pytest tests/agents/test_architecture_agent.py -v
```

### 特定テストケースのみ
```bash
python3 -m pytest tests/agents/test_requirements_agent.py::TestRequirementsAgent::test_simple_qa_chatbot -v
```

### カバレッジ付き
```bash
python3 -m pytest tests/agents/ --cov=app/agents --cov-report=term-missing
```

## 成功の指標

### 定量的指標
- ✅ **テストパス率**: >80% （現状: 未測定）
- ✅ **DSLスキーマ準拠率**: >95% （Pydanticバリデーション）
- ✅ **レイテンシ**: <5秒/リクエスト (p95)
- ✅ **Unknown Nodes**: 0個 （フロントエンド）

### 定性的指標
- ✅ 生成されたワークフローがDifyで実行可能
- ✅ ノード設定が適切（model, prompt, parametersなど）
- ✅ 変数参照が正しい（`{{node_id.output}}`形式）
- ✅ エッジ接続に矛盾がない

## トラブルシューティング

### テストが実行できない
```bash
# 依存関係を再インストール
pip install --upgrade pip
pip install -r backend/requirements.txt
pip install pytest pytest-asyncio pytest-cov
```

### エージェントがタイムアウトする
- LLMのレート制限を確認
- `OPENAI_API_KEY` 環境変数を確認
- プロンプトが長すぎないか確認

### テストが全部失敗する
1. まず1つのテストだけ実行して詳細を確認
2. エージェントのログ出力を見る（`logger.info`）
3. 実際の出力と期待値を比較
4. プロンプトを段階的に改善

## 参考資料

- [agent_design.md](backend/docs/agent_design.md) - エージェント設計の詳細
- [node_templates.md](backend/prompts/node_templates.md) - Difyノードテンプレート
- [node_examples.json](backend/prompts/node_examples.json) - 実ノード例
- [workflow_patterns.json](backend/prompts/workflow_patterns.json) - ワークフローパターン

---

**Last Updated**: 2025-10-02
**Status**: Phase 1 完了、Phase 2 準備完了
