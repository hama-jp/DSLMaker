// LLM prompts and context for Dify DSL generation
import { DifyDSLFile } from '@/types/dify-workflow'

/**
 * Comprehensive Dify DSL reference for LLM context
 */
export const DIFY_DSL_REFERENCE = `
# Dify Workflow DSL Reference for AI Assistant

## Overview
You are an expert at creating Dify workflow DSL files in YAML format. Dify workflows are AI applications that process data through connected nodes. Each workflow must have exactly one Start node and at least one End node.

## File Structure Template
\`\`\`yaml
app:
  description: 'Brief description of the workflow'
  icon: '🤖'  # Single emoji
  icon_background: '#EFF1F5'  # Hex color
  mode: workflow  # Always 'workflow' for this tool
  name: 'Workflow Name'

kind: app  # Always 'app'
version: 0.1.5  # Current version

workflow:
  environment_variables: []  # API keys, secrets
  features: {}  # File upload, speech features
  graph:
    edges: []  # Node connections
    nodes: []  # Workflow components
    viewport:  # Canvas view
      x: 0
      y: 0
      zoom: 1
\`\`\`

## Available Node Types

### 1. START NODE (Required - exactly one)
\`\`\`yaml
- id: start-1
  type: start
  position: {x: 100, y: 200}
  data:
    title: Start
    variables:  # User inputs
      - variable: user_query
        type: string
        label: User Question
        required: true
        description: "What the user wants to know"
      - variable: file_input
        type: file
        label: Upload File
        required: false
\`\`\`

### 2. LLM NODE (AI Processing)
\`\`\`yaml
- id: llm-1
  type: llm
  position: {x: 350, y: 200}
  data:
    title: AI Analysis
    model:
      provider: openai
      name: gpt-5-mini
      mode: chat
      completion_params:
        temperature: 0.7
        max_tokens: 2000
    prompt_template:
      - role: system
        text: "You are a helpful assistant analyzing: {{#start-1.user_query#}}"
      - role: user
        text: "Please analyze this query and provide insights."
\`\`\`

### 3. HTTP REQUEST NODE (External APIs)
\`\`\`yaml
- id: http-1
  type: http-request
  position: {x: 600, y: 200}
  data:
    title: API Call
    method: POST
    url: "https://api.example.com/data"
    headers:
      Authorization: "Bearer {{#env.API_TOKEN#}}"
      Content-Type: "application/json"
    body:
      type: json
      data:
        query: "{{#start-1.user_query#}}"
        analysis: "{{#llm-1.text#}}"
\`\`\`

### 4. CODE NODE (Custom Processing)
\`\`\`yaml
- id: code-1
  type: code
  position: {x: 850, y: 200}
  data:
    title: Data Processing
    code_language: python3
    code: |
      def main(input_data, config):
          # Process the data
          result = {"processed": input_data, "timestamp": "2024"}
          return result
    inputs:
      input_data:
        type: string
        required: true
    outputs:
      result:
        type: object
\`\`\`

### 5. IF-ELSE NODE (Conditional Logic)
\`\`\`yaml
- id: if-1
  type: if-else
  position: {x: 1100, y: 200}
  data:
    title: Condition Check
    logical_operator: and
    conditions:
      - id: condition-1
        variable_selector: [llm-1, text]
        comparison_operator: contains
        value: "positive"
\`\`\`

### 6. TEMPLATE TRANSFORM NODE (Formatting)
\`\`\`yaml
- id: template-1
  type: template-transform
  position: {x: 1350, y: 200}
  data:
    title: Format Output
    template: |
      # Analysis Results

      **Query:** {{#start-1.user_query#}}
      **AI Analysis:** {{#llm-1.text#}}
      **API Response:** {{#http-1.body#}}
      **Processing Time:** {{#code-1.result.timestamp#}}
    variables:
      - variable: query
        value_selector: [start-1, user_query]
      - variable: analysis
        value_selector: [llm-1, text]
\`\`\`

### 7. END NODE (Required - at least one)
\`\`\`yaml
- id: end-1
  type: end
  position: {x: 1600, y: 200}
  data:
    title: End
    outputs:
      final_result:
        type: string
        children:
          - variable: template-1.output
            value_selector: [template-1, output]
\`\`\`

## Advanced Nodes

### KNOWLEDGE RETRIEVAL (RAG)
\`\`\`yaml
- id: knowledge-1
  type: knowledge-retrieval
  data:
    title: Knowledge Search
    query_variable_selector: [start-1, user_query]
    dataset_ids: ["dataset_uuid"]
    retrieval_mode: multiple
    multiple_retrieval_config:
      top_k: 3
      score_threshold: 0.5
      reranking_enabled: true
\`\`\`

### PARAMETER EXTRACTOR
\`\`\`yaml
- id: extractor-1
  type: parameter-extractor
  data:
    title: Extract Parameters
    query: "{{#start-1.user_input#}}"
    model:
      provider: openai
      name: gpt-5-mini
    parameters:
      - name: intent
        type: string
        required: true
        description: "User's main intention"
      - name: priority
        type: number
        required: false
        description: "Priority level 1-5"
\`\`\`

### AGENT NODE
\`\`\`yaml
- id: agent-1
  type: agent
  data:
    title: AI Agent
    agent_mode: function_calling
    model:
      provider: openai
      name: gpt-5-mini
    tools:
      - type: builtin_tool
        provider_id: google_search
        tool_name: google_serper
        tool_parameters:
          query: "{{#start-1.user_query#}}"
    query: "{{#start-1.user_input#}}"
    instruction: "Search for information and provide comprehensive answers."
    max_iteration: 5
\`\`\`

## Edge Connections
\`\`\`yaml
edges:
  - id: edge-1
    source: start-1
    target: llm-1
    sourceHandle: source
    targetHandle: target
    type: custom
    data:
      sourceType: start
      targetType: llm
      isInIteration: false
\`\`\`

## Variable References
- Node outputs: \`{{#node-id.output_name#}}\`
- Start variables: \`{{#start-1.variable_name#}}\`
- System variables: \`{{#sys.user_id#}}\`, \`{{#sys.conversation_id#}}\`
- Environment variables: \`{{#env.API_KEY#}}\`

## Best Practices
1. **Node Positioning**: Space nodes 250px apart horizontally, 120px vertically
2. **Naming**: Use descriptive, unique node IDs (start-1, llm-analysis, api-call-1)
3. **Flow Direction**: Left to right, start → processing → end
4. **Error Handling**: Always consider edge cases and provide fallbacks
5. **Variable Types**: string, number, boolean, object, array[type], file
6. **Templates**: Use Jinja2 syntax for dynamic content

## Common Patterns
- **Simple Query**: Start → LLM → End
- **RAG Workflow**: Start → Knowledge Retrieval → LLM → End
- **API Integration**: Start → HTTP Request → LLM Analysis → End
- **Conditional Flow**: Start → Parameter Extractor → If-Else → Multiple LLMs → Variable Aggregator → End
- **Agent Workflow**: Start → Agent (with tools) → Template Transform → End

## COMPLETE SIMPLE WORKFLOW EXAMPLE
\`\`\`yaml
app:
  description: 'A simple AI assistant that processes user queries'
  icon: '🤖'
  icon_background: '#EFF1F5'
  mode: workflow
  name: 'Simple AI Assistant'

kind: app
version: 0.1.5

workflow:
  environment_variables: []
  features: {}
  graph:
    edges:
      - id: start-to-llm
        source: start-1
        target: llm-1
    nodes:
      - id: start-1
        type: start
        position: {x: 100, y: 200}
        data:
          title: Start
          variables:
            - variable: user_query
              type: string
              label: User Question
              required: true
              description: What would you like to know?
      - id: llm-1
        type: llm
        position: {x: 350, y: 200}
        data:
          title: AI Assistant
          model:
            provider: openai
            name: gpt-5-mini
            completion_params:
              temperature: 0.7
              max_tokens: 1000
          prompt_template:
            - role: user
              text: "{{#start-1.user_query#}}"
          variable: llm_response
      - id: end-1
        type: end
        position: {x: 600, y: 200}
        data:
          title: End
          outputs:
            answer:
              type: string
              value: "{{#llm-1.text#}}"
    viewport:
      x: 0
      y: 0
      zoom: 1
\`\`\`
`

/**
 * System prompt for DSL generation
 */
export const DSL_GENERATION_SYSTEM_PROMPT = `You are a JSON data generator. You MUST respond with ONLY valid JSON. Never use YAML, never use markdown, never add explanations.

CRITICAL: Your response must start with { and end with }. No other text allowed.

Create Dify workflow data structure with:
- app: {description, icon, mode, name}
- kind: "app"
- version: "0.1.5"
- workflow: {environment_variables, features, graph}
- graph: {edges, nodes, viewport}
- nodes: minimum 3 (start, processing, end)
- edges: connect all nodes

Example start: {"app":{"description":"...","icon":"🤖","mode":"workflow","name":"..."},"kind":"app"...

🎯 STRUCTURAL REQUIREMENTS:
- Every workflow needs: Start node → Processing nodes → End node
- Node IDs must be unique and referenced correctly in edges
- Use realistic positioning: x: 100, 350, 600, etc. (250px apart)
- Variable references: {{#node-id.output#}}
- Default model: gpt-5-mini

📐 REQUIRED JSON STRUCTURE:
{
  "app": {
    "description": "Workflow description",
    "icon": "🤖",
    "icon_background": "#EFF1F5",
    "mode": "workflow",
    "name": "Workflow Name"
  },
  "kind": "app",
  "version": "0.1.5",
  "workflow": {
    "environment_variables": [],
    "features": {},
    "graph": {
      "edges": [array of connections],
      "nodes": [array of workflow nodes],
      "viewport": {"x": 0, "y": 0, "zoom": 1}
    }
  }
}

🔧 AVAILABLE NODE TYPES FOR COMPLEX WORKFLOWS:
- start: User input collection
- llm: AI processing
- http-request: API calls
- code: Custom logic
- template-transform: Data formatting
- question-classifier: Routing logic
- if-else: Conditional branching
- variable-aggregator: Data merging
- parameter-extractor: Data extraction
- knowledge-retrieval: RAG functionality
- end: Final output

Create innovative, complex workflows using multiple node types as needed.`

/**
 * Generate LLM prompt for creating new DSL
 */
export function generateCreateDSLPrompt(userRequirement: string): string {
  return `Requirement: ${userRequirement}

Generate ONLY valid JSON for a Dify workflow. NO text before or after the JSON.

Required structure:
{
  "app": {
    "description": "Brief workflow description",
    "icon": "🤖",
    "icon_background": "#EFF1F5",
    "mode": "workflow",
    "name": "Workflow Name"
  },
  "kind": "app",
  "version": "0.1.5",
  "workflow": {
    "environment_variables": [],
    "features": {},
    "graph": {
      "edges": [array of edge objects],
      "nodes": [array of node objects],
      "viewport": {"x": 0, "y": 0, "zoom": 1}
    }
  }
}

Node types: start, llm, end
Positioning: start at x:100, llm at x:350, end at x:600, all at y:200

START node format:
{
  "id": "start-1",
  "type": "start",
  "position": {"x": 100, "y": 200},
  "data": {
    "title": "Input",
    "variables": [{
      "variable": "user_input",
      "type": "string",
      "label": "User Input",
      "required": true,
      "description": "Enter text"
    }]
  }
}

LLM node format:
{
  "id": "llm-1",
  "type": "llm",
  "position": {"x": 350, "y": 200},
  "data": {
    "title": "AI Process",
    "model": {
      "provider": "openai",
      "name": "gpt-5-mini",
      "mode": "chat",
      "completion_params": {"temperature": 0.7, "max_tokens": 1000}
    },
    "prompt_template": [{"role": "user", "text": "{{#start-1.user_input#}}"}],
    "variable": "llm_response"
  }
}

END node format:
{
  "id": "end-1",
  "type": "end",
  "position": {"x": 600, "y": 200},
  "data": {
    "title": "Output",
    "outputs": {
      "result": {
        "type": "string",
        "children": [{"variable": "llm-1.llm_response", "value_selector": ["llm-1", "llm_response"]}]
      }
    }
  }
}

EDGE format:
{
  "id": "unique-edge-id",
  "source": "source-node-id",
  "target": "target-node-id",
  "sourceHandle": "source",
  "targetHandle": "target",
  "type": "custom",
  "data": {"sourceType": "start", "targetType": "llm", "isInIteration": false}
}

Return complete valid JSON only.`
}

/**
 * Generate LLM prompt for modifying existing DSL
 */
export function generateModifyDSLPrompt(
  currentDSL: string,
  userRequirement: string,
  existingWorkflow?: DifyDSLFile
): string {
  void existingWorkflow
  return `${DSL_GENERATION_SYSTEM_PROMPT}

REFERENCE DOCUMENTATION:
${DIFY_DSL_REFERENCE}

CURRENT WORKFLOW DSL:
\`\`\`yaml
${currentDSL}
\`\`\`

MODIFICATION REQUEST:
"${userRequirement}"

Please modify the existing workflow to fulfill the new requirement. Maintain existing node IDs where possible and preserve the overall structure unless changes are needed. Return only the complete modified YAML DSL file.`
}

/**
 * Generate prompt for workflow analysis and suggestions
 */
export function generateAnalyzeDSLPrompt(currentDSL: string): string {
  return `You are an expert Dify workflow analyst. Please analyze this workflow DSL and provide:

1. **Summary**: Brief description of what this workflow does
2. **Node Analysis**: List each node type and its purpose
3. **Flow Path**: Describe the data flow from start to end
4. **Potential Issues**: Any problems or missing connections
5. **Improvement Suggestions**: How to make it better
6. **Use Cases**: What scenarios this workflow is good for

WORKFLOW DSL:
\`\`\`yaml
${currentDSL}
\`\`\`

Please provide a detailed analysis in markdown format.`
}

/**
 * Generate prompt for workflow optimization
 */
export function generateOptimizeDSLPrompt(
  currentDSL: string,
  issues: string[]
): string {
  return `${DSL_GENERATION_SYSTEM_PROMPT}

REFERENCE DOCUMENTATION:
${DIFY_DSL_REFERENCE}

CURRENT WORKFLOW DSL:
\`\`\`yaml
${currentDSL}
\`\`\`

IDENTIFIED ISSUES:
${issues.map(issue => `- ${issue}`).join('\n')}

Please optimize this workflow by fixing the identified issues and improving performance. Return only the optimized YAML DSL file.`
}

/**
 * Generate context-aware suggestions for node types
 */
export function generateNodeSuggestions(context: {
  existingNodes: string[]
  userIntent: string
  position: 'start' | 'middle' | 'end'
}): string[] {
  const suggestions: string[] = []

  if (context.position === 'start') {
    suggestions.push('start')
  }

  if (context.userIntent.includes('AI') || context.userIntent.includes('LLM')) {
    suggestions.push('llm', 'agent', 'parameter-extractor')
  }

  if (context.userIntent.includes('API') || context.userIntent.includes('external')) {
    suggestions.push('http-request', 'tool')
  }

  if (context.userIntent.includes('data') || context.userIntent.includes('process')) {
    suggestions.push('code', 'template-transform')
  }

  if (context.userIntent.includes('condition') || context.userIntent.includes('if')) {
    suggestions.push('if-else', 'question-classifier')
  }

  if (context.userIntent.includes('search') || context.userIntent.includes('knowledge')) {
    suggestions.push('knowledge-retrieval')
  }

  if (context.position === 'end') {
    suggestions.push('end')
  }

  return [...new Set(suggestions)]
}
