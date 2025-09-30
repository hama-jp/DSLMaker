# 🚀 Dify Workflow Templates Library

This directory contains a curated collection of high-quality Dify Workflow DSL templates designed to accelerate AI workflow development and demonstrate best practices.

## 📂 Directory Structure

```
workflow-templates/
├── README.md                      # This guide
├── official/                      # Official Dify templates
│   └── document-query-workflow.yml    # Advanced document Q&A system
├── community/                     # Community-created templates
│   ├── simple-translation-workflow.yml    # Linear translation workflow
│   ├── customer-service-automation.yml    # Conditional routing & escalation
│   └── content-analysis-pipeline.yml      # Parallel processing & aggregation
└── patterns/                      # Workflow pattern documentation
    ├── conditional-routing.md     # IF/ELSE branching patterns
    ├── parallel-processing.md     # Multi-path processing
    └── error-handling.md          # Error handling strategies
```

## 🎯 Template Categories

### 🏢 Official Templates
Production-ready templates from the Dify team and verified community sources:

- **Document Query Workflow** (`official/document-query-workflow.yml`)
  - **Pattern**: RAG Pipeline with Classification
  - **Complexity**: Complex (30KB, 15+ nodes)
  - **Use Cases**: Document Q&A, Knowledge retrieval, Support systems
  - **Key Features**: Question classification, knowledge retrieval, conditional routing
  - **Source**: [Winson-030/dify-DSL](https://github.com/Winson-030/dify-DSL)

### 🌟 Community Templates
High-quality templates created based on proven patterns:

#### Simple Translation Workflow
- **File**: `community/simple-translation-workflow.yml`
- **Pattern**: Linear Processing
- **Complexity**: Simple (3 nodes)
- **Use Cases**: Document translation, content localization
- **Features**: Multi-language support, context-aware translation, quality prompting

#### Customer Service Automation
- **File**: `community/customer-service-automation.yml`
- **Pattern**: Conditional Branching + Knowledge Retrieval
- **Complexity**: Moderate to Complex (7 nodes)
- **Use Cases**: Support ticket routing, automated responses, escalation management
- **Features**: Intent classification, knowledge search, escalation logic, customer tier handling

#### Content Analysis Pipeline
- **File**: `community/content-analysis-pipeline.yml`
- **Pattern**: Parallel Processing + Data Aggregation
- **Complexity**: Complex to Enterprise (9 nodes)
- **Use Cases**: Content marketing analysis, document evaluation, academic review
- **Features**: Parallel sentiment/theme/readability analysis, data aggregation, comprehensive reporting

## 🚀 Quick Start Guide

### 1. Using Templates in DSL Maker

1. Browse the templates in this directory
2. Copy the YAML content from your chosen template
3. Import into DSL Maker via the "Import DSL" feature
4. Customize node configurations for your specific use case
5. Test and deploy to your Dify instance

### 2. Template Adaptation Checklist

When adapting a template:

- [ ] **Update App Metadata**: Change name, description, icon
- [ ] **Configure Variables**: Adjust input variables for your use case
- [ ] **Customize Prompts**: Modify LLM prompts for your domain
- [ ] **Set API Keys**: Configure model providers and authentication
- [ ] **Update Dataset IDs**: Link to your knowledge bases (if applicable)
- [ ] **Test Edge Cases**: Verify error handling and fallback behavior
- [ ] **Optimize Parameters**: Tune temperature, max_tokens, thresholds

### 3. Template Selection Guide

| **Use Case** | **Recommended Template** | **Complexity** | **Key Benefits** |
|---|---|---|---|
| **Translation Services** | Simple Translation | Simple | Fast setup, multi-language |
| **Customer Support** | Customer Service Automation | Moderate | Intent routing, escalation |
| **Document Q&A** | Document Query Workflow | Complex | Advanced RAG, classification |
| **Content Analysis** | Content Analysis Pipeline | Complex | Parallel processing, reporting |
| **Custom Workflow** | Start with simplest matching pattern | Varies | Build incrementally |

## 🎨 Workflow Patterns Explained

### 1. Linear Processing Pattern
```
Start → Process → End
```
- **Best For**: Simple transformations, translations, single-step analysis
- **Advantages**: Easy to understand, fast execution, minimal complexity
- **Example**: Translation workflow

### 2. Conditional Branching Pattern
```
Start → Classifier → IF/ELSE → [Path A | Path B] → End
```
- **Best For**: Content routing, user intent handling, decision trees
- **Advantages**: Intelligent routing, personalized responses
- **Example**: Customer service automation

### 3. Parallel Processing Pattern
```
Start → [Process A | Process B | Process C] → Aggregator → End
```
- **Best For**: Multi-faceted analysis, independent processing tasks
- **Advantages**: Speed, comprehensive analysis, scalability
- **Example**: Content analysis pipeline

### 4. RAG Pipeline Pattern
```
Start → Query → Knowledge Retrieval → LLM → End
```
- **Best For**: Knowledge-based Q&A, document search, expert systems
- **Advantages**: Accurate responses, knowledge grounding, context awareness
- **Example**: Document query workflow

## 🔧 Customization Guidelines

### Node-Specific Customization

#### LLM Nodes
```yaml
model:
  provider: openai           # Choose provider: openai, anthropic, etc.
  name: gpt-4               # Select model version
  completion_params:
    temperature: 0.1        # Lower = more consistent, Higher = more creative
    max_tokens: 1000        # Response length limit
```

#### Knowledge Retrieval Nodes
```yaml
dataset_ids: ['your-kb-id'] # Replace with your knowledge base IDs
retrieval_mode: multiple    # single, multiple, or hybrid
top_k: 3                   # Number of results to retrieve
score_threshold: 0.6        # Minimum relevance score
```

#### IF/ELSE Nodes
```yaml
logical_operator: and       # and, or
conditions:
  - variable_selector: [node-id, variable]
    comparison_operator: contains  # equals, contains, >, <, etc.
    value: "target_value"
```

### Best Practices for Customization

1. **Start Small**: Begin with simple templates and add complexity gradually
2. **Test Incrementally**: Test each modification before adding more changes
3. **Document Changes**: Keep notes on customizations for team sharing
4. **Version Control**: Save working versions before major changes
5. **Monitor Performance**: Track response times and accuracy after changes

## 📚 Additional Resources

- **[DIFY_WORKFLOW_BEST_PRACTICES.md](../DIFY_WORKFLOW_BEST_PRACTICES.md)** - Comprehensive best practices guide
- **[TEMPLATE_CATALOG.md](../TEMPLATE_CATALOG.md)** - Detailed template catalog with use cases
- **[PATTERN_LIBRARY.md](../PATTERN_LIBRARY.md)** - Reusable workflow patterns library
- **[Dify Official Documentation](https://docs.dify.ai/)** - Official Dify workflow documentation

## 🤝 Contributing Templates

We welcome high-quality template contributions! Please ensure:

1. **Quality Standards**: Templates should be production-ready and well-tested
2. **Documentation**: Include clear description, use cases, and customization notes
3. **Attribution**: Provide proper attribution if based on existing work
4. **Validation**: Ensure templates pass DSL validation
5. **Examples**: Include sample inputs/outputs where applicable

## 📞 Support

For questions about using these templates:

1. Check the specific template documentation
2. Review the [DIFY_WORKFLOW_BEST_PRACTICES.md](../DIFY_WORKFLOW_BEST_PRACTICES.md) guide
3. Consult the [Dify Community](https://github.com/langgenius/dify) for workflow-specific help

---

*Last Updated: 2025-09-30*
*Template Library Version: 1.0*