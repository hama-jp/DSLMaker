import { NODE_TYPES } from '@/constants/node-types'
import {
  DifyDSLFile,
  DifyEnvironmentVariable,
  DifyNode,
  DifyStartNode,
  DifyVariable,
} from '@/types/dify-workflow'
import { RequirementAnalysis, DataType } from './requirement-analyzer'

export type VariableScope = 'start' | 'system' | 'environment'

export interface VariableDictionaryEntry {
  name: string
  selector: string[]
  type: string
  scope: VariableScope
  required?: boolean
  description?: string
  sourceNodeId?: string
}

export type VariableDictionary = Record<string, VariableDictionaryEntry>

export interface VariableScaffoldResult {
  workflow: DifyDSLFile
  dictionary: VariableDictionary
  appliedChanges: {
    startNodeUpdated: boolean
    environmentVariablesAdded: string[]
    nodeReferencesUpdated: string[]
  }
}

const SYSTEM_VARIABLES: VariableDictionaryEntry[] = [
  {
    name: 'sys.query',
    selector: ['sys', 'query'],
    type: 'string',
    scope: 'system',
    description: 'Latest user utterance in chat-based workflows.'
  },
  {
    name: 'sys.user_id',
    selector: ['sys', 'user_id'],
    type: 'string',
    scope: 'system',
    description: 'Unique identifier for the active end-user.'
  },
  {
    name: 'sys.workflow_run_id',
    selector: ['sys', 'workflow_run_id'],
    type: 'string',
    scope: 'system',
    description: 'Identifier for the current workflow execution.'
  },
  {
    name: 'sys.files',
    selector: ['sys', 'files'],
    type: 'array[file]',
    scope: 'system',
    description: 'Files uploaded by the user when file upload is enabled.'
  }
]

const DATA_TYPE_TO_VARIABLE_TYPE: Record<DataType['type'], DifyVariable['type']> = {
  text: 'text-input',
  number: 'number',
  boolean: 'boolean',
  array: 'array[object]',
  object: 'object',
  file: 'file'
}

const DEFAULT_ENVIRONMENT_VARIABLES: DifyEnvironmentVariable[] = [
  {
    variable: 'API_BASE_URL',
    name: 'External API base URL',
    type: 'string',
    value: 'https://api.example.com'
  },
  {
    variable: 'API_KEY',
    name: 'External API key',
    type: 'secret',
    value: '***'
  }
]

const START_NODE_FALLBACK_VARIABLE: DifyVariable = {
  variable: 'user_query',
  label: 'User query',
  type: 'text-input',
  description: 'Primary user request text',
  required: true
}

const START_NODE_FALLBACK_ID = 'start-1'

function toVariableName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    || 'input'
}

function toLabel(variable: string): string {
  return variable
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function cloneWorkflow(workflow: DifyDSLFile): DifyDSLFile {
  return JSON.parse(JSON.stringify(workflow))
}

function ensureStartNode(workflow: DifyDSLFile): DifyStartNode {
  let startNode = workflow.workflow.graph.nodes.find(
    (node): node is DifyStartNode => node.type === NODE_TYPES.START
  )

  if (!startNode) {
    startNode = {
      id: START_NODE_FALLBACK_ID,
      type: NODE_TYPES.START,
      position: { x: 100, y: 200 },
      data: {
        title: 'Start',
        variables: []
      }
    }
    workflow.workflow.graph.nodes.unshift(startNode)
  }

  if (!startNode.id) {
    startNode.id = START_NODE_FALLBACK_ID
  }

  if (!startNode.data) {
    startNode.data = { title: 'Start', variables: [] }
  }

  if (!startNode.data.title) {
    startNode.data.title = 'Start'
  }

  if (!Array.isArray(startNode.data.variables)) {
    startNode.data.variables = []
  }

  return startNode
}

function buildStartVariables(analysis: RequirementAnalysis | undefined, existing: DifyVariable[]): DifyVariable[] {
  const variableMap = new Map<string, DifyVariable>()
  existing.forEach(variable => {
    if (variable?.variable) {
      variableMap.set(variable.variable, variable)
    }
  })

  if (analysis && Array.isArray(analysis.dataInputs) && analysis.dataInputs.length > 0) {
    analysis.dataInputs.forEach(input => {
      const variableName = toVariableName(input.name)
      if (!variableMap.has(variableName)) {
        variableMap.set(variableName, {
          variable: variableName,
          label: toLabel(variableName),
          type: DATA_TYPE_TO_VARIABLE_TYPE[input.type] || 'text-input',
          description: input.description,
          required: input.required
        })
      }
    })
  }

  if (variableMap.size === 0) {
    variableMap.set(START_NODE_FALLBACK_VARIABLE.variable, START_NODE_FALLBACK_VARIABLE)
  }

  return Array.from(variableMap.values())
}

function ensureEnvironmentVariables(
  workflow: DifyDSLFile,
  analysis: RequirementAnalysis | undefined
): string[] {
  const added: string[] = []
  const existing = workflow.workflow.environment_variables || []
  const existingSet = new Set(existing.map(env => env.variable))

  if (analysis && analysis.integrationNeeds && analysis.integrationNeeds.length > 0) {
    DEFAULT_ENVIRONMENT_VARIABLES.forEach(envVar => {
      if (!existingSet.has(envVar.variable)) {
        existing.push({ ...envVar })
        existingSet.add(envVar.variable)
        added.push(envVar.variable)
      }
    })
  }

  workflow.workflow.environment_variables = existing
  return added
}

function buildToken(nodeId: string, variable: string): string {
  return `{{#${nodeId}.${variable}#}}`
}

const DEFAULT_START_PLACEHOLDER_PATTERNS = [
  /{{#start\.user_input#}}/g,
  /{{#start-1\.user_input#}}/g,
  /{{#start\.input#}}/g,
  /{{#start-1\.input#}}/g,
  /{{#start\.query#}}/g,
  /{{#start-1\.query#}}/g
]

function replaceStartToken(text: string, nodeId: string, variable: string): string {
  return DEFAULT_START_PLACEHOLDER_PATTERNS.reduce((acc, pattern) => {
    return acc.replace(pattern, buildToken(nodeId, variable))
  }, text)
}

function updateNodeReferences(
  nodes: DifyNode[],
  startNodeId: string,
  primaryVariable: string
): string[] {
  const updated: string[] = []

  nodes.forEach(node => {
    if (!node?.data) return

    switch (node.type) {
      case NODE_TYPES.PARAMETER_EXTRACTOR: {
        if (typeof node.data.query === 'string') {
          const newQuery = replaceStartToken(node.data.query, startNodeId, primaryVariable)
          if (newQuery !== node.data.query) {
            node.data.query = newQuery
            updated.push(node.id)
          }
        } else if (!node.data.query) {
          node.data.query = buildToken(startNodeId, primaryVariable)
          updated.push(node.id)
        }
        break
      }

      case NODE_TYPES.KNOWLEDGE_RETRIEVAL: {
        if (
          !Array.isArray(node.data.query_variable_selector) ||
          node.data.query_variable_selector.length === 0 ||
          node.data.query_variable_selector[0] === 'start'
        ) {
          node.data.query_variable_selector = [startNodeId, primaryVariable]
          updated.push(node.id)
        }
        break
      }

      case NODE_TYPES.LLM: {
        if (Array.isArray(node.data.prompt_template)) {
          let changed = false
          node.data.prompt_template = node.data.prompt_template.map(message => {
            if (message?.text) {
              const newText = replaceStartToken(message.text, startNodeId, primaryVariable)
              if (newText !== message.text) {
                changed = true
                return { ...message, text: newText }
              }
            }
            return message
          })
          if (changed) updated.push(node.id)
        } else if (typeof node.data.prompt_template === 'string') {
          const newTemplate = replaceStartToken(node.data.prompt_template, startNodeId, primaryVariable)
          if (newTemplate !== node.data.prompt_template) {
            node.data.prompt_template = newTemplate
            updated.push(node.id)
          }
        }
        break
      }

      case NODE_TYPES.TEMPLATE_TRANSFORM: {
        if (Array.isArray(node.data.variables)) {
          let changed = false
          node.data.variables = node.data.variables.map((row: any) => {
            if (Array.isArray(row)) {
              return row.map(value => {
                if (typeof value === 'string' && value.includes('start')) {
                  const updatedValue = value
                    .replace('start.user_input', `${startNodeId}.${primaryVariable}`)
                    .replace('start-1.user_input', `${startNodeId}.${primaryVariable}`)
                  if (updatedValue !== value) changed = true
                  return updatedValue
                }
                return value
              })
            }
            return row
          })
          if (changed) updated.push(node.id)
        }
        break
      }

      case NODE_TYPES.HTTP_REQUEST: {
        if (node.data.body && typeof node.data.body === 'object' && node.data.body.data) {
          const bodyData = node.data.body.data
          if (typeof bodyData === 'string') {
            const newBody = replaceStartToken(bodyData, startNodeId, primaryVariable)
            if (newBody !== bodyData) {
              node.data.body.data = newBody
              updated.push(node.id)
            }
          }
        }
        break
      }

      default:
        break
    }
  })

  return Array.from(new Set(updated))
}

export function scaffoldWorkflowVariables(
  workflow: DifyDSLFile,
  analysis?: RequirementAnalysis
): VariableScaffoldResult {
  const clonedWorkflow = cloneWorkflow(workflow)
  const startNode = ensureStartNode(clonedWorkflow)

  const existingVariables = Array.isArray(startNode.data.variables)
    ? startNode.data.variables as DifyVariable[]
    : []

  const updatedVariables = buildStartVariables(analysis, existingVariables)
  const startNodeUpdated = JSON.stringify(existingVariables) !== JSON.stringify(updatedVariables)
  startNode.data.variables = updatedVariables

  const primaryVariable = updatedVariables[0]?.variable || START_NODE_FALLBACK_VARIABLE.variable
  const startNodeId = startNode.id || START_NODE_FALLBACK_ID

  const nodeReferencesUpdated = updateNodeReferences(
    clonedWorkflow.workflow.graph.nodes,
    startNodeId,
    primaryVariable
  )

  const environmentVariablesAdded = ensureEnvironmentVariables(clonedWorkflow, analysis)

  const dictionaryEntries: VariableDictionaryEntry[] = []

  updatedVariables.forEach(variable => {
    dictionaryEntries.push({
      name: `${startNodeId}.${variable.variable}`,
      selector: [startNodeId, variable.variable],
      type: variable.type,
      required: variable.required,
      description: variable.description,
      scope: 'start',
      sourceNodeId: startNodeId
    })
  })

  SYSTEM_VARIABLES.forEach(entry => dictionaryEntries.push(entry))

  clonedWorkflow.workflow.environment_variables?.forEach(envVar => {
    dictionaryEntries.push({
      name: `env.${envVar.variable}`,
      selector: ['env', envVar.variable],
      type: envVar.type || 'string',
      description: envVar.name,
      scope: 'environment'
    })
  })

  const dictionary: VariableDictionary = {}
  dictionaryEntries.forEach(entry => {
    dictionary[entry.name] = entry
  })

  return {
    workflow: clonedWorkflow,
    dictionary,
    appliedChanges: {
      startNodeUpdated,
      environmentVariablesAdded,
      nodeReferencesUpdated
    }
  }
}
