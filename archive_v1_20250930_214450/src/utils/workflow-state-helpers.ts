import {
  DifyDSLFile,
  DifyNode,
  DifyEdge,
  ValidationResult,
} from '@/types/dify-workflow'

export const deepClone = <T>(value: T): T => {
  // Use structuredClone if available (modern browsers), otherwise fallback to JSON method
  if (typeof structuredClone !== 'undefined') {
    try {
      return structuredClone(value)
    } catch {
      // Fallback to JSON method if structuredClone fails
    }
  }

  // JSON method with additional safety for readonly properties
  const cloned = JSON.parse(JSON.stringify(value))

  // If the cloned object has readonly properties, create a new object without them
  if (typeof cloned === 'object' && cloned !== null) {
    return Object.assign({}, cloned)
  }

  return cloned
}

export interface ParsedWorkflowGraph {
  workflow: DifyDSLFile
  nodes: DifyNode[]
  edges: DifyEdge[]
}

export async function parseWorkflowDSLContent(dslContent: string): Promise<ParsedWorkflowGraph> {
  const { parseDSL } = await import('@/utils/dsl-parser')
  const parseResult = parseDSL(dslContent)

  if (!parseResult.success || !parseResult.workflow) {
    throw new Error(`DSL parsing failed: ${parseResult.errors.join(', ')}`)
  }

  const workflow = parseResult.workflow

  return {
    workflow,
    nodes: deepClone(workflow.workflow.graph.nodes ?? []),
    edges: deepClone(workflow.workflow.graph.edges ?? []),
  }
}

export interface WorkflowPreviewSnapshot {
  dslFile: DifyDSLFile | null
  nodes: DifyNode[]
  edges: DifyEdge[]
  validationResult: ValidationResult | null
  selectedNodeId: string | null
  selectedEdgeId: string | null
  isDirty: boolean
}

export function buildPreviewSnapshot(input: WorkflowPreviewSnapshot): WorkflowPreviewSnapshot {
  return {
    dslFile: input.dslFile ? deepClone(input.dslFile) : null,
    nodes: deepClone(input.nodes),
    edges: deepClone(input.edges),
    validationResult: input.validationResult ? deepClone(input.validationResult) : null,
    selectedNodeId: input.selectedNodeId,
    selectedEdgeId: input.selectedEdgeId,
    isDirty: input.isDirty,
  }
}

export function clonePreviewSnapshot(snapshot: WorkflowPreviewSnapshot | null): WorkflowPreviewSnapshot | null {
  if (!snapshot) return null
  return buildPreviewSnapshot(snapshot)
}

export interface WorkflowPreviewableState {
  dslFile: DifyDSLFile | null
  nodes: DifyNode[]
  edges: DifyEdge[]
  validationResult: ValidationResult | null
  selectedNodeId: string | null
  selectedEdgeId: string | null
  isDirty: boolean
  previewSnapshot: WorkflowPreviewSnapshot | null
  isPreviewing: boolean
}

export interface PreviewStateSlice {
  dslFile: DifyDSLFile | null
  nodes: DifyNode[]
  edges: DifyEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  validationResult: ValidationResult | null
  isDirty: boolean
}

export interface PreviewTransitionResult {
  snapshot: WorkflowPreviewSnapshot
  nextDSLFile: DifyDSLFile
}

export function ensurePreviewSnapshot(state: WorkflowPreviewableState): WorkflowPreviewSnapshot {
  const existingSnapshot = state.isPreviewing ? clonePreviewSnapshot(state.previewSnapshot) : null

  if (existingSnapshot) {
    return existingSnapshot
  }

  return buildPreviewSnapshot({
    dslFile: state.dslFile,
    nodes: state.nodes,
    edges: state.edges,
    validationResult: state.validationResult,
    selectedNodeId: state.selectedNodeId,
    selectedEdgeId: state.selectedEdgeId,
    isDirty: state.isDirty,
  })
}

export function createPreviewTransition(args: {
  currentState: WorkflowPreviewableState
  parsed: ParsedWorkflowGraph
}): PreviewTransitionResult {
  const snapshot = ensurePreviewSnapshot(args.currentState)

  return {
    snapshot,
    nextDSLFile: args.parsed.workflow,
  }
}

export function restoreStateFromPreviewSnapshot(snapshot: WorkflowPreviewSnapshot): PreviewStateSlice {
  return {
    dslFile: snapshot.dslFile ? deepClone(snapshot.dslFile) : null,
    nodes: deepClone(snapshot.nodes),
    edges: deepClone(snapshot.edges),
    selectedNodeId: snapshot.selectedNodeId,
    selectedEdgeId: snapshot.selectedEdgeId,
    validationResult: snapshot.validationResult ? deepClone(snapshot.validationResult) : null,
    isDirty: snapshot.isDirty,
  }
}
