export const NODE_TYPES = {
  START: 'start',
  END: 'end',
  LLM: 'llm',
  CODE: 'code',
  HTTP_REQUEST: 'http-request',
  IF_ELSE: 'if-else',
  TEMPLATE_TRANSFORM: 'template-transform',
  KNOWLEDGE_RETRIEVAL: 'knowledge-retrieval',
  VARIABLE_AGGREGATOR: 'variable-aggregator',
  ITERATION: 'iteration',
  VARIABLE_ASSIGNER: 'variable-assigner',
  PARAMETER_EXTRACTOR: 'parameter-extractor',
  QUESTION_CLASSIFIER: 'question-classifier',
  ANSWER: 'answer',
} as const

export type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES]
