import { StateCreator } from 'zustand'
import { DifyDSLFile, DifyNode, DifyEdge, ValidationResult } from '@/types/dify-workflow'
import { WorkflowPreviewSnapshot } from '@/utils/workflow-state-helpers'

export interface GraphSlice {
  dslFile: DifyDSLFile | null
  nodes: DifyNode[]
  edges: DifyEdge[]
  setNodes: (nodes: DifyNode[]) => void
  setEdges: (edges: DifyEdge[]) => void
  addNode: (node: Omit<DifyNode, 'id'>) => void
  updateNode: (id: string, updates: Partial<DifyNode>) => void
  removeNode: (id: string) => void
  addEdge: (edge: Omit<DifyEdge, 'id'>) => void
  updateEdge: (id: string, updates: Partial<DifyEdge>) => void
  removeEdge: (id: string) => void
  setWorkflowName: (name: string) => void
  setWorkflowDescription: (description: string) => void
  setDirty: (dirty: boolean) => void
  clearWorkflow: () => void
  loadDSLFile: (dslFile: DifyDSLFile) => void
}

export interface UISlice {
  selectedNodeId: string | null
  selectedEdgeId: string | null
  isDirty: boolean
  selectNode: (id: string | null) => void
  selectEdge: (id: string | null) => void
  clearSelection: () => void
  applyAISuggestion: (suggestionData: unknown) => void
}

export interface PreviewSlice {
  isPreviewing: boolean
  activePreviewId: string | null
  previewSnapshot: WorkflowPreviewSnapshot | null
  previewDSL: (dslContent: string, previewId: string) => Promise<void>
  commitPreview: () => void
  discardPreview: () => void
}

export interface IOSlice {
  isImporting: boolean
  isExporting: boolean
  importError: string | null
  exportError: string | null
  importDSL: (dslContent: string) => Promise<void>
  exportDSL: () => Promise<string>
}

export interface ValidationSlice {
  validationResult: ValidationResult | null
  isValidating: boolean
  validateWorkflow: () => Promise<ValidationResult>
  setValidationResult: (result: ValidationResult) => void
}

export type WorkflowStore = GraphSlice & UISlice & PreviewSlice & IOSlice & ValidationSlice

export type WorkflowSlices = [GraphSlice, UISlice, PreviewSlice, IOSlice, ValidationSlice]

export type WorkflowSliceCreator<T> = StateCreator<
  WorkflowStore,
  [['zustand/devtools', never], ['zustand/immer', never]],
  [],
  T
>

export type WorkflowStoreSet = Parameters<WorkflowSliceCreator<GraphSlice>>[0]
export type WorkflowStoreGet = Parameters<WorkflowSliceCreator<GraphSlice>>[1]
