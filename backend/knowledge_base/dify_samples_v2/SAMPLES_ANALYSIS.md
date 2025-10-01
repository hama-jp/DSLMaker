# Dify DSL Samples Analysis (v2)

**Export Date:** 2025-10-01
**Total Samples:** 10 apps
**Dify Version:** 0.4.0

## Overview

This collection contains 10 real Dify application exports covering all 4 major app modes. These samples serve as reference implementations for the DSLMaker→Dify converter.

## Sample Distribution

### By Mode
- **workflow** (4 samples): Pure workflow mode with graph-based execution
- **advanced-chat** (3 samples): Conversational workflows with graph + conversation variables
- **agent-chat** (2 samples): Agent mode with tool integration
- **chat** (1 sample): Basic chat mode with model configuration

### By Complexity
- **Simple** (3 samples): < 5KB - Basic structure
- **Medium** (4 samples): 5-15KB - Standard workflows with multiple nodes
- **Complex** (3 samples): > 15KB - Advanced features (iteration, parallel, agents)

## Detailed Sample List

### 1. ウェブの検索と要約のワークフローパターン (workflow, 13KB) ⭐ NEW
**Description:** Web search and summary workflow using Tavily Search + Jina Reader
**Key Features:**
- Iteration node for processing multiple URLs
- Tavily Search integration
- Jina Reader for web content extraction
- Code node for data transformation
- List manipulation and aggregation

**Notable Patterns:**
```yaml
workflow:
  graph:
    nodes:
      - type: start
      - type: tool-call  # Tavily Search
      - type: code
      - type: iteration
        data:
          startNodeType: tool-call  # Jina Reader
      - type: end
```

### 2. DeepResearch (advanced-chat, 36KB) ⭐ NEW COMPLEX
**Description:** Iterative research workflow with repeated searches and report generation
**Key Features:**
- **conversation_variables**: topics, nextSearchTopic, findings, shouldContinue
- Iteration with conditional continuation
- Tavily Search + deepseek-reasoner model
- Variable assignment and aggregation nodes
- Extract nodes for JSON parsing

**Notable Patterns:**
```yaml
workflow:
  conversation_variables:
    - id: 07ea9b5b-edf2-471d-8206-50e95e7ab87e
      name: topics
      value_type: array[string]
      value: []
  graph:
    nodes:
      - type: iteration
        data:
          iterator_selector: [start, depth]  # Iterate by depth
          startNodeType: llm
```

### 3. 感情分析 (workflow, 13KB)
**Description:** Sentiment analysis with IF/ELSE branching
**Key Features:**
- IF/ELSE conditional logic
- Multiple sentiment analysis modes
- JSON output formatting
- Multisentiment vs single sentiment paths

**Dependencies:**
- `langgenius/openai:0.2.6`

### 4. Simple Test Workflow (workflow, 1.7KB)
**Description:** Minimal workflow for testing
**Key Features:**
- Start → LLM → End (simplest possible workflow)

### 5. test (workflow, 1.6KB)
**Description:** Another simple test workflow
**Similar to Simple Test Workflow**

### 6. AI ポッドキャスト (advanced-chat, 19KB)
**Description:** Podcast generation from reference sites
**Key Features:**
- Multiple dependencies (6+ plugins)
- Advanced chat mode with retriever resources
- File upload support
- Complex prompt templates

**Dependencies:**
- `langgenius/openai:0.2.6`
- `langgenius/jina_tool:0.0.7`
- Multiple other tools

### 7. テスト (advanced-chat, 4.5KB)
**Description:** Test advanced-chat application
**Key Features:**
- Simpler advanced-chat structure
- Basic conversation flow

### 8. 投資分析レポート コパイロット (agent-chat, 8.1KB)
**Description:** Investment analysis report copilot using Yahoo Finance
**Key Features:**
- Agent mode with tools
- Yahoo Finance integration
- Structured analysis workflow

**Dependencies:**
- Yahoo Finance tools
- News tools
- Analytics tools

### 9. コード インタープリター (chat, 2.5KB)
**Description:** Code interpreter chatbot
**Key Features:**
- Basic chat mode
- Code understanding and error detection
- Simple model configuration

### 10. YouTubeチャンネルデータ分析 (agent-chat, 6.0KB)
**Description:** YouTube channel data analysis
**Key Features:**
- YouTube API integration
- Chart generation
- Wikipedia tools

## Key DSL Structure Patterns

### 1. Workflow Mode
```yaml
app:
  mode: workflow
workflow:
  features:
    file_upload: {...}
    retriever_resource: {...}
  graph:
    nodes: [...]
    edges: [...]
    viewport: {x, y, zoom}
```

### 2. Advanced-Chat Mode
```yaml
app:
  mode: advanced-chat
workflow:
  conversation_variables:  # ⭐ Key difference
    - id, name, value_type, value, selector
  graph:
    nodes: [...]
    edges: [...]
```

### 3. Agent-Chat Mode
```yaml
app:
  mode: agent-chat
model_config:
  agent_mode:
    enabled: true
    tools: [...]
```

### 4. Chat Mode
```yaml
app:
  mode: chat
model_config:
  provider: openai
  model: gpt-3.5-turbo
```

## Node Types Found

### Core Nodes
- `start`: Entry point with input variables
- `end`: Exit point with output variables
- `llm`: LLM inference node
- `if-else`: Conditional branching
- `code`: Python code execution
- `template-transform`: Template transformation

### Advanced Nodes
- `iteration`: Loop over arrays/ranges
- `variable-aggregator`: Combine multiple variables
- `variable-assigner`: Assign/update conversation variables
- `tool`: External tool integration
- `http-request`: HTTP API calls
- `knowledge-retrieval`: RAG/knowledge base query
- `question-classifier`: Intent classification
- `answer`: Streaming answer output

### Tool Nodes
- `TAVILY_SEARCH`: Web search
- `JINA_READER`: Web content extraction
- `EXTRACT`: JSON field extraction
- `REASONING_MODEL`: DeepSeek reasoner

## Variable Reference Patterns

### Workflow Variables
```yaml
# Reference start node variables
{{#1711708591503.input_text#}}

# Reference LLM output
{{#1711708651402.text#}}

# Reference iteration item
{{#iteration.item#}}
```

### Conversation Variables (Advanced-Chat)
```yaml
# Define conversation variable
conversation_variables:
  - name: topics
    value_type: array[string]
    selector: [conversation, topics]

# Reference in nodes
{{#conversation.topics#}}
```

## Dependencies Format

```yaml
dependencies:
- current_identifier: null
  type: marketplace
  value:
    marketplace_plugin_unique_identifier: langgenius/openai:0.2.6@hash
```

## Converter Enhancement Recommendations

### 1. Support All 4 Modes
- ✅ workflow: Basic support exists
- ⏳ advanced-chat: Need conversation_variables support
- ⏳ agent-chat: Need agent_mode configuration
- ⏳ chat: Need model_config generation

### 2. Handle Advanced Features
- ⏳ Iteration nodes with proper configuration
- ⏳ Conversation variables (advanced-chat specific)
- ⏳ Variable aggregator/assigner nodes
- ⏳ Tool integrations with dependencies
- ⏳ Extract nodes for JSON processing

### 3. Dependency Management
- ⏳ Auto-detect required plugins from node types
- ⏳ Generate proper marketplace_plugin_unique_identifier
- ⏳ Include version hashes

### 4. Variable Referencing
- ⏳ Convert DSLMaker variable format to Dify format
- ⏳ Handle conversation variable selectors
- ⏳ Support iteration item references

## Test Coverage

These samples provide excellent test coverage for:
- ✅ All 4 Dify modes
- ✅ Simple to complex workflows
- ✅ Branching (IF/ELSE)
- ✅ Iteration
- ✅ Tool integration
- ✅ Conversation variables
- ✅ JSON extraction
- ✅ Multiple dependencies

## Next Steps

1. **Analyze conversation_variables pattern** from DeepResearch
2. **Implement advanced-chat mode support** in converter
3. **Add iteration node conversion** logic
4. **Create dependency auto-detection** system
5. **Test converter with each sample** to verify compatibility

---

*Generated: 2025-10-01*
*Samples Path: `/backend/knowledge_base/dify_samples_v2/`*
