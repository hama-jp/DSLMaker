# 🎨 Dify Workflow Pattern Library

This library contains reusable workflow patterns that serve as building blocks for creating complex, production-ready Dify workflows. Each pattern represents a proven solution to common workflow challenges.

## 📚 Pattern Classification

### By Complexity Level
- **Simple** (3-4 nodes): Basic transformations, single-step processing
- **Moderate** (5-7 nodes): Conditional logic, knowledge retrieval
- **Complex** (8-12 nodes): Multi-path processing, advanced logic
- **Enterprise** (13+ nodes): Comprehensive systems, full automation

### By Processing Type
- **Linear**: Sequential processing from start to end
- **Conditional**: Branching logic based on conditions
- **Parallel**: Concurrent processing of independent tasks
- **Iterative**: Loop-based processing for collections
- **Hybrid**: Combination of multiple processing types

## 🏗️ Core Patterns

### 1. Linear Processing Pattern

**Structure:**
```
Start → Process Node → End
```

**Use Cases:**
- Text translation
- Content summarization
- Simple analysis
- Format conversion

**Implementation:**
```yaml
# Minimal 3-node structure
nodes:
  - id: start-1
    type: start
    data:
      title: '🚀 Input Collection'
      variables: [user_input]

  - id: process-1
    type: llm
    data:
      title: '⚙️ Processing Engine'
      prompt_template: [system_prompt, user_input_reference]
      variable: processed_output

  - id: end-1
    type: end
    data:
      title: '🏁 Result Output'
      outputs: {result: processed_output}

edges:
  - {source: start-1, target: process-1}
  - {source: process-1, target: end-1}
```

**Advantages:**
- Simplest to implement and debug
- Fastest execution time
- Minimal resource usage
- Easy to maintain

**Best For:**
- MVP workflows
- Simple transformations
- Quick proof-of-concepts
- User-facing simple tools

---

### 2. Conditional Routing Pattern

**Structure:**
```
Start → Classifier → IF/ELSE → [Path A | Path B] → End
```

**Use Cases:**
- Customer service routing
- Content categorization
- Intent-based processing
- Quality gates

**Implementation:**
```yaml
# Intent-based routing structure
nodes:
  - id: start-1
    type: start
    data:
      variables: [user_query, context]

  - id: classifier-1
    type: question_classifier
    data:
      title: '🎯 Intent Classification'
      classes:
        - {id: technical, name: 'Technical Support'}
        - {id: billing, name: 'Billing Inquiry'}
        - {id: general, name: 'General Question'}

  - id: router-1
    type: if_else
    data:
      title: '🔀 Smart Routing'
      conditions: [classification_logic]

  - id: path-a
    type: llm  # Technical support handler
    data: {title: '🔧 Technical Support'}

  - id: path-b
    type: knowledge_retrieval  # General inquiry handler
    data: {title: '📚 Knowledge Lookup'}

  - id: end-1
    type: end
    data: {outputs: {response: final_response}}
```

**Advantages:**
- Intelligent routing
- Personalized responses
- Scalable decision making
- Context-aware processing

**Best For:**
- Customer service systems
- Multi-domain applications
- Content management
- Process automation

---

### 3. Parallel Processing Pattern

**Structure:**
```
Start → [Process A | Process B | Process C] → Aggregator → End
```

**Use Cases:**
- Multi-faceted analysis
- Independent data processing
- Comprehensive reporting
- Speed optimization

**Implementation:**
```yaml
# Parallel analysis structure
nodes:
  - id: start-1
    type: start
    data: {variables: [content_input]}

  # Parallel processing nodes
  - id: sentiment-analysis
    type: llm
    data:
      title: '😊 Sentiment Analysis'
      prompt_template: [sentiment_system_prompt]

  - id: theme-extraction
    type: llm
    data:
      title: '🎯 Theme Extraction'
      prompt_template: [theme_system_prompt]

  - id: readability-check
    type: code
    data:
      title: '📖 Readability Analysis'
      code: [readability_calculation]

  # Aggregation node
  - id: aggregator-1
    type: variable_aggregator
    data:
      title: '📊 Results Aggregator'
      variables:
        - {source: sentiment-analysis, variable: sentiment}
        - {source: theme-extraction, variable: themes}
        - {source: readability-check, variable: readability}

  - id: end-1
    type: end
    data: {outputs: {comprehensive_analysis: aggregated_results}}

# Parallel edges from start to all processing nodes
edges:
  - {source: start-1, target: sentiment-analysis}
  - {source: start-1, target: theme-extraction}
  - {source: start-1, target: readability-check}
  # Aggregation edges
  - {source: sentiment-analysis, target: aggregator-1}
  - {source: theme-extraction, target: aggregator-1}
  - {source: readability-check, target: aggregator-1}
  - {source: aggregator-1, target: end-1}
```

**Advantages:**
- Faster execution through parallelism
- Comprehensive analysis
- Independent failure handling
- Scalable processing

**Best For:**
- Content analysis
- Data processing pipelines
- Multi-criteria evaluation
- Performance-critical workflows

---

### 4. RAG Pipeline Pattern

**Structure:**
```
Start → Query Processing → Knowledge Retrieval → Context Integration → LLM → End
```

**Use Cases:**
- Q&A systems
- Document search
- Knowledge base queries
- Expert assistance

**Implementation:**
```yaml
# RAG (Retrieval-Augmented Generation) structure
nodes:
  - id: start-1
    type: start
    data:
      variables: [user_question, context]

  - id: query-processor
    type: template_transform
    data:
      title: '🔍 Query Enhancement'
      template: 'Enhanced query: {{user_question}} Context: {{context}}'

  - id: knowledge-retrieval
    type: knowledge_retrieval
    data:
      title: '📚 Knowledge Search'
      dataset_ids: [knowledge-base-id]
      retrieval_mode: multiple
      top_k: 5
      score_threshold: 0.6
      reranking_enabled: true

  - id: context-integration
    type: template_transform
    data:
      title: '🔗 Context Integration'
      template: |
        Question: {{user_question}}

        Retrieved Knowledge:
        {{retrieved_knowledge}}

        Please provide a comprehensive answer based on the retrieved information.

  - id: answer-generation
    type: llm
    data:
      title: '🤖 Answer Generation'
      model: {provider: openai, name: gpt-4}
      prompt_template: [rag_system_prompt, integrated_context]

  - id: end-1
    type: end
    data: {outputs: {answer: generated_response}}
```

**Advantages:**
- Grounded in knowledge base
- Accurate, factual responses
- Scalable knowledge integration
- Reduced hallucination

**Best For:**
- Customer support systems
- Educational platforms
- Technical documentation
- Expert advisory systems

---

### 5. Iterative Processing Pattern

**Structure:**
```
Start → Iterator → [Process Item] → Aggregator → End
```

**Use Cases:**
- Batch processing
- List operations
- Bulk transformations
- Collection analysis

**Implementation:**
```yaml
# Batch processing structure
nodes:
  - id: start-1
    type: start
    data: {variables: [item_list, processing_config]}

  - id: iterator-1
    type: iteration
    data:
      title: '🔁 Batch Iterator'
      iteration_node:
        type: llm
        data:
          title: '⚙️ Item Processor'
          prompt_template: [item_processing_prompt]
      max_iterations: 100
      parallel_nums: 3

  - id: aggregator-1
    type: variable_aggregator
    data:
      title: '📊 Results Collector'
      output_type: array

  - id: end-1
    type: end
    data: {outputs: {processed_items: aggregated_results}}
```

**Advantages:**
- Handles large datasets
- Parallel processing capability
- Memory efficient
- Fault tolerant

**Best For:**
- Document processing
- Data migration
- Bulk analysis
- Report generation

---

## 🔧 Pattern Selection Guide

### Decision Matrix

| **Requirement** | **Recommended Pattern** | **Why** |
|---|---|---|
| **Simple transformation** | Linear Processing | Minimal complexity, fast execution |
| **Decision-based routing** | Conditional Routing | Smart logic, personalized responses |
| **Multiple independent analyses** | Parallel Processing | Speed, comprehensive results |
| **Knowledge-based Q&A** | RAG Pipeline | Accurate, grounded responses |
| **Bulk data processing** | Iterative Processing | Scalable, memory efficient |
| **Multi-stage analysis** | Hybrid (Parallel + Linear) | Comprehensive + structured |
| **Customer service** | Conditional + RAG | Routing + knowledge lookup |
| **Content generation** | Linear + RAG | Research + generation |

### Complexity Guidelines

**Start Simple:**
```
Simple → Moderate → Complex → Enterprise
Linear → Conditional → Parallel → Hybrid
```

**Growth Path:**
1. **Prototype**: Start with Linear Processing
2. **Add Logic**: Introduce Conditional Routing
3. **Scale Performance**: Add Parallel Processing
4. **Enhance Knowledge**: Integrate RAG Pipeline
5. **Handle Scale**: Add Iterative Processing

## 🎯 Pattern Optimization

### Performance Optimization

**Linear Pattern:**
- Minimize prompt length
- Use appropriate model (gpt-3.5 for simple tasks)
- Set optimal max_tokens

**Conditional Pattern:**
- Optimize classification prompts
- Cache common classifications
- Use simple conditions when possible

**Parallel Pattern:**
- Balance parallel operations (3-5 concurrent)
- Optimize individual node performance
- Use appropriate aggregation strategy

**RAG Pattern:**
- Optimize retrieval parameters (top_k, threshold)
- Enable reranking for quality
- Use efficient knowledge base structure

### Error Handling Strategies

**Linear Pattern:**
```yaml
error_strategy: default_value
default_value: 'Processing failed, please try again'
```

**Conditional Pattern:**
```yaml
# Add fallback path
else_branch: fallback_processor
error_strategy: continue
```

**Parallel Pattern:**
```yaml
# Individual node error handling
retry_config:
  retry_enabled: true
  max_retries: 2
```

**RAG Pattern:**
```yaml
# Fallback when no knowledge found
score_threshold: 0.3  # Lower threshold for fallback
default_value: 'I could not find specific information, but...'
```

## 📊 Pattern Metrics

### Performance Benchmarks

| **Pattern** | **Avg Response Time** | **Token Usage** | **Success Rate** |
|---|---|---|---|
| Linear | 1-3 seconds | 200-800 tokens | 98%+ |
| Conditional | 2-5 seconds | 400-1200 tokens | 95%+ |
| Parallel | 3-8 seconds | 800-2400 tokens | 92%+ |
| RAG | 4-10 seconds | 1000-3000 tokens | 90%+ |
| Iterative | Variable | Variable | 88%+ |

### Quality Indicators

**Linear Pattern:**
- Response relevance > 95%
- Processing accuracy > 98%
- User satisfaction > 4.5/5

**Conditional Pattern:**
- Routing accuracy > 92%
- Path completion rate > 95%
- User satisfaction > 4.2/5

**Parallel Pattern:**
- Completeness score > 90%
- Analysis coherence > 88%
- Processing efficiency > 85%

## 🚀 Advanced Pattern Combinations

### Hybrid Patterns

**Sequential + Parallel:**
```
Start → Pre-processing → [Parallel Analysis] → Post-processing → End
```

**Conditional + RAG:**
```
Start → Classification → IF/ELSE → [Knowledge A | Knowledge B] → Response → End
```

**Parallel + Iterative:**
```
Start → [Batch A | Batch B | Batch C] → Merge → Iterate → End
```

### Enterprise Patterns

**Multi-Stage Pipeline:**
```
Start → Validation → Classification → Processing → Quality Check → Approval → End
```

**Escalation Flow:**
```
Start → Auto-Process → Quality Gate → [Success | Escalate] → [End | Human Review]
```

## 📋 Implementation Checklist

### Pattern Implementation

- [ ] **Requirements Analysis**: Understand business needs
- [ ] **Pattern Selection**: Choose appropriate pattern
- [ ] **Node Configuration**: Configure each node optimally
- [ ] **Edge Connections**: Ensure proper data flow
- [ ] **Error Handling**: Implement comprehensive error strategies
- [ ] **Testing**: Test all paths and edge cases
- [ ] **Optimization**: Tune performance parameters
- [ ] **Documentation**: Document configuration decisions

### Quality Assurance

- [ ] **Structural Validation**: Valid YAML and node structure
- [ ] **Logic Validation**: Correct conditional logic
- [ ] **Performance Testing**: Response time within limits
- [ ] **Error Testing**: Graceful error handling
- [ ] **Load Testing**: Concurrent request handling
- [ ] **User Testing**: End-user validation

## 📚 Pattern Examples

### Template References

- **Linear**: `simple-translation-workflow.yml`
- **Conditional**: `customer-service-automation.yml`
- **Parallel**: `content-analysis-pipeline.yml`
- **RAG**: `document-query-workflow.yml`

### Community Patterns

Visit the [workflow-templates](./workflow-templates/) directory for complete implementations of each pattern.

---

*This pattern library evolves with community contributions and platform updates.*

*Last Updated: 2025-09-30*
*Version: 1.0*