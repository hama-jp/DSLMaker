# Dify Workflow DSL Reference

## Overview
Dify DSL is a YAML-based Domain Specific Language for defining AI workflows. DSL Maker creates and edits these workflows visually.

## Core DSL Structure
```yaml
app:
  description: 'Workflow description'
  icon: '🤖'
  icon_background: '#FFEAD5'
  mode: workflow  # workflow, chatflow, agent, text_generator
  name: 'Workflow Name'
  use_icon_as_answer_icon: false

kind: app
version: 0.1.3

workflow:
  conversation_variables: []  # Chatflow only
  environment_variables: []
  features:
    file_upload:
      enabled: true
    opening_statement: ''
    retriever_resource:
      enabled: false
  graph:
    edges: []    # Node connections
    nodes: []    # Workflow components
    viewport:    # Canvas view settings
      x: 0
      y: 0
      zoom: 1
```

## Supported Node Types (NODE_TYPES)
- `START` - Entry point, defines input variables
- `END` - Exit point, defines output variables
- `LLM` - Large Language Model processing
- `CODE` - Custom code execution
- `HTTP_REQUEST` - HTTP API calls
- `IF_ELSE` - Conditional branching
- `TEMPLATE_TRANSFORM` - Text template processing
- `KNOWLEDGE_RETRIEVAL` - RAG knowledge base queries

## Node Requirements
- **Every workflow**: Must have exactly one START node
- **Every workflow**: Must have at least one END node
- **Connections**: Nodes connect via edges defining data flow
- **IDs**: Each node must have unique identifier
- **Positioning**: Each node has x,y coordinates for visual layout

## Key Type Definitions
Located in `src/types/dify-workflow.ts`:
- `DifyWorkflow` - Complete workflow structure
- `DifyNode` - Base node interface
- `DifyEdge` - Connection between nodes
- `DifyLLMNode`, `DifyCodeNode`, etc. - Specific node types

## DSL Operations in Codebase
- **Generate DSL**: `src/utils/dsl-generator.ts`
- **Parse DSL**: `src/utils/dsl-parser.ts`
- **Validate DSL**: `src/utils/dsl-linter.ts`
- **Structure Validation**: `src/utils/dsl-structure-validation.ts`
- **State Helpers**: `src/utils/workflow-state-helpers.ts`

## Validation Rules
- Valid YAML format
- Required app metadata
- Valid workflow structure
- All nodes have required properties
- Edges connect existing nodes
- At least one path from START to END

## Common Issues
- Missing required node properties
- Invalid edge connections
- Duplicate node IDs
- Missing START or END nodes
- Invalid YAML syntax
- Circular dependencies

## Best Practices
- Use descriptive node IDs
- Validate workflows before export
- Test with sample data
- Document complex logic in descriptions
- Use appropriate node types for tasks