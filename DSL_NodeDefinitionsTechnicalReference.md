# Dify Workflow DSL Node Definitions Technical Reference

## DSL format uses YAML for comprehensive workflow orchestration

Dify's Domain Specific Language (DSL) is an AI application engineering file standard that enables portable, shareable workflow configurations through YAML-formatted `.yml` files. The DSL specification, currently at version 0.1.3, provides a comprehensive framework for defining complex AI workflows with nodes representing distinct operations connected through edges that define data flow patterns. Each workflow requires exactly one Start node and at least one End node, with unlimited intermediate processing nodes supporting everything from simple linear flows to complex parallel and conditional branching architectures.

## Basic File Structure

Every Dify DSL file follows a consistent hierarchical structure that defines application metadata, workflow configuration, and the graph of nodes and their connections. The root level contains version information, application settings including display properties, and the workflow section housing the complete node graph definition.

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

## Core workflow nodes provide essential building blocks

The foundation of every Dify workflow consists of core nodes that handle basic input/output, control flow, and data manipulation operations. These nodes form the essential building blocks for constructing workflows of any complexity level.

### Start Node
Entry point for all workflows, defining input variables and their types. Every workflow requires exactly one Start node.

```yaml
nodes:
  - id: start-1
    type: start
    data:
      title: Start
      desc: Workflow entry point
      variables:
        - variable: query
          type: string  # string, number, boolean, file, array[type], object
          label: User Query
          required: true
          description: "User input question"
          default: ""
        - variable: file_input
          type: file
          label: Upload File
          required: false
        - variable: array_data
          type: array[string]
          label: List Data
          required: false
    position:
      x: 100
      y: 200
```

### End Node
Defines workflow outputs by referencing upstream node results. Multiple End nodes supported for different exit paths.

```yaml
nodes:
  - id: end-1
    type: end
    data:
      title: End
      outputs:
        result:
          type: string
          children:
            - variable: llm-1.text
              value_selector:
                - llm-1
                - text
        metadata:
          type: object
          children:
            - variable: timer-1.elapsed
              value_selector:
                - timer-1
                - elapsed
```

### IF/ELSE Conditional Node
Implements branching logic with support for multiple conditions and logical operators.

```yaml
nodes:
  - id: if-else-1
    type: if-else
    data:
      title: Conditional Branch
      conditions:
        - id: condition-1
          variable_selector:
            - start-1
            - query
          comparison_operator: contains  # contains, not_contains, is, is_not, in, not_in, 
                                        # empty, not_empty, >, <, >=, <=
          value: "technical"
        - id: condition-2
          variable_selector:
            - start-1
            - priority
          comparison_operator: greater_than
          value: 3
      logical_operator: and  # and, or
      # ELIF conditions
      conditions:
        - id: elif-condition-1
          logical_operator: or
          conditions:
            - variable_selector: [start-1, category]
              comparison_operator: contains
              value: "science"
```

### Template Transform Node
Formats and combines data using Jinja2 templating with full support for loops, conditionals, and filters.

```yaml
nodes:
  - id: template-1
    type: template-transform
    data:
      title: Format Output
      template: |
        # Analysis Results
        
        ## Query: {{query}}
        
        ## Retrieved Context:
        {% for item in context %}
        ### Chunk {{loop.index}}
        **Similarity Score:** {{item.metadata.score | default('N/A')}}
        **Content:** {{item.content | replace('\n', '\n\n')}}
        ---
        {% endfor %}
        
        Total chunks: {{context | length}}
        Highest score: {{context | map(attribute='metadata.score') | max}}
      variables:
        - variable: query
          value_selector: [start-1, user_query]
        - variable: context
          value_selector: [knowledge_retrieval-1, result]
```

## AI and LLM nodes enable sophisticated language processing

The AI node category provides comprehensive language model integration, supporting multiple providers, conversation memory, knowledge retrieval, and advanced processing capabilities.

### LLM Node
Core language model inference with extensive configuration options for all major providers.

```yaml
nodes:
  - id: llm-1
    type: llm
    data:
      title: LLM Processing
      desc: Language model inference
      model:
        provider: openai  # openai, anthropic, azure_openai, etc.
        name: gpt-4
        mode: chat  # chat or completion
        completion_params:
          temperature: 0.7     # 0.0-2.0
          top_p: 1            # 0.0-1.0
          max_tokens: 2000    # 1-4096
          presence_penalty: 0  # -2.0 to 2.0
          frequency_penalty: 0 # -2.0 to 2.0
          response_format: text  # text or json_object
      prompt_template:
        - role: system
          text: "{{#context#}}{{#sys.query#}}"
        - role: user
          text: "{{#start.user_input#}}"
      memory:
        enabled: true
        window:
          enabled: true
          size: 10  # Number of conversation rounds
      context:
        enabled: true
        variable_selector: [knowledge_retrieval, result]
      vision:
        enabled: false
      jinja2_variables: []
```

### Knowledge Retrieval Node
Implements RAG (Retrieval-Augmented Generation) with vector and full-text search capabilities.

```yaml
nodes:
  - id: knowledge-retrieval-1
    type: knowledge-retrieval
    data:
      title: Knowledge Retrieval
      query_variable_selector: [start, user_query]
      dataset_ids: ["dataset_uuid_here"]
      retrieval_mode: multiple  # single or multiple
      multiple_retrieval_config:
        top_k: 3
        score_threshold_enabled: true
        score_threshold: 0.5
        reranking_enabled: true
        reranking_mode: reranking_model  # reranking_model or weighted_score
        reranking_model:
          provider: cohere
          model: rerank-english-v2.0
        weights:
          vector_search: 0.7
          full_text_search: 0.3
      metadata_filters:
        enabled: true
        filters:
          - key: document_type
            operator: equals  # equals, not_equals, contains, not_contains, >, <
            value: manual
          - key: created_date
            operator: greater_than
            value: "2024-01-01"
```

### Iteration Node
Processes array elements with LLM operations, supporting parallel execution up to 10 concurrent iterations.

```yaml
nodes:
  - id: iteration-1
    type: iteration
    data:
      title: Batch Processing
      desc: Process array elements
      input_variable: [parameter_extractor, extracted_array]
      parallel_enabled: true
      parallel_nums: 5  # Max 10
      error_handle_mode: continue_on_error  # terminated, continue_on_error, remove_abnormal_output
      iteration_workflow:
        nodes:
          - id: iteration-llm
            type: llm
            data:
              title: Process Item
              model:
                provider: openai
                name: gpt-4
              prompt_template:
                - role: system
                  text: "Process item: {{#iteration.item#}}"
                - role: user
                  text: "Iteration index: {{#iteration.index#}}"
      outputs:
        result: array[object]
```

### Agent Node
Autonomous reasoning with tool usage capabilities through function calling or ReAct strategies.

```yaml
nodes:
  - id: agent-1
    type: agent
    data:
      title: Autonomous Agent
      agent_mode: function_calling  # function_calling or react
      model:
        provider: openai
        name: gpt-4
        completion_params:
          temperature: 0.1
          max_tokens: 2000
      tools:
        - type: builtin_tool
          provider_id: google_search
          provider_type: builtin
          tool_name: google_serper
          tool_parameters:
            query: "{{#query#}}"
        - type: api_tool
          provider_id: custom_api
          tool_name: weather_api
          tool_parameters:
            location: "{{#location#}}"
      query: "{{#start.user_input#}}"
      instruction: |
        You are a helpful assistant with access to search and weather tools.
        Use tools when needed for accurate information.
      max_iteration: 5
      memory:
        enabled: true
        window_size: 10
```

### Parameter Extraction Node
Extracts structured parameters from natural language using LLM inference.

```yaml
nodes:
  - id: param-extractor-1
    type: parameter-extractor
    data:
      title: Extract Parameters
      query: "{{#start.user_input#}}"
      model:
        provider: openai
        name: gpt-4
        completion_params:
          temperature: 0.0
      parameters:
        - name: order_id
          type: string
          required: true
          description: "Extract order ID (format: ORD-12345)"
        - name: priority_level
          type: number
          required: false
          description: "Priority 1-5"
          enum: [1, 2, 3, 4, 5]
        - name: categories
          type: array[string]
          required: false
          description: "Relevant categories"
      instruction: |
        Extract parameters from user input.
        Example: "Help with order ORD-67890" -> {"order_id": "ORD-67890"}
      inference_mode: function_call  # function_call or prompt
```

## Integration nodes connect workflows to external systems

Integration capabilities enable workflows to interact with external APIs, execute custom code, and leverage various tools for comprehensive automation scenarios.

### HTTP Request Node
Makes external API calls with comprehensive configuration for authentication, retry logic, and response handling.

```yaml
nodes:
  - id: http-request-1
    type: http-request
    data:
      title: API Call
      method: POST  # GET, POST, PUT, DELETE, PATCH, HEAD
      url: "https://api.example.com/v1/process"
      headers:
        Authorization: "Bearer {{#env.API_TOKEN#}}"
        Content-Type: "application/json"
        User-Agent: "Dify-Workflow/1.0"
      params:
        format: json
        version: v1
      body:
        type: json  # json, form-data, x-www-form-urlencoded, raw
        data:
          query: "{{#start.user_input#}}"
          parameters:
            model: gpt-4
            temperature: 0.7
          metadata:
            session_id: "{{#sys.conversation_id#}}"
      auth:
        type: bearer_token  # bearer_token, api_key, basic_auth, custom
        config:
          api_key: "{{#env.API_KEY#}}"
      timeout: 30
      max_retries: 3
      retry_interval: 1000
      outputs:
        body: object
        status_code: number
        headers: object
        files: array[file]
```

### Code Execution Node
Executes Python or JavaScript in a sandboxed environment with configurable dependencies.

```yaml
nodes:
  - id: code-1
    type: code
    data:
      title: Data Processing
      language: python3  # python3 or javascript
      variables:
        - variable: input_data
          value_selector: [http-request-1, body]
        - variable: config
          value_selector: [start-1, processing_config]
      outputs:
        - variable: result
          type: object
        - variable: processed_count
          type: number
      code: |
        import json
        import pandas as pd
        
        def main(input_data: str, config: dict) -> dict:
            # Parse JSON data
            data = json.loads(input_data)
            
            # Process with pandas
            df = pd.DataFrame(data['records'])
            
            # Apply transformations
            result = {
                'processed': df.to_dict('records'),
                'processed_count': len(df)
            }
            
            return result
      sandbox:
        dependencies:
          - pandas
          - numpy
          - requests
```

### Tool Node
Integrates built-in, custom API, or workflow tools with configurable parameters.

```yaml
nodes:
  - id: tool-1
    type: tool
    data:
      title: Custom Tool
      provider_id: builtin  # builtin, custom, workflow
      provider_type: builtin_tool  # builtin_tool, api_tool, workflow_tool
      tool_name: google_serper
      tool_parameters:
        query: "{{#start.query#}}"
        gl: us
        hl: en
        num: 10
      # For custom API tools
      api_tool:
        openapi: "3.1.0"
        servers:
          - url: "https://api.custom.com"
        paths:
          "/endpoint":
            post:
              operationId: "operation_name"
              requestBody:
                required: true
                content:
                  "application/json":
                    schema:
                      type: object
                      properties:
                        prompt:
                          type: string
```

### Variable Aggregator Node
Combines outputs from multiple branches into unified results.

```yaml
nodes:
  - id: var-aggregator-1
    type: variable-aggregator
    data:
      title: Merge Results
      variables:
        - variable: branch1_result
          value_selector: [knowledge_retrieval_1, result]
        - variable: branch2_result
          value_selector: [knowledge_retrieval_2, result]
        - variable: api_result
          value_selector: [http_request_1, body]
      output_type: object  # string, number, object, array
      advanced_settings:
        group_enabled: true
        groups:
          - group_name: analysis_results
            variables:
              - variable: sentiment_score
                selector: [sentiment_analysis, score]
              - variable: keywords
                selector: [keyword_extractor, keywords]
          - group_name: metadata
            variables:
              - variable: processing_time
                selector: [timer, elapsed]
```

## Advanced workflow features enable complex orchestration

Advanced node types provide sophisticated control flow, parallel processing, and state management capabilities for building enterprise-grade AI applications.

### Loop Node
Implements iterative workflows with exit conditions and loop-specific variables (v1.2.0+).

```yaml
nodes:
  - id: loop-1
    type: loop
    data:
      title: Loop Processing
      loop_termination_condition: "template_output == 'done'"
      max_iterations: 10
      loop_variables:
        - name: counter
          type: number
          default_value: 0
        - name: accumulator
          type: array
          default_value: []
      iteration_workflow:
        nodes:
          - id: loop-process
            type: llm
            data:
              prompt_template:
                - role: system
                  text: "Process iteration {{#loop.counter#}}"
```

### Conversation Variables Node
Manages persistent memory across conversation turns in Chatflow applications.

```yaml
nodes:
  - id: conversation-vars-1
    type: conversation-variables
    data:
      title: Session Memory
      conversation_variables:
        - variable: user_preferences
          type: object
          description: "User preference storage"
          default_value: {}
        - variable: session_context
          type: string
          description: "Current context"
          default_value: ""
        - variable: interaction_history
          type: array[object]
          description: "Previous interactions"
          default_value: []
      scope: session  # session or user
```

### Variable Assigner Node
Writes and updates conversation variables with different operation modes.

```yaml
nodes:
  - id: var-assigner-1
    type: variable-assigner
    data:
      title: Update Memory
      assignments:
        - target_variable: [conversation, user_preferences]
          source_variable: [llm_extract, preferences]
          operation: update  # overwrite, append, update
        - target_variable: [conversation, session_context]
          source_variable: [template, formatted_context]
          operation: overwrite
      advanced_settings:
        group_enabled: false
```

### List Operation Node
Processes arrays with filtering, sorting, and attribute extraction capabilities.

```yaml
nodes:
  - id: list-operator-1
    type: list-operator
    data:
      title: Filter Files
      input_variables: [file_array]
      filter_conditions:
        - attribute: file_type
          operator: equals  # equals, not_equals, contains, in
          value: image
        - attribute: file_size
          operator: less_than
          value: 5242880  # 5MB
      sorting:
        - field: file_size
          order: desc  # asc or desc
      limit: 10
      extract_attributes:
        - file_name
        - file_type
        - file_size
      output_variables: [filtered_files]
```

### Document Extractor Node
Extracts text content from various document formats for processing.

```yaml
nodes:
  - id: doc-extractor-1
    type: document-extractor
    data:
      title: Extract Documents
      variable_selector: [start, uploaded_file]
      extraction_mode: automatic  # automatic or manual
      supported_formats:
        - pdf
        - docx
        - txt
        - md
        - html
        - xlsx
        - csv
        - json
      outputs:
        text: extracted_content  # Complete text
        segments: document_chunks  # Array of chunks
        metadata: document_info    # File metadata
```

### Question Classifier Node
Routes queries to appropriate branches based on intent classification.

```yaml
nodes:
  - id: classifier-1
    type: question-classifier
    data:
      title: Intent Classification
      model:
        provider: openai
        name: gpt-3.5-turbo
        completion_params:
          temperature: 0.1
      query_variable_selector: [start-1, query]
      classes:
        - id: technical
          name: "Technical Support"
          description: "Product features, setup, troubleshooting"
        - id: sales
          name: "Sales Inquiry"
          description: "Pricing, plans, purchasing"
        - id: general
          name: "General"
          description: "Other general questions"
      instructions: "Classify based on user intent and context"
      memory:
        enabled: true
        window: 10
```

## Node connections and variable references define data flow

The workflow graph structure connects nodes through edges, defining how data flows between operations and enabling complex orchestration patterns.

### Edge Definitions
Edges connect source node outputs to target node inputs, supporting various connection types including sequential, parallel, and conditional flows.

```yaml
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
  
  # Parallel branches
  - id: parallel-1
    source: start-1
    target: branch-1
    type: parallel
  - id: parallel-2
    source: start-1
    target: branch-2
    type: parallel
```

### Variable Selectors
Reference node outputs and system variables using structured selector arrays.

```yaml
# Node output reference
variable_selector:
  - node_id
  - output_variable_name

# System variables
system_variables:
  query: "{{#sys.query#}}"
  user_id: "{{#sys.user_id#}}"
  conversation_id: "{{#sys.conversation_id#}}"
  files: "{{#sys.files#}}"

# Environment variables
api_key: "{{#env.OPENAI_API_KEY#}}"
database_url: "{{#env.DATABASE_URL#}}"

# Direct references in templates
template: "Process {{#llm-1.text#}} with {{#start.user_input#}}"
```

## Error handling and configuration ensure robust workflows

Comprehensive error handling strategies and configuration options enable building resilient workflows that gracefully handle failures and edge cases.

### Error Handling Strategies
Configure node-level and workflow-level error handling with multiple recovery options.

```yaml
error_handling:
  error_strategy: fail_branch  # none, default_value, fail_branch
  default_value: "Processing failed - default response"
  fail_branch_config:
    error_type_variable: error_type
    error_message_variable: error_message
    redirect_node: error-handler-1
  retry_config:
    max_retries: 3
    retry_interval: 1000  # milliseconds
    backoff_multiplier: 2
```

### Environment Variables
Define and reference environment variables for configuration and secrets management.

```yaml
workflow:
  environment_variables:
    - variable: API_ENDPOINT
      type: string
      value: "https://api.production.com"
    - variable: API_KEY
      type: secret  # Encrypted storage
      value: "{{encrypted_value}}"
    - variable: MAX_RETRIES
      type: number
      value: 5
    - variable: ENABLE_LOGGING
      type: boolean
      value: true
```

### Workflow Features Configuration
Enable and configure platform features at the workflow level.

```yaml
workflow:
  features:
    file_upload:
      image:
        enabled: true
        number_limits: 3
        transfer_methods: [local_file, remote_url]
        max_size_mb: 10
    opening_statement: "Welcome! How can I assist you today?"
    retriever_resource:
      enabled: true
      top_k: 5
    sensitive_word_avoidance:
      enabled: true
      type: moderation
    speech_to_text:
      enabled: true
      provider: whisper
    text_to_speech:
      enabled: true
      provider: openai
      voice: alloy
    suggested_questions:
      - "How does this work?"
      - "What are the key features?"
      - "Can you provide examples?"
```

## Complete workflow example demonstrates integrated capabilities

This comprehensive example showcases multiple node types working together in a sophisticated AI workflow.

```yaml
app:
  description: 'Multi-stage document processing with RAG and analysis'
  icon: '📄'
  icon_background: '#E0F2FE'
  mode: workflow
  name: 'Document Analysis Pipeline'

kind: app
version: 0.1.3

workflow:
  environment_variables:
    - variable: OPENAI_API_KEY
      type: secret
      value: "{{encrypted}}"
    - variable: VECTOR_DB_ENDPOINT
      type: string
      value: "https://vectordb.internal.com"

  graph:
    edges:
      - id: start-to-extract
        source: start-1
        target: doc-extractor-1
        type: custom
      - id: extract-to-retrieval
        source: doc-extractor-1
        target: knowledge-retrieval-1
        type: custom
      - id: retrieval-to-llm
        source: knowledge-retrieval-1
        target: llm-analysis-1
        type: custom
      - id: llm-to-classifier
        source: llm-analysis-1
        target: classifier-1
        type: custom
      # Parallel branches from classifier
      - id: class-to-technical
        source: classifier-1
        sourceHandle: technical
        target: technical-processor
        type: custom
      - id: class-to-general
        source: classifier-1
        sourceHandle: general
        target: general-processor
        type: custom
      # Merge branches
      - id: technical-to-aggregator
        source: technical-processor
        target: aggregator-1
        type: custom
      - id: general-to-aggregator
        source: general-processor
        target: aggregator-1
        type: custom
      - id: aggregator-to-template
        source: aggregator-1
        target: template-1
        type: custom
      - id: template-to-end
        source: template-1
        target: end-1
        type: custom

    nodes:
      - id: start-1
        type: start
        data:
          title: Start
          variables:
            - variable: document
              type: file
              label: Upload Document
              required: true
            - variable: query
              type: string
              label: Analysis Query
              required: true
        position: {x: 100, y: 200}

      - id: doc-extractor-1
        type: document-extractor
        data:
          title: Extract Content
          variable_selector: [start-1, document]
          extraction_mode: automatic
        position: {x: 250, y: 200}

      - id: knowledge-retrieval-1
        type: knowledge-retrieval
        data:
          title: Retrieve Context
          query_variable_selector: [start-1, query]
          dataset_ids: ["kb_dataset_001"]
          retrieval_mode: multiple
          multiple_retrieval_config:
            top_k: 5
            score_threshold: 0.6
            reranking_enabled: true
        position: {x: 400, y: 200}

      - id: llm-analysis-1
        type: llm
        data:
          title: Analyze Content
          model:
            provider: openai
            name: gpt-4
            completion_params:
              temperature: 0.3
              max_tokens: 2000
          prompt_template:
            - role: system
              text: |
                Analyze the document content and retrieved context.
                Document: {{#doc-extractor-1.text#}}
                Context: {{#knowledge-retrieval-1.result#}}
            - role: user
              text: "{{#start-1.query#}}"
        position: {x: 550, y: 200}

      - id: classifier-1
        type: question-classifier
        data:
          title: Route by Type
          query_variable_selector: [llm-analysis-1, text]
          classes:
            - id: technical
              name: Technical Analysis
              description: Technical details and specifications
            - id: general
              name: General Summary
              description: General overview and summary
        position: {x: 700, y: 200}

      - id: technical-processor
        type: llm
        data:
          title: Technical Deep Dive
          model:
            provider: openai
            name: gpt-4
          prompt_template:
            - role: system
              text: "Provide technical analysis: {{#llm-analysis-1.text#}}"
        position: {x: 850, y: 100}

      - id: general-processor
        type: llm
        data:
          title: General Summary
          model:
            provider: openai
            name: gpt-3.5-turbo
          prompt_template:
            - role: system
              text: "Create accessible summary: {{#llm-analysis-1.text#}}"
        position: {x: 850, y: 300}

      - id: aggregator-1
        type: variable-aggregator
        data:
          title: Merge Results
          variables:
            - variable: technical_analysis
              value_selector: [technical-processor, text]
            - variable: general_summary
              value_selector: [general-processor, text]
          output_type: object
        position: {x: 1000, y: 200}

      - id: template-1
        type: template-transform
        data:
          title: Format Report
          template: |
            # Document Analysis Report
            
            ## Executive Summary
            {{aggregator-1.general_summary}}
            
            ## Technical Analysis
            {{aggregator-1.technical_analysis}}
            
            ## Metadata
            - Processing Time: {{#sys.timestamp#}}
            - Document: {{#start-1.document.name#}}
            - Query: {{#start-1.query#}}
        position: {x: 1150, y: 200}

      - id: end-1
        type: end
        data:
          title: End
          outputs:
            report:
              type: string
              children:
                - variable: template-1.output
                  value_selector: [template-1, output]
        position: {x: 1300, y: 200}

  features:
    file_upload:
      enabled: true
      number_limits: 5
      max_size_mb: 20
    opening_statement: "Upload a document and specify your analysis requirements"
```

## Best practices maximize workflow effectiveness

When building Dify workflows, follow these architectural patterns and configuration guidelines to ensure optimal performance, maintainability, and reliability.

**Node Organization**: Use descriptive, unique node IDs following a consistent naming convention. Group related operations logically and minimize parallel depth to a maximum of 3 levels for maintainability. Position nodes with clear visual flow from left to right or top to bottom.

**Variable Management**: Implement comprehensive error handling at both node and workflow levels, using descriptive variable names that indicate their purpose and scope. Leverage conversation variables for state management in Chatflow applications and use environment variables for configuration values and secrets.

**Performance Optimization**: Enable parallel processing for independent operations, set reasonable iteration limits (typically 10-100 items), and use parameter extractors to structure data early in the workflow. Configure appropriate timeout values for external API calls and implement caching strategies for frequently accessed data.

**Security Considerations**: Never hardcode sensitive information directly in DSL files, instead using environment variables with secret type for API keys and credentials. Enable encryption for dataset IDs when exporting DSL files and implement input validation using conditional nodes before processing.

**Testing and Debugging**: Test workflows incrementally by building and validating small sections before combining them. Use template nodes to inspect intermediate values during development and implement logging through code nodes for complex logic debugging. Maintain version control for DSL files with meaningful commit messages.

This comprehensive reference provides the complete technical foundation for building sophisticated AI workflows using Dify's DSL format, enabling developers to create portable, maintainable, and powerful automation solutions.