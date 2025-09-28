# Dify Workflow DSL 技術リファレンスマニュアル

## DSLファイルの基本構造と形式

Dify DSL (Domain Specific Language) は、**YAML形式 (.yml)** で記述されるAIアプリケーションエンジニアリングファイル規格です。このファイル形式は、フロントエンドキャンバスのJSON構造をより人間が読みやすいYAML形式に変換したもので、ワークフローの完全な定義、ビジュアル表現の位置情報、および実行ロジックを含んでいます。

**ファイル拡張子**: `.yml` (必須、`.yaml`ではない)

## ファイルのトップレベル構造とメタデータ

DSLファイルは以下の3つの必須トップレベルセクションで構成されます：

```yaml
app:
  description: 'アプリケーションの説明'
  icon: '🤖'  # Unicodeの絵文字またはアイコン識別子
  icon_background: '#EFF1F5'  # 16進数カラーコード
  mode: 'workflow'  # または 'advanced-chat' (Chatflow用)
  name: 'アプリケーション名'
  use_icon_as_answer_icon: false  # オプション

kind: app  # 常に "app" を指定
version: 0.1.5  # セマンティックバージョニング形式

workflow:
  # ワークフロー定義の本体
  conversation_variables: []  # 会話変数（Chatflowのみ）
  environment_variables: []   # 環境変数（APIキーなど）
  features: {}                # 機能設定
  graph:                      # ワークフローグラフ定義
    edges: []                 # ノード間の接続
    nodes: []                 # ノード定義
```

### メタデータの詳細仕様

**app セクション**の各プロパティ：
- `description` (String, オプション): 最大200文字の説明文
- `icon` (String, 必須): Unicode絵文字またはアイコンID
- `icon_background` (String, 必須): #RRGGBB形式の背景色
- `mode` (String, 必須): `workflow`、`advanced-chat`、`agent-chat`、`chat`のいずれか
- `name` (String, 必須): 表示名（最大100文字）

## 主要なノードタイプとプロパティ仕様

### 1. Start ノード

ワークフローのエントリーポイントを定義します。

```yaml
- id: 'start-node'
  type: start
  data:
    title: 'Start'
    variables:
      - name: 'user_input'
        type: 'text-input'  # または 'number', 'select', 'file', 'file-list'
        description: '入力の説明'
        max_length: 1000  # text-input用（0は無制限）
        default: ''       # デフォルト値
        required: true    # 必須/オプション
```

**利用可能な変数タイプ**：
- `text-input`: テキスト入力（max_length設定可能）
- `number`: 数値入力
- `select`: ドロップダウン選択（optionsプロパティ必須）
- `file`: 単一ファイルアップロード
- `file-list`: 複数ファイルアップロード
- `object`: JSON構造データ（Workflowのみ）

**システム変数（自動提供）**：
- Workflow: `sys.user_id`, `sys.app_id`, `sys.workflow_id`, `sys.workflow_run_id`, `sys.files`
- Chatflow追加: `sys.query`, `sys.conversation_id`, `sys.dialogue_count`

### 2. LLM ノード

大規模言語モデルを呼び出します。

```yaml
- id: 'llm-node'
  type: llm
  data:
    title: 'LLM処理'
    model:
      provider: 'openai'  # 必須
      name: 'gpt-4'       # 必須
      mode: 'chat'        # 'chat' または 'completion'
      completion_params:
        temperature: 0.7     # 0-2 (創造性制御)
        top_p: 1.0          # 0-1 (核サンプリング)
        max_tokens: 1024    # 最大出力トークン数
        presence_penalty: 0  # -2 to 2
        frequency_penalty: 0 # -2 to 2
    prompt_template:  # Chat形式またはString形式
      - role: 'system'
        text: 'あなたは助けになるアシスタントです'
      - role: 'user'
        text: '{{#start.user_input#}}'  # 変数参照
    memory:  # オプション
      role_prefix:
        user: 'User'
        assistant: 'Assistant'
      window:
        enabled: true
        size: 10  # 保持する会話数
    vision:  # マルチモーダル対応（オプション）
      enabled: true
```

### 3. Knowledge Retrieval ノード

知識ベースから関連情報を取得します。

```yaml
- id: 'knowledge-node'
  type: knowledge-retrieval
  data:
    title: '知識検索'
    query_variable_selector: ['start', 'query']  # クエリ変数の参照
    dataset_ids: ['dataset-uuid-1', 'dataset-uuid-2']  # 必須
    retrieval_mode: 'multiWay'  # または 'oneWay'
    multiple_retrieval_config:  # multiWay用
      top_k: 3                  # 取得件数
      score_threshold: 0.5      # 最小類似度スコア
      reranking_enable: true    # リランキング有効化
      reranking_model:
        provider: 'cohere'
        model: 'rerank-english-v2.0'
    metadata_filters:  # オプション
      - key: 'category'
        operator: 'equals'  # 'equals', 'not_equals', 'contains', 'gte', 'lte'
        value: 'technical'
```

### 4. Code ノード

カスタムPythonまたはJavaScriptコードを実行します。

```yaml
- id: 'code-node'
  type: code
  data:
    title: 'カスタム処理'
    code_language: 'python3'  # または 'javascript'
    code: |
      def main(input1: str, input2: int) -> dict:
          # 処理ロジック
          result = input1.upper() + str(input2)
          return {
              'output': result,
              'status': 'success'
          }
    inputs:  # 入力変数定義
      input1:
        type: 'string'
        required: true
      input2:
        type: 'number'
        required: false
        default: 0
    outputs:  # 出力変数定義（必須）
      output:
        type: 'string'
      status:
        type: 'string'
```

**セキュリティ制限**：
- ファイルシステムアクセス不可
- ネットワークリクエスト不可
- システムコマンド実行不可
- メモリ・CPU使用量制限あり

### 5. Tool ノード

外部ツールやサービスを統合します。

```yaml
- id: 'tool-node'
  type: tool
  data:
    title: 'ツール呼び出し'
    provider_type: 'builtin'  # 'builtin', 'app', 'workflow'
    provider_id: 'google'
    tool_name: 'google_search'
    tool_parameters:
      query: '{{#start.search_term#}}'
      max_results: 5
      language: 'ja'
    tool_configurations:
      api_key: '${GOOGLE_API_KEY}'  # 環境変数参照
      timeout: 30
      retry_attempts: 3
    error_strategy: 'default_value'  # または 'fail_branch'
    default_value: '結果が見つかりません'
```

### 6. IF/ELSE ノード（条件分岐）

条件に基づいてフローを分岐します。

```yaml
- id: 'if-else-node'
  type: if-else
  data:
    title: '条件判定'
    logical_operator: 'and'  # 'and' または 'or'
    conditions:
      - id: 'condition_1'
        variable_selector: ['start', 'input_type']
        comparison_operator: 'equals'  # 比較演算子
        value: 'document'
      - id: 'condition_2'
        variable_selector: ['llm', 'text']
        comparison_operator: 'is not empty'
```

**利用可能な比較演算子**：
- 文字列: `equals`, `not equals`, `contains`, `not contains`, `start with`, `end with`, `is empty`, `is not empty`
- 数値: `=`, `≠`, `>`, `<`, `≥`, `≤`
- 配列: `contains`, `not contains`, `is empty`, `is not empty`

### 7. Iteration ノード

配列要素をループ処理します。

```yaml
- id: 'iteration-node'
  type: iteration
  data:
    title: '繰り返し処理'
    iterator_selector: ['start', 'items_array']  # 配列変数
    is_parallel: false      # 並列処理の有効化
    parallel_nums: 10       # 最大並列数
    error_strategy: 'terminated'  # 'terminated', 'continue on error', 'remove abnormal output'
```

**ビルトイン変数**（ループ内で利用可能）：
- `items`: 現在の要素
- `index`: 現在のインデックス（0ベース）

### 8. Template ノード

Jinja2テンプレートでテキストを変換します。

```yaml
- id: 'template-node'
  type: template-transform
  data:
    title: 'テンプレート変換'
    template: |
      {% for item in items %}
      ### {{ loop.index }}. {{ item.title }}
      **スコア**: {{ item.score | default('N/A') }}
      **内容**: {{ item.content | replace('\n', '\n\n') }}
      ---
      {% endfor %}
    variables:  # 使用する変数のセレクタ
      - ['knowledge', 'result']
```

### 9. Variable ノード

変数の割り当てや集約を行います。

```yaml
- id: 'variable-node'
  type: variable-assigner  # または variable-aggregator
  data:
    title: '変数管理'
    variables:  # variable-assigner用
      - variable: 'processed_data'
        value_selector: ['code', 'output']
    groups:  # variable-aggregator用（分岐の集約）
      - group_name: 'branch_results'
        variables:
          - variable: 'if_result'
            value_selector: ['if_branch', 'output']
          - variable: 'else_result'
            value_selector: ['else_branch', 'output']
```

### 10. End ノード

ワークフローの終了と出力を定義します。

```yaml
- id: 'end-node'
  type: end
  data:
    title: 'End'
    outputs:
      result:
        type: 'string'
        value_selector: ['llm', 'text']
      metadata:
        type: 'object'
        value_selector: ['processing', 'info']
      files:
        type: 'array[file]'
        value_selector: ['tool', 'files']
```

## エッジ（接続）の定義方法

ノード間の接続は`workflow.graph.edges`セクションで定義します：

```yaml
workflow:
  graph:
    edges:
      - data:
          isInIteration: false      # Iteration内部かどうか
          sourceType: 'start'        # ソースノードのタイプ
          targetType: 'llm'          # ターゲットノードのタイプ
        id: 'edge-uuid'             # エッジの一意識別子
        source: 'start-node'        # ソースノードID
        sourceHandle: 'source'      # ソースハンドル（'source', 'true', 'false'など）
        target: 'llm-node'          # ターゲットノードID
        targetHandle: 'target'      # ターゲットハンドル（通常'target'）
        type: 'custom'              # エッジタイプ（通常'custom'）
        zIndex: 0                   # レイヤー順序
```

**ハンドルタイプ**：
- 通常のノード: `source` → `target`
- IF/ELSEノード: `true`/`false`/`else` → `target`
- Iterationノード: 内部ノード間は`isInIteration: true`を設定

## 変数の定義と参照方法

### 変数参照構文

Difyでは独自の変数参照構文を使用します：

```yaml
# 基本的な変数参照
{{#node_id.variable_name#}}

# システム変数
{{#sys.user_id#}}
{{#sys.query#}}

# ネストされた変数
{{#knowledge.result[0].content#}}

# Iteration内のビルトイン変数
{{#iteration.items#}}  # 現在の要素
{{#iteration.index#}}  # 現在のインデックス
```

### 変数スコープ

1. **システム変数**: グローバルスコープ、読み取り専用、`sys.`プレフィックス
2. **環境変数**: ワークフローレベル、`${VARIABLE_NAME}`形式
3. **会話変数**: Chatflowのセッションスコープ、読み書き可能
4. **ノード出力変数**: ローカルスコープ、下流ノードから参照可能

## データ型と値の形式

### サポートされるデータ型

| データ型 | 説明 | 例 |
|---------|------|-----|
| `string` | UTF-8テキスト | `"Hello World"` |
| `number` | 整数または浮動小数点数 | `42`, `3.14` |
| `boolean` | 真偽値 | `true`, `false` |
| `object` | JSON構造データ | `{"key": "value"}` |
| `array[string]` | 文字列配列 | `["a", "b", "c"]` |
| `array[number]` | 数値配列 | `[1, 2, 3]` |
| `array[object]` | オブジェクト配列 | `[{"id": 1}, {"id": 2}]` |
| `file` | ファイルオブジェクト | メタデータ付きファイル |
| `array[file]` | ファイル配列 | 複数ファイル |

**型制約**：
- LLMノードは文字列入力のみ受け付ける
- 配列はLLM処理前に文字列変換が必要
- Variable Aggregatorは同一型のみ集約可能
- Codeノードは最大5レベルのネスト構造まで

## 条件式の記述方法

IF/ELSEノードで使用される条件式の構文：

```yaml
conditions:
  - variable: '{{#variable_path#}}'
    comparison_operator: 'operator'
    value: 'expected_value'
```

### 論理演算子の組み合わせ

```yaml
logical_operator: 'and'  # または 'or'
conditions:
  - variable: '{{#node1.output#}}'
    comparison_operator: 'contains'
    value: 'keyword'
  - variable: '{{#node2.score#}}'
    comparison_operator: 'greater_than'
    value: '0.7'
```

## テンプレート記法（Jinja2）

### 基本構文

```jinja2
# 変数展開
{{ variable_name }}

# デフォルト値付き
{{ variable | default('デフォルト値') }}

# 条件分岐
{% if score > 0.8 %}
  高スコア: {{ score }}
{% elif score > 0.5 %}
  中スコア: {{ score }}
{% else %}
  低スコア: {{ score }}
{% endif %}

# ループ処理
{% for item in items %}
  {{ loop.index }}. {{ item.name }}
  {% if loop.first %}最初の要素{% endif %}
  {% if loop.last %}最後の要素{% endif %}
{% endfor %}

# フィルター適用
{{ text | upper }}  # 大文字変換
{{ content | replace('\n', '\n\n') }}  # 改行置換
{{ number | round(2) }}  # 小数点丸め
```

### ループ変数

- `loop.index`: 1ベースのインデックス
- `loop.index0`: 0ベースのインデックス
- `loop.first`: 最初の要素かどうか
- `loop.last`: 最後の要素かどうか
- `loop.length`: 総要素数

## エラーハンドリング

### エラー処理戦略

各ノードで設定可能な3つのエラー処理戦略：

1. **None（デフォルト）**: エラー発生時にワークフロー停止
2. **Default Value**: 事前定義したフォールバック値で継続
3. **Fail Branch**: 代替処理パスへルーティング

```yaml
- id: 'error-prone-node'
  type: code
  data:
    error_strategy: 'fail_branch'  # または 'default_value', 'none'
    default_output_value: 'エラー時のデフォルト値'
    retry_config:
      retry_enabled: true
      max_retries: 3
      retry_interval: 1  # 秒
```

### エラー変数

エラーハンドリング有効時、下流ノードに渡される変数：
- `error_type`: エラーの分類
- `error_message`: 詳細なエラー説明

### 一般的なエラータイプ

- **LLMノード**: `LLMBadRequest`, `InsufficientAccountBalance`, `LLMModeRequiredError`
- **HTTPノード**: `HTTPResponseCodeError`, `RequestBodyError`, `FileFetchError`
- **Codeノード**: `CodeExecutionError`, `CodeNotFound`
- **Knowledge Retrievalノード**: `DatasetNotFound`, `RetrievalError`

## バージョン管理と互換性

### バージョン仕様

```yaml
version: 0.1.5  # セマンティックバージョニング (MAJOR.MINOR.PATCH)
```

### バージョン進化の歴史

- **v0.6.0**: 初期ワークフローサポート
- **v0.6.9**: Iterationノード、パラメータ抽出、Workflow-as-Tools
- **v1.1.0**: RAG用メタデータフィルタリング
- **v1.5.0**: リアルタイムデバッグ、変数トラッキング
- **v1.8.0+**: 強化されたエラーハンドリング、履歴からのエクスポート

### 互換性の注意点

- 新バージョンからエクスポートしたDSLファイルは古いバージョンで動作しない可能性
- メジャーバージョンアップグレード時はマイグレーションスクリプトの実行が必要
- 下位互換性は一般的に維持されるが、メジャーバージョン差では保証されない

## 実際のDSLファイルサンプル

### 完全なワークフローの例

```yaml
app:
  description: 'ドキュメント処理と質問応答ワークフロー'
  icon: '📚'
  icon_background: '#E4F2FF'
  mode: workflow
  name: 'Document QA Workflow'

kind: app
version: 0.1.5

workflow:
  environment_variables:
    - name: OPENAI_API_KEY
      value: ''  # デプロイ時に設定
  
  features:
    file_upload:
      image:
        enabled: false
        number_limits: 3
        transfer_methods:
          - local_file
          - remote_url
    retriever_resource:
      enabled: true
  
  graph:
    edges:
      - data:
          isInIteration: false
          sourceType: start
          targetType: knowledge-retrieval
        id: 'edge1'
        source: 'start-1'
        sourceHandle: 'source'
        target: 'knowledge-1'
        targetHandle: 'target'
        type: 'custom'
      
      - data:
          isInIteration: false
          sourceType: knowledge-retrieval
          targetType: template-transform
        id: 'edge2'
        source: 'knowledge-1'
        sourceHandle: 'source'
        target: 'template-1'
        targetHandle: 'target'
        type: 'custom'
      
      - data:
          isInIteration: false
          sourceType: template-transform
          targetType: llm
        id: 'edge3'
        source: 'template-1'
        sourceHandle: 'source'
        target: 'llm-1'
        targetHandle: 'target'
        type: 'custom'
      
      - data:
          isInIteration: false
          sourceType: llm
          targetType: end
        id: 'edge4'
        source: 'llm-1'
        sourceHandle: 'source'
        target: 'end-1'
        targetHandle: 'target'
        type: 'custom'
    
    nodes:
      - id: 'start-1'
        type: start
        position:
          x: 30
          y: 200
        data:
          title: 'Start'
          variables:
            - name: 'query'
              type: 'text-input'
              description: 'ユーザーの質問'
              required: true
              max_length: 500
      
      - id: 'knowledge-1'
        type: knowledge-retrieval
        position:
          x: 250
          y: 200
        data:
          title: '知識検索'
          query_variable_selector: ['start-1', 'query']
          dataset_ids: ['your-dataset-id']
          retrieval_mode: 'multiWay'
          multiple_retrieval_config:
            top_k: 3
            score_threshold: 0.5
            reranking_enable: true
      
      - id: 'template-1'
        type: template-transform
        position:
          x: 470
          y: 200
        data:
          title: 'コンテキスト形成'
          template: |
            関連ドキュメント:
            {% for chunk in result %}
            ---
            ドキュメント {{ loop.index }}:
            {{ chunk.content }}
            {% endfor %}
          variables:
            - ['knowledge-1', 'result']
      
      - id: 'llm-1'
        type: llm
        position:
          x: 690
          y: 200
        data:
          title: '回答生成'
          model:
            provider: 'openai'
            name: 'gpt-4'
            mode: 'chat'
            completion_params:
              temperature: 0.3
              max_tokens: 1000
          prompt_template:
            - role: 'system'
              text: |
                以下のコンテキストに基づいて、ユーザーの質問に正確に答えてください。
                コンテキストに情報がない場合は、その旨を明記してください。
            - role: 'user'
              text: |
                コンテキスト:
                {{#template-1.output#}}
                
                質問: {{#start-1.query#}}
      
      - id: 'end-1'
        type: end
        position:
          x: 910
          y: 200
        data:
          title: 'End'
          outputs:
            answer:
              type: 'string'
              value_selector: ['llm-1', 'text']
```

## ベストプラクティスと注意点

### ファイル構成のベストプラクティス

1. **明確な命名規則**
   - 説明的な名前を使用: `customer-support-v2.yml`
   - 環境プレフィックスを付ける: `prod-workflow.yml`, `staging-workflow.yml`
   - バージョン番号を含める: `data-processing-v1.2.yml`

2. **包括的なドキュメント化**
   ```yaml
   app:
     description: |
       Customer Support Chatbot v2.1
       - Tier 1サポートクエリの処理
       - ナレッジベース統合
       - 複雑な問題の人間エージェントへのエスカレーション
       
       最終更新: 2025-01-15
       依存関係: OpenAI API, Knowledge Base #KB001
   ```

3. **変数名の一貫性**
   - snake_case を使用: `user_query`, `processed_result`
   - 意味のある名前を付ける
   - システム変数との競合を避ける

### パフォーマンス最適化

1. **並列処理の活用**
   ```yaml
   # 独立したタスクは並列実行
   edges:
     - source: 'start'
       target: 'web-scraper'
     - source: 'start'
       target: 'knowledge-retrieval'
   ```

2. **LLM呼び出しの最適化**
   ```yaml
   completion_params:
     temperature: 0.1      # 一貫性のため低めに設定
     max_tokens: 500       # 必要最小限に制限
     top_p: 0.9           # 高確率トークンに集中
   ```

3. **条件分岐による早期終了**
   ```yaml
   # シンプルなクエリは高速パスへルーティング
   if_else_node:
     conditions:
       - variable: '{{#start.complexity#}}'
         comparison_operator: 'equals'
         value: 'simple'
   ```

### よくあるエラーと対策

1. **変数参照エラー**
   ```yaml
   # ❌ 間違い
   prompt: "Answer: {start.input}"
   
   # ✅ 正解
   prompt: "Answer: {{#start.input#}}"
   ```

2. **型の不一致**
   ```yaml
   # ❌ 配列を文字列として扱う
   prompt: "Items: {{#node.array_output#}}"
   
   # ✅ テンプレートで変換
   template: |
     {% for item in node.array_output %}
     - {{ item }}
     {% endfor %}
   ```

3. **ノード接続の不整合**
   ```yaml
   # エッジのsource/targetがノードIDと一致することを確認
   edges:
     - source: 'actual-node-id'  # 実際のノードIDと一致
       target: 'another-node-id'
   ```

### デバッグとバリデーション

1. **YAMLシンタックスチェック**
   ```bash
   yamllint workflow.yml
   ```

2. **DSLインポート検証**
   ```bash
   curl -X POST http://localhost:3000/console/api/apps/import \
     -H "Content-Type: multipart/form-data" \
     -F "dsl=@workflow.yml"
   ```

3. **デバッグ変数の追加**
   ```yaml
   - id: 'debug-checkpoint'
     type: variable-assigner
     data:
       variables:
         - variable: 'debug_info'
           value: 'Checkpoint reached at {{#sys.timestamp#}}'
   ```

## まとめ

Dify Workflow DSLは、AIワークフローを定義するための強力で柔軟な仕様です。YAML形式による可読性の高い構造、豊富なノードタイプ、Jinja2テンプレートによる動的な処理、包括的なエラーハンドリング機能により、複雑なAIアプリケーションの構築が可能です。外部エディタでDSLファイルを直接編集する際は、本リファレンスマニュアルの仕様に従い、特に変数参照構文、データ型の制約、ノード間接続の整合性に注意してください。