import { DifyDSLFile, DifyNode, DifyEdge } from '@/types/dify-workflow'
import { deepClone } from '@/utils/workflow-state-helpers'

export const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

export const createDefaultDSLFile = (name: string): DifyDSLFile => ({
  app: {
    description: '',
    icon: '🤖',
    icon_background: '#EFF1F5',
    mode: 'workflow',
    name,
  },
  kind: 'app',
  version: '0.1.5',
  workflow: {
    environment_variables: [],
    features: {},
    graph: {
      edges: [],
      nodes: [],
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    },
  },
})

export const initialDSLFile = createDefaultDSLFile('Untitled Workflow')

export interface GraphReferenceState {
  dslFile: DifyDSLFile | null
  nodes: DifyNode[]
  edges: DifyEdge[]
}

export const syncGraphReferences = (state: GraphReferenceState) => {
  if (state.dslFile) {
    state.nodes = deepClone(state.dslFile.workflow.graph.nodes)
    state.edges = deepClone(state.dslFile.workflow.graph.edges)
  } else {
    state.nodes = []
    state.edges = []
  }
}
