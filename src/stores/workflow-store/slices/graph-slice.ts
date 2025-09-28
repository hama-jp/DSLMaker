import { DifyEdge, DifyNode } from '@/types/dify-workflow'
import { createDefaultDSLFile, generateId, initialDSLFile, syncGraphReferences } from '../shared'
import { GraphSlice, WorkflowSliceCreator } from '../types'

export const createGraphSlice: WorkflowSliceCreator<GraphSlice> = (set) => ({
  dslFile: initialDSLFile,
  nodes: initialDSLFile.workflow.graph.nodes,
  edges: initialDSLFile.workflow.graph.edges,

  setNodes: (nodes) => {
    set((state) => {
      if (state.dslFile) {
        state.dslFile.workflow.graph.nodes = nodes
        syncGraphReferences(state)
      } else {
        state.nodes = nodes
      }
      state.isDirty = true
    })
  },

  setEdges: (edges) => {
    set((state) => {
      if (state.dslFile) {
        state.dslFile.workflow.graph.edges = edges
        syncGraphReferences(state)
      } else {
        state.edges = edges
      }
      state.isDirty = true
    })
  },

  addNode: (nodeData) => {
    const newNode = {
      ...nodeData,
      id: generateId(),
    } as DifyNode

    set((state) => {
      if (state.dslFile) {
        state.dslFile.workflow.graph.nodes.push(newNode)
        syncGraphReferences(state)
      } else {
        state.nodes.push(newNode)
      }
      state.isDirty = true
    })
  },

  updateNode: (id, updates) => {
    set((state) => {
      const nodeToUpdate = state.nodes.find((node) => node.id === id)
      if (nodeToUpdate) {
        Object.assign(nodeToUpdate, updates)
      }

      state.isDirty = true
    })
  },

  removeNode: (id) => {
    set((state) => {
      const removeNodeById = (collection: DifyNode[]) => {
        const nodeIndex = collection.findIndex((node) => node.id === id)
        if (nodeIndex !== -1) {
          collection.splice(nodeIndex, 1)
        }
      }

      const pruneEdgesConnectedToNode = (collection: DifyEdge[]) => {
        for (let i = collection.length - 1; i >= 0; i -= 1) {
          const edge = collection[i]
          if (edge.source === id || edge.target === id) {
            collection.splice(i, 1)
          }
        }
      }

      if (state.dslFile) {
        removeNodeById(state.dslFile.workflow.graph.nodes)
        pruneEdgesConnectedToNode(state.dslFile.workflow.graph.edges)
        syncGraphReferences(state)
      } else {
        removeNodeById(state.nodes)
        pruneEdgesConnectedToNode(state.edges)
      }

      if (state.selectedNodeId === id) {
        state.selectedNodeId = null
      }

      state.isDirty = true
    })
  },

  addEdge: (edgeData) => {
    const newEdge = {
      ...edgeData,
      id: generateId(),
    } as DifyEdge

    set((state) => {
      if (state.dslFile) {
        state.dslFile.workflow.graph.edges.push(newEdge)
        syncGraphReferences(state)
      } else {
        state.edges.push(newEdge)
      }
      state.isDirty = true
    })
  },

  updateEdge: (id, updates) => {
    set((state) => {
      const edgeToUpdate = state.edges.find((edge) => edge.id === id)
      if (edgeToUpdate) {
        Object.assign(edgeToUpdate, updates)
      }

      state.isDirty = true
    })
  },

  removeEdge: (id) => {
    set((state) => {
      const removeEdgeById = (collection: DifyEdge[]) => {
        const edgeIndex = collection.findIndex((edge) => edge.id === id)
        if (edgeIndex !== -1) {
          collection.splice(edgeIndex, 1)
        }
      }

      if (state.dslFile) {
        removeEdgeById(state.dslFile.workflow.graph.edges)
        syncGraphReferences(state)
      } else {
        removeEdgeById(state.edges)
      }

      if (state.selectedEdgeId === id) {
        state.selectedEdgeId = null
      }

      state.isDirty = true
    })
  },

  setWorkflowName: (name) => {
    set((state) => {
      if (state.dslFile) {
        state.dslFile.app.name = name
      }
      state.isDirty = true
    })
  },

  setWorkflowDescription: (description) => {
    set((state) => {
      if (state.dslFile) {
        state.dslFile.app.description = description
      }
      state.isDirty = true
    })
  },

  setDirty: (dirty) => {
    set((state) => {
      state.isDirty = dirty
    })
  },

  clearWorkflow: () => {
    set((state) => {
      state.dslFile = createDefaultDSLFile('Untitled Workflow')
      syncGraphReferences(state)
      state.selectedNodeId = null
      state.selectedEdgeId = null
      state.isDirty = false
      state.validationResult = null
    })
  },

  loadDSLFile: (dslFile) => {
    set((state) => {
      state.dslFile = dslFile
      syncGraphReferences(state)
      state.isDirty = false
      state.validationResult = null
    })
  },
})
