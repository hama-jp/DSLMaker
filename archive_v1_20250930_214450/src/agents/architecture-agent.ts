/**
 * Workflow Architecture Agent
 *
 * This agent takes clarified requirements and designs the optimal workflow
 * structure, selecting appropriate patterns, node sequences, and data flow
 * based on the established pattern library and best practices.
 */

import { ClarifiedRequirements } from './requirements-agent'

export interface WorkflowNode {
  id: string
  type: string
  title: string
  position: { x: number; y: number }
  configuration: Record<string, any>
  description: string
  required: boolean
  dependencies: string[]
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
  type: string
  description: string
}

export interface WorkflowArchitecture {
  pattern: string
  complexity: string
  estimatedNodes: number
  estimatedTokens: number
  estimatedResponseTime: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  dataFlow: {
    inputVariables: Array<{
      name: string
      type: string
      description: string
      required: boolean
    }>
    outputVariables: Array<{
      name: string
      type: string
      description: string
    }>
    intermediateVariables: Array<{
      name: string
      type: string
      source: string
      target: string[]
    }>
  }
  performance: {
    parallelNodes: string[]
    criticalPath: string[]
    optimizations: string[]
  }
  errorHandling: {
    strategy: string
    fallbacks: Array<{
      node: string
      strategy: string
      fallbackValue?: string
    }>
    retryConfigs: Array<{
      node: string
      maxRetries: number
      backoffMultiplier: number
    }>
  }
  metadata: {
    description: string
    useCases: string[]
    advantages: string[]
    limitations: string[]
    estimatedCost: string
  }
}

/**
 * Workflow Architecture Agent
 * Designs optimal workflow structures from clarified requirements
 */
export class WorkflowArchitectureAgent {

  /**
   * Design workflow architecture from clarified requirements
   */
  static async designArchitecture(requirements: ClarifiedRequirements): Promise<WorkflowArchitecture> {
    // Step 1: Analyze requirements and select pattern
    const pattern = this.selectWorkflowPattern(requirements)

    // Step 2: Design node sequence
    const nodes = this.designNodes(requirements, pattern)

    // Step 3: Design data flow and connections
    const edges = this.designEdges(nodes, pattern)
    const dataFlow = this.designDataFlow(requirements, nodes)

    // Step 4: Apply performance optimizations
    const performance = this.designPerformanceOptimizations(nodes, pattern)

    // Step 5: Design error handling strategy
    const errorHandling = this.designErrorHandling(requirements, nodes)

    // Step 6: Calculate estimates
    const estimates = this.calculateEstimates(nodes, pattern)

    // Step 7: Generate metadata
    const metadata = this.generateMetadata(requirements, pattern, nodes)

    return {
      pattern: pattern.name,
      complexity: this.determineComplexity(nodes.length, pattern.name),
      estimatedNodes: nodes.length,
      estimatedTokens: estimates.tokens,
      estimatedResponseTime: estimates.responseTime,
      nodes,
      edges,
      dataFlow,
      performance,
      errorHandling,
      metadata
    }
  }

  /**
   * Select optimal workflow pattern based on requirements
   */
  private static selectWorkflowPattern(requirements: ClarifiedRequirements): WorkflowPatternSpec {
    const { detectedWorkflowType, complexity, finalRequirements } = requirements

    // Pattern selection logic based on requirements analysis
    if (this.requiresKnowledgeRetrieval(finalRequirements)) {
      if (this.requiresConditionalLogic(finalRequirements)) {
        return PATTERNS.RAG_WITH_ROUTING
      }
      return PATTERNS.RAG_PIPELINE
    }

    if (this.requiresParallelProcessing(finalRequirements)) {
      return PATTERNS.PARALLEL_PROCESSING
    }

    if (this.requiresConditionalLogic(finalRequirements)) {
      return PATTERNS.CONDITIONAL_ROUTING
    }

    // Default to linear processing for simple cases
    return PATTERNS.LINEAR_PROCESSING
  }

  /**
   * Design node sequence based on pattern and requirements
   */
  private static designNodes(requirements: ClarifiedRequirements, pattern: WorkflowPatternSpec): WorkflowNode[] {
    const nodes: WorkflowNode[] = []

    // Always start with a start node
    nodes.push(this.createStartNode(requirements))

    // Add pattern-specific nodes
    switch (pattern.name) {
      case 'Linear Processing':
        nodes.push(...this.createLinearNodes(requirements))
        break
      case 'Conditional Routing':
        nodes.push(...this.createConditionalNodes(requirements))
        break
      case 'Parallel Processing':
        nodes.push(...this.createParallelNodes(requirements))
        break
      case 'RAG Pipeline':
        nodes.push(...this.createRAGNodes(requirements))
        break
      case 'RAG with Routing':
        nodes.push(...this.createRAGWithRoutingNodes(requirements))
        break
    }

    // Always end with an end node
    nodes.push(this.createEndNode(requirements))

    return nodes
  }

  /**
   * Create start node with appropriate input variables
   */
  private static createStartNode(requirements: ClarifiedRequirements): WorkflowNode {
    const inputVariables = requirements.finalRequirements.dataInputs.map(input => ({
      variable: input.name,
      type: this.mapInputType(input.type),
      label: input.description,
      required: input.required,
      ...(input.type === 'text' && { max_length: 4000 })
    }))

    return {
      id: 'start-1',
      type: 'start',
      title: '🚀 Workflow Input',
      position: { x: 100, y: 300 },
      configuration: {
        title: '🚀 Workflow Input',
        variables: inputVariables
      },
      description: 'Collects user input and initializes workflow',
      required: true,
      dependencies: []
    }
  }

  /**
   * Create end node with appropriate outputs
   */
  private static createEndNode(requirements: ClarifiedRequirements): WorkflowNode {
    return {
      id: 'end-1',
      type: 'end',
      title: '🏁 Workflow Complete',
      position: { x: 1000, y: 300 },
      configuration: {
        title: '🏁 Workflow Complete',
        outputs: {
          result: {
            type: 'string',
            children: null
          }
        }
      },
      description: 'Final output of the workflow',
      required: true,
      dependencies: []
    }
  }

  /**
   * Create linear processing nodes (simple transformation)
   */
  private static createLinearNodes(requirements: ClarifiedRequirements): WorkflowNode[] {
    const businessLogic = requirements.finalRequirements.businessLogic[0] || 'Process the input data'

    return [{
      id: 'llm-1',
      type: 'llm',
      title: '⚙️ Processing Engine',
      position: { x: 400, y: 300 },
      configuration: {
        title: '⚙️ Processing Engine',
        model: {
          provider: 'openai',
          name: 'gpt-4',
          mode: 'chat',
          completion_params: {
            temperature: 0.1,
            max_tokens: 1000
          }
        },
        prompt_template: [
          {
            role: 'system',
            text: `You are a professional assistant. Your task is to ${businessLogic.toLowerCase()}.\n\nProvide clear, accurate, and helpful responses.`
          },
          {
            role: 'user',
            text: '{{#start-1.user_input#}}'
          }
        ],
        variable: 'processed_result'
      },
      description: 'Main processing logic using LLM',
      required: true,
      dependencies: ['start-1']
    }]
  }

  /**
   * Create conditional routing nodes
   */
  private static createConditionalNodes(requirements: ClarifiedRequirements): WorkflowNode[] {
    const nodes: WorkflowNode[] = []

    // Question classifier
    nodes.push({
      id: 'classifier-1',
      type: 'question_classifier',
      title: '🎯 Intent Classification',
      position: { x: 300, y: 300 },
      configuration: {
        title: '🎯 Intent Classification',
        classes: this.generateClassificationCategories(requirements),
        variable: 'classification_result'
      },
      description: 'Classifies user intent for routing',
      required: true,
      dependencies: ['start-1']
    })

    // IF/ELSE router
    nodes.push({
      id: 'router-1',
      type: 'if_else',
      title: '🔀 Smart Routing',
      position: { x: 500, y: 300 },
      configuration: {
        title: '🔀 Smart Routing',
        logical_operator: 'and',
        conditions: [{
          id: 'condition-1',
          variable_selector: ['classifier-1', 'classification_result'],
          comparison_operator: 'equals',
          value: 'primary'
        }],
        error_strategy: 'continue'
      },
      description: 'Routes to appropriate processing path',
      required: true,
      dependencies: ['classifier-1']
    })

    // Path A (True branch)
    nodes.push({
      id: 'path-a',
      type: 'llm',
      title: '🔧 Primary Handler',
      position: { x: 400, y: 200 },
      configuration: {
        title: '🔧 Primary Handler',
        model: { provider: 'openai', name: 'gpt-4', mode: 'chat' },
        prompt_template: [
          {
            role: 'system',
            text: 'Handle the primary type of requests with specialized processing.'
          },
          {
            role: 'user',
            text: '{{#start-1.user_input#}}'
          }
        ],
        variable: 'primary_result'
      },
      description: 'Handles primary classification path',
      required: true,
      dependencies: ['router-1']
    })

    // Path B (False/Else branch)
    nodes.push({
      id: 'path-b',
      type: 'llm',
      title: '📚 Secondary Handler',
      position: { x: 400, y: 400 },
      configuration: {
        title: '📚 Secondary Handler',
        model: { provider: 'openai', name: 'gpt-4', mode: 'chat' },
        prompt_template: [
          {
            role: 'system',
            text: 'Handle secondary or general requests with standard processing.'
          },
          {
            role: 'user',
            text: '{{#start-1.user_input#}}'
          }
        ],
        variable: 'secondary_result'
      },
      description: 'Handles secondary classification path',
      required: true,
      dependencies: ['router-1']
    })

    return nodes
  }

  /**
   * Create parallel processing nodes
   */
  private static createParallelNodes(requirements: ClarifiedRequirements): WorkflowNode[] {
    const nodes: WorkflowNode[] = []
    const analyses = this.determineParallelAnalyses(requirements)

    // Create parallel analysis nodes
    analyses.forEach((analysis, index) => {
      nodes.push({
        id: `analysis-${index + 1}`,
        type: 'llm',
        title: `${analysis.icon} ${analysis.name}`,
        position: { x: 400, y: 200 + (index * 150) },
        configuration: {
          title: `${analysis.icon} ${analysis.name}`,
          model: {
            provider: 'openai',
            name: 'gpt-4',
            mode: 'chat',
            completion_params: {
              temperature: analysis.temperature,
              max_tokens: 800
            }
          },
          prompt_template: [
            {
              role: 'system',
              text: analysis.systemPrompt
            },
            {
              role: 'user',
              text: '{{#start-1.user_input#}}'
            }
          ],
          variable: `${analysis.name.toLowerCase().replace(' ', '_')}_result`
        },
        description: analysis.description,
        required: true,
        dependencies: ['start-1']
      })
    })

    // Add aggregator node
    nodes.push({
      id: 'aggregator-1',
      type: 'variable_aggregator',
      title: '📊 Results Aggregator',
      position: { x: 700, y: 300 },
      configuration: {
        title: '📊 Results Aggregator',
        variables: analyses.map((analysis, index) => ({
          variable: `${analysis.name.toLowerCase().replace(' ', '_')}_result`,
          value_selector: [`analysis-${index + 1}`, `${analysis.name.toLowerCase().replace(' ', '_')}_result`]
        })),
        output_type: 'object',
        variable: 'aggregated_results'
      },
      description: 'Combines all parallel analysis results',
      required: true,
      dependencies: analyses.map((_, index) => `analysis-${index + 1}`)
    })

    return nodes
  }

  /**
   * Create RAG pipeline nodes
   */
  private static createRAGNodes(requirements: ClarifiedRequirements): WorkflowNode[] {
    return [
      {
        id: 'query-processor',
        type: 'template_transform',
        title: '🔍 Query Enhancement',
        position: { x: 300, y: 300 },
        configuration: {
          title: '🔍 Query Enhancement',
          template: 'Enhanced query: {{#start-1.user_query#}}',
          variable: 'enhanced_query'
        },
        description: 'Enhances user query for better retrieval',
        required: true,
        dependencies: ['start-1']
      },
      {
        id: 'knowledge-retrieval',
        type: 'knowledge_retrieval',
        title: '📚 Knowledge Search',
        position: { x: 500, y: 300 },
        configuration: {
          title: '📚 Knowledge Search',
          query_variable_selector: ['query-processor', 'enhanced_query'],
          dataset_ids: ['your-knowledge-base-id'],
          retrieval_mode: 'multiple',
          multiple_retrieval_config: {
            top_k: 5,
            score_threshold_enabled: true,
            score_threshold: 0.6,
            reranking_enabled: true
          },
          variable: 'retrieved_knowledge'
        },
        description: 'Retrieves relevant knowledge from database',
        required: true,
        dependencies: ['query-processor']
      },
      {
        id: 'answer-generation',
        type: 'llm',
        title: '🤖 Answer Generation',
        position: { x: 700, y: 300 },
        configuration: {
          title: '🤖 Answer Generation',
          model: {
            provider: 'openai',
            name: 'gpt-4',
            mode: 'chat'
          },
          prompt_template: [
            {
              role: 'system',
              text: 'You are a knowledgeable assistant. Use the retrieved information to provide accurate, helpful answers. Base your response on the provided context and clearly indicate when information is not available.'
            },
            {
              role: 'user',
              text: 'Question: {{#start-1.user_query#}}\n\nRetrieved Information:\n{{#knowledge-retrieval.retrieved_knowledge#}}\n\nPlease provide a comprehensive answer based on the retrieved information.'
            }
          ],
          variable: 'generated_answer'
        },
        description: 'Generates answer using retrieved knowledge',
        required: true,
        dependencies: ['knowledge-retrieval']
      }
    ]
  }

  /**
   * Create RAG with routing nodes (hybrid pattern)
   */
  private static createRAGWithRoutingNodes(requirements: ClarifiedRequirements): WorkflowNode[] {
    const ragNodes = this.createRAGNodes(requirements)
    const conditionalNodes = this.createConditionalNodes(requirements)

    // Combine and adjust positions for hybrid pattern
    return [
      ...conditionalNodes.slice(0, 2), // classifier and router
      ...ragNodes, // RAG pipeline
      ...conditionalNodes.slice(2) // conditional paths
    ].map((node, index) => ({
      ...node,
      position: { x: 200 + (index * 150), y: 300 + ((index % 2) * 100) }
    }))
  }

  /**
   * Design edges between nodes
   */
  private static designEdges(nodes: WorkflowNode[], pattern: WorkflowPatternSpec): WorkflowEdge[] {
    const edges: WorkflowEdge[] = []

    // Create edges based on dependencies
    nodes.forEach(node => {
      node.dependencies.forEach(dependency => {
        const sourceNode = nodes.find(n => n.id === dependency)
        if (sourceNode) {
          edges.push({
            id: `${dependency}-to-${node.id}`,
            source: dependency,
            target: node.id,
            sourceHandle: 'source',
            targetHandle: 'target',
            type: 'custom',
            description: `Data flow from ${sourceNode.title} to ${node.title}`
          })
        }
      })
    })

    // Special handling for conditional nodes
    const routerNode = nodes.find(n => n.type === 'if_else')
    if (routerNode) {
      const truePath = nodes.find(n => n.id === 'path-a')
      const falsePath = nodes.find(n => n.id === 'path-b')

      if (truePath) {
        edges.push({
          id: `${routerNode.id}-true-to-${truePath.id}`,
          source: routerNode.id,
          target: truePath.id,
          sourceHandle: 'true',
          targetHandle: 'target',
          type: 'custom',
          description: 'True condition path'
        })
      }

      if (falsePath) {
        edges.push({
          id: `${routerNode.id}-false-to-${falsePath.id}`,
          source: routerNode.id,
          target: falsePath.id,
          sourceHandle: 'false',
          targetHandle: 'target',
          type: 'custom',
          description: 'False condition path'
        })
      }
    }

    return edges
  }

  /**
   * Design data flow specification
   */
  private static designDataFlow(requirements: ClarifiedRequirements, nodes: WorkflowNode[]) {
    return {
      inputVariables: requirements.finalRequirements.dataInputs.map(input => ({
        name: input.name,
        type: input.type,
        description: input.description,
        required: input.required
      })),
      outputVariables: [{
        name: 'result',
        type: 'string',
        description: 'Final workflow output'
      }],
      intermediateVariables: nodes
        .filter(n => n.configuration.variable)
        .map(n => ({
          name: n.configuration.variable,
          type: 'string',
          source: n.id,
          target: this.findTargetNodes(n.id, nodes)
        }))
    }
  }

  /**
   * Design performance optimizations
   */
  private static designPerformanceOptimizations(nodes: WorkflowNode[], pattern: WorkflowPatternSpec) {
    const parallelNodes = nodes
      .filter(n => n.dependencies.length === 1 && n.dependencies[0] === 'start-1')
      .map(n => n.id)

    return {
      parallelNodes,
      criticalPath: this.calculateCriticalPath(nodes),
      optimizations: this.generateOptimizations(nodes, pattern)
    }
  }

  /**
   * Design error handling strategy
   */
  private static designErrorHandling(requirements: ClarifiedRequirements, nodes: WorkflowNode[]) {
    return {
      strategy: requirements.complexity === 'Simple' ? 'default_value' : 'continue',
      fallbacks: nodes
        .filter(n => n.type === 'llm')
        .map(n => ({
          node: n.id,
          strategy: 'default_value',
          fallbackValue: 'I apologize, but I encountered an error processing your request. Please try again.'
        })),
      retryConfigs: nodes
        .filter(n => ['llm', 'knowledge_retrieval'].includes(n.type))
        .map(n => ({
          node: n.id,
          maxRetries: 2,
          backoffMultiplier: 2
        }))
    }
  }

  // Helper methods
  private static requiresKnowledgeRetrieval(requirements: any): boolean {
    return requirements.integrationNeeds.some((need: string) =>
      need.includes('knowledge') || need.includes('document') || need.includes('database')
    )
  }

  private static requiresConditionalLogic(requirements: any): boolean {
    return requirements.businessLogic.some((logic: string) =>
      logic.includes('if') || logic.includes('condition') || logic.includes('route') || logic.includes('escalat')
    )
  }

  private static requiresParallelProcessing(requirements: any): boolean {
    return requirements.businessLogic.some((logic: string) =>
      logic.includes('analysis') || logic.includes('multiple') || logic.includes('parallel')
    ) || requirements.outputRequirements.length > 2
  }

  private static mapInputType(type: string): string {
    const typeMap: Record<string, string> = {
      'text': 'text-input',
      'file': 'file',
      'object': 'json',
      'string': 'paragraph'
    }
    return typeMap[type] || 'text-input'
  }

  private static generateClassificationCategories(requirements: ClarifiedRequirements) {
    const businessLogic = requirements.finalRequirements.businessLogic
    if (businessLogic.some(logic => logic.includes('support') || logic.includes('service'))) {
      return [
        { id: 'technical', name: 'Technical Support' },
        { id: 'billing', name: 'Billing Inquiry' },
        { id: 'general', name: 'General Question' }
      ]
    }
    return [
      { id: 'primary', name: 'Primary Category' },
      { id: 'secondary', name: 'Secondary Category' }
    ]
  }

  private static determineParallelAnalyses(requirements: ClarifiedRequirements) {
    const analyses = []

    if (requirements.finalRequirements.businessLogic.some(logic => logic.includes('sentiment'))) {
      analyses.push({
        name: 'Sentiment Analysis',
        icon: '😊',
        temperature: 0.1,
        systemPrompt: 'Analyze the sentiment of the provided content and return a JSON response with sentiment classification.',
        description: 'Analyzes emotional tone and sentiment'
      })
    }

    if (requirements.finalRequirements.outputRequirements.some(req => req.includes('theme') || req.includes('topic'))) {
      analyses.push({
        name: 'Theme Extraction',
        icon: '🎯',
        temperature: 0.2,
        systemPrompt: 'Extract key themes and topics from the content and return a structured analysis.',
        description: 'Identifies main themes and concepts'
      })
    }

    if (analyses.length === 0) {
      // Default parallel analyses
      analyses.push({
        name: 'Content Analysis',
        icon: '📊',
        temperature: 0.1,
        systemPrompt: 'Analyze the provided content and provide insights.',
        description: 'General content analysis'
      })
    }

    return analyses
  }

  private static findTargetNodes(nodeId: string, nodes: WorkflowNode[]): string[] {
    return nodes
      .filter(n => n.dependencies.includes(nodeId))
      .map(n => n.id)
  }

  private static calculateCriticalPath(nodes: WorkflowNode[]): string[] {
    // Simple critical path: start -> processing nodes -> end
    const start = nodes.find(n => n.type === 'start')
    const end = nodes.find(n => n.type === 'end')
    const processing = nodes.filter(n => n.type === 'llm' && n.dependencies.includes('start-1'))[0]

    return [start?.id, processing?.id, end?.id].filter(Boolean) as string[]
  }

  private static generateOptimizations(nodes: WorkflowNode[], pattern: WorkflowPatternSpec): string[] {
    const optimizations = []

    if (nodes.some(n => n.type === 'llm')) {
      optimizations.push('Use appropriate temperature settings for consistency vs creativity')
      optimizations.push('Optimize max_tokens based on expected output length')
    }

    if (pattern.name === 'Parallel Processing') {
      optimizations.push('Enable parallel execution for independent processing nodes')
    }

    if (nodes.some(n => n.type === 'knowledge_retrieval')) {
      optimizations.push('Tune retrieval parameters (top_k, score_threshold) for optimal performance')
      optimizations.push('Enable reranking for improved result quality')
    }

    return optimizations
  }

  private static calculateEstimates(nodes: WorkflowNode[], pattern: WorkflowPatternSpec) {
    const llmNodes = nodes.filter(n => n.type === 'llm').length
    const baseTokens = 500
    const tokensPerLLM = 800

    return {
      tokens: baseTokens + (llmNodes * tokensPerLLM),
      responseTime: this.estimateResponseTime(pattern.name, llmNodes)
    }
  }

  private static estimateResponseTime(patternName: string, llmNodes: number): string {
    const baseTime = 2
    const timePerLLM = 2
    const totalTime = baseTime + (llmNodes * timePerLLM)

    if (patternName === 'Parallel Processing') {
      return `${Math.ceil(totalTime * 0.6)}s (parallel execution)`
    }

    return `${totalTime}s`
  }

  private static generateMetadata(requirements: ClarifiedRequirements, pattern: WorkflowPatternSpec, nodes: WorkflowNode[]) {
    return {
      description: `${pattern.name} workflow for ${requirements.businessIntent.toLowerCase()}`,
      useCases: requirements.finalRequirements.outputRequirements,
      advantages: pattern.advantages || ['Optimized for the specific use case'],
      limitations: pattern.limitations || ['May require customization for specific domains'],
      estimatedCost: this.estimateCost(nodes)
    }
  }

  private static estimateCost(nodes: WorkflowNode[]): string {
    const llmNodes = nodes.filter(n => n.type === 'llm').length
    const costPerLLM = 0.02 // Approximate cost per LLM call
    const totalCost = llmNodes * costPerLLM

    return `$${totalCost.toFixed(3)} per execution (estimated)`
  }

  private static determineComplexity(nodeCount: number, patternName: string): string {
    if (nodeCount <= 4) return 'Simple'
    if (nodeCount <= 8) return 'Moderate'
    if (nodeCount <= 12) return 'Complex'
    return 'Enterprise'
  }
}

// Pattern specifications
interface WorkflowPatternSpec {
  name: string
  description: string
  advantages?: string[]
  limitations?: string[]
}

const PATTERNS: Record<string, WorkflowPatternSpec> = {
  LINEAR_PROCESSING: {
    name: 'Linear Processing',
    description: 'Sequential processing from start to end',
    advantages: ['Simple', 'Fast', 'Easy to debug'],
    limitations: ['Limited flexibility', 'No parallel processing']
  },
  CONDITIONAL_ROUTING: {
    name: 'Conditional Routing',
    description: 'Branching logic based on conditions',
    advantages: ['Intelligent routing', 'Personalized responses'],
    limitations: ['More complex', 'Requires good classification']
  },
  PARALLEL_PROCESSING: {
    name: 'Parallel Processing',
    description: 'Concurrent processing of independent tasks',
    advantages: ['Speed', 'Comprehensive analysis', 'Scalability'],
    limitations: ['Higher token usage', 'Complex aggregation']
  },
  RAG_PIPELINE: {
    name: 'RAG Pipeline',
    description: 'Retrieval-Augmented Generation workflow',
    advantages: ['Accurate responses', 'Knowledge grounding'],
    limitations: ['Requires knowledge base', 'Higher latency']
  },
  RAG_WITH_ROUTING: {
    name: 'RAG with Routing',
    description: 'Hybrid pattern with knowledge retrieval and routing',
    advantages: ['Flexible', 'Knowledge-aware routing'],
    limitations: ['Most complex', 'Highest resource usage']
  }
}

export default WorkflowArchitectureAgent