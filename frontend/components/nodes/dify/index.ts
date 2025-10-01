/**
 * Dify Node Components Export
 * All 15 node types for complete Dify DSL compatibility
 */

export { DifyBaseNode } from './DifyBaseNode'
export { DifyStartNode } from './DifyStartNode'
export { DifyEndNode } from './DifyEndNode'
export { DifyLLMNode } from './DifyLLMNode'
export { DifyIfElseNode } from './DifyIfElseNode'
export { DifyCodeNode } from './DifyCodeNode'
export { DifyIterationNode } from './DifyIterationNode'
export { DifyToolNode } from './DifyToolNode'
export { DifyAnswerNode } from './DifyAnswerNode'
export { DifyTemplateTransformNode } from './DifyTemplateTransformNode'
export { DifyHttpRequestNode } from './DifyHttpRequestNode'
export { DifyQuestionClassifierNode } from './DifyQuestionClassifierNode'
export { DifyVariableAssignerNode } from './DifyVariableAssignerNode'
export { DifyVariableAggregatorNode } from './DifyVariableAggregatorNode'
export { DifyDocumentExtractorNode } from './DifyDocumentExtractorNode'

// Import iteration-specific components
import IterationStartNode from './IterationStartNode'

// Node type mapping for React Flow
import { DifyStartNode } from './DifyStartNode'
import { DifyEndNode } from './DifyEndNode'
import { DifyLLMNode } from './DifyLLMNode'
import { DifyIfElseNode } from './DifyIfElseNode'
import { DifyCodeNode } from './DifyCodeNode'
import { DifyIterationNode } from './DifyIterationNode'
import { DifyToolNode } from './DifyToolNode'
import { DifyAnswerNode } from './DifyAnswerNode'
import { DifyTemplateTransformNode } from './DifyTemplateTransformNode'
import { DifyHttpRequestNode } from './DifyHttpRequestNode'
import { DifyQuestionClassifierNode } from './DifyQuestionClassifierNode'
import { DifyVariableAssignerNode } from './DifyVariableAssignerNode'
import { DifyVariableAggregatorNode } from './DifyVariableAggregatorNode'
import { DifyDocumentExtractorNode } from './DifyDocumentExtractorNode'

export const DIFY_NODE_COMPONENTS = {
  start: DifyStartNode,
  end: DifyEndNode,
  llm: DifyLLMNode,
  'if-else': DifyIfElseNode,
  code: DifyCodeNode,
  iteration: DifyIterationNode,
  'custom-iteration-start': IterationStartNode, // Special iteration start marker
  'iteration-start': IterationStartNode, // Alias
  tool: DifyToolNode,
  answer: DifyAnswerNode,
  'template-transform': DifyTemplateTransformNode,
  'http-request': DifyHttpRequestNode,
  'question-classifier': DifyQuestionClassifierNode,
  assigner: DifyVariableAssignerNode,
  'variable-aggregator': DifyVariableAggregatorNode,
  'document-extractor': DifyDocumentExtractorNode,
}
