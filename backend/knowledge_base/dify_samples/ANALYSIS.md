# Dify DSL Format Analysis

## Overview
Exported 8 Dify applications across 4 different modes to understand the complete DSL structure.

## Sample Summary

### 1. Workflow Mode (3 samples)
- **感情分析** (Sentiment Analysis) - 12.6 KB
  - Complex workflow with IF/ELSE branching
  - Multiple LLM nodes
  - Two end nodes

- **Simple Test Workflow** - 1.7 KB
  - Minimal workflow structure
  - Single start -> LLM -> end flow

- **test** - 1.6 KB
  - Another simple workflow example

**Key Characteristics:**
```yaml
app:
  mode: workflow
workflow:
  features:
    file_upload:
      image:
        enabled: false/true
        number_limits: 3
        transfer_methods: [local_file, remote_url]
  graph:
    nodes: [...]
    edges: [...]
```

### 2. Advanced Chat Mode (2 samples)
- **AI ポッドキャスト** - 19.0 KB
  - Advanced conversational workflow
  - Multiple dependencies

- **テスト** - 4.5 KB
  - Simpler advanced chat example

**Key Characteristics:**
```yaml
app:
  mode: advanced-chat
workflow:
  features:
    file_upload:
      allowed_file_extensions: [.JPG, .JPEG, ...]
      allowed_file_types: [image]
      allowed_file_upload_methods: [local_file, remote_url]
```

### 3. Agent Chat Mode (2 samples)
- **投資分析レポート コパイロット** - 8.2 KB
  - Agent with Yahoo Finance tools

- **YouTubeチャンネルデータ分析** - 6.1 KB
  - Agent with YouTube, Chart, Wikipedia tools

**Key Characteristics:**
```yaml
app:
  mode: agent-chat
model_config:
  agent_mode:
    enabled: true
    max_iteration: 5
    strategy: function_call
    tools: [...]
```

### 4. Chat Mode (1 sample)
- **コード インタープリター** - 2.5 KB
  - Basic chat mode

**Key Characteristics:**
```yaml
app:
  mode: chat
model_config:
  agent_mode:
    enabled: false
  chat_prompt_config: {}
```

## Common DSL Structure

All Dify DSL files share this top-level structure:

```yaml
app:
  name: string
  description: string
  icon: emoji
  icon_background: color
  mode: workflow|advanced-chat|agent-chat|chat
  use_icon_as_answer_icon: boolean

dependencies:
  - type: marketplace
    value:
      marketplace_plugin_unique_identifier: string

kind: app
version: "0.4.0"  # For workflow/advanced-chat

# Mode-specific configuration:
workflow: {...}      # For workflow/advanced-chat modes
model_config: {...}  # For chat/agent-chat modes
```

## Key Differences by Mode

### Workflow vs Chat Modes

| Feature | Workflow/Advanced-Chat | Chat/Agent-Chat |
|---------|----------------------|-----------------|
| Configuration Key | `workflow` | `model_config` |
| Visual Graph | Yes (`workflow.graph`) | No |
| Agent Support | No (workflow logic only) | Yes (`agent_mode.tools`) |
| Conversation Variables | `workflow.conversation_variables` | Built into `model_config` |

### File Upload Configuration

**Workflow Mode:**
```yaml
file_upload:
  image:
    enabled: boolean
    number_limits: integer
    transfer_methods: [local_file, remote_url]
```

**Advanced-Chat/Agent-Chat Mode:**
```yaml
file_upload:
  allowed_file_extensions: [.JPG, .JPEG, ...]
  allowed_file_types: [image, document, ...]
  allowed_file_upload_methods: [local_file, remote_url]
  enabled: boolean
```

## Dependencies Format

All plugins/extensions are specified in `dependencies`:

```yaml
dependencies:
- current_identifier: null
  type: marketplace
  value:
    marketplace_plugin_unique_identifier:
      "langgenius/openai:0.2.6@<hash>"
```

Common plugins:
- `langgenius/openai:0.2.6` - OpenAI models
- `langgenius/openai_api_compatible:0.0.19` - OpenAI-compatible APIs
- `langgenius/yahoo:0.0.5` - Yahoo Finance
- `langgenius/youtube:0.0.2` - YouTube
- `langgenius/chart:0.0.2` - Charting
- `langgenius/wikipedia:0.0.3` - Wikipedia

## Workflow Graph Structure (Workflow Mode Only)

```yaml
workflow:
  graph:
    nodes:
      - id: "timestamp_id"
        type: start|llm|if-else|end|custom-note
        position: {x, y}
        positionAbsolute: {x, y}
        width: integer
        height: integer
        data:
          type: node_type
          title: string
          desc: string
          # Node-specific data
    edges:
      - id: "source_id-target_id"
        source: "node_id"
        target: "node_id"
        sourceHandle: "source"|"true"|"false"
        targetHandle: "target"
        type: "custom"
        data:
          sourceType: node_type
          targetType: node_type
    viewport:
      x: number
      y: number
      zoom: number
```

## Model Configuration (Chat Mode Only)

```yaml
model_config:
  agent_mode:
    enabled: boolean
    max_iteration: integer
    strategy: "function_call"
    tools: [...]

  chat_prompt_config: {}
  completion_prompt_config: {}

  dataset_configs:
    datasets:
      datasets: []
    retrieval_model: "single"

  file_upload: {...}

  model:
    completion_params: {...}
    mode: "chat"
    name: "model_name"
    provider: "provider_name"

  prompt_config: {...}
  retriever_resource: {...}
```

## Recommendations for Converter

1. **Support all 4 modes:**
   - workflow → Direct graph conversion
   - advanced-chat → Graph with conversational features
   - chat → Model config only (no graph)
   - agent-chat → Model config with tools

2. **Handle dependencies correctly:**
   - Detect required plugins from nodes
   - Generate proper `marketplace_plugin_unique_identifier`

3. **Mode-specific features:**
   - File upload configuration varies by mode
   - Chat modes use `model_config` instead of `workflow`
   - Agent modes require `tools` array

4. **Node type support:**
   - start, llm, if-else, end (core types)
   - code, template-transform, http-request (advanced types)
   - custom-note (for documentation)

5. **Variable references:**
   - Format: `{{#node_id.field#}}`
   - Need to map node IDs correctly
   - Handle nested references

## Next Steps

1. Update `dify_converter.py` to support all 4 modes
2. Add proper dependency detection and generation
3. Implement mode-specific configuration logic
4. Test conversion with all 8 samples
5. Validate converted DSL can be imported back into Dify
