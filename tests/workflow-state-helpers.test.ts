import { describe, it, expect } from 'vitest'

import {
  parseWorkflowDSLContent,
  buildPreviewSnapshot,
  clonePreviewSnapshot,
  deepClone,
} from '@/utils/workflow-state-helpers'
import { DifyDSLFile } from '@/types/dify-workflow'

const SAMPLE_DSL = `app:
  description: 'Test workflow'
  icon: '🤖'
  icon_background: '#EFF1F5'
  mode: workflow
  name: 'Sample Flow'

kind: app
version: 0.1.5

workflow:
  environment_variables: []
  features: {}
  graph:
    nodes:
      - id: start-1
        type: start
        position: {x: 0, y: 0}
        data:
          title: 'Start'
      - id: end-1
        type: end
        position: {x: 200, y: 0}
        data:
          title: 'End'
          outputs:
            result:
              type: string
              value_selector: ['start-1', 'output']
    edges:
      - id: edge-1
        source: start-1
        target: end-1
        sourceHandle: source
        targetHandle: target
        type: custom
        data:
          isInIteration: false
          sourceType: start
          targetType: end
`

describe('workflow-state-helpers', () => {
  describe('parseWorkflowDSLContent', () => {
    it('parses valid DSL content into workflow, nodes, and edges', async () => {
      const result = await parseWorkflowDSLContent(SAMPLE_DSL)

      expect(result.workflow.app.name).toBe('Sample Flow')
      expect(result.nodes).toHaveLength(2)
      expect(result.edges).toHaveLength(1)

      // Ensure returned nodes are detached copies
      result.nodes[0].data.title = 'Mutated'
      expect(result.workflow.workflow.graph.nodes[0].data.title).toBe('Start')
    })

    it('throws helpful error when DSL parsing fails', async () => {
      const invalid = 'not: [valid'
      await expect(parseWorkflowDSLContent(invalid)).rejects.toThrow(/DSL parsing failed/i)
    })
  })

  describe('snapshot helpers', () => {
    const baseWorkflow: DifyDSLFile = deepClone({
      app: {
        description: 'Test',
        icon: '🤖',
        icon_background: '#EFF1F5',
        mode: 'workflow',
        name: 'Snapshot Test',
      },
      kind: 'app',
      version: '0.1.5',
      workflow: {
        environment_variables: [],
        features: {},
        graph: {
          nodes: [
            {
              id: 'start-1',
              type: 'start',
              position: { x: 0, y: 0 },
              data: { title: 'Start' },
            },
          ],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      },
    })

    it('builds snapshot copies that can be independently mutated', () => {
      const snapshot = buildPreviewSnapshot({
        dslFile: baseWorkflow,
        nodes: baseWorkflow.workflow.graph.nodes,
        edges: baseWorkflow.workflow.graph.edges,
        validationResult: null,
        selectedNodeId: null,
        selectedEdgeId: null,
        isDirty: false,
      })

      snapshot.nodes[0].data.title = 'Changed'
      expect(baseWorkflow.workflow.graph.nodes[0].data.title).toBe('Start')
    })

    it('clones existing snapshot deeply', () => {
      const snapshot = buildPreviewSnapshot({
        dslFile: baseWorkflow,
        nodes: baseWorkflow.workflow.graph.nodes,
        edges: baseWorkflow.workflow.graph.edges,
        validationResult: null,
        selectedNodeId: null,
        selectedEdgeId: null,
        isDirty: false,
      })

      const clone = clonePreviewSnapshot(snapshot)
      expect(clone).not.toBe(snapshot)
      expect(clone?.nodes[0]).not.toBe(snapshot.nodes[0])
      expect(clone?.dslFile?.workflow.graph.nodes[0].data.title).toBe('Start')
    })

    it('returns null when cloning a null snapshot', () => {
      expect(clonePreviewSnapshot(null)).toBeNull()
    })
  })
})
