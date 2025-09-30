import { describe, it, expect } from 'vitest'

import { collectDSLStructuralIssues } from '@/utils/dsl-structure-validation'
import { NODE_TYPES } from '@/constants/node-types'
import { DifyDSLFile } from '@/types/dify-workflow'

const baseWorkflow = (): DifyDSLFile => ({
  app: {
    description: 'Test',
    icon: '🤖',
    icon_background: '#EFF1F5',
    mode: 'workflow',
    name: 'Validator',
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
          type: NODE_TYPES.START,
          position: { x: 0, y: 0 },
          data: { title: 'Start' },
        },
        {
          id: 'end-1',
          type: NODE_TYPES.END,
          position: { x: 200, y: 0 },
          data: {
            title: 'End',
            outputs: {
              result: {
                type: 'string',
                value_selector: ['start-1', 'input'],
              },
            },
          },
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'start-1',
          target: 'end-1',
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'custom',
          data: {
            isInIteration: false,
            sourceType: NODE_TYPES.START,
            targetType: NODE_TYPES.END,
          },
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  },
})

describe('collectDSLStructuralIssues', () => {
  it('returns no issues for a simple connected workflow', () => {
    const issues = collectDSLStructuralIssues(baseWorkflow())
    expect(issues).toHaveLength(0)
  })

  it('detects missing start nodes as errors', () => {
    const workflow = baseWorkflow()
    workflow.workflow.graph.nodes = workflow.workflow.graph.nodes.filter(node => node.type !== NODE_TYPES.START)
    const issues = collectDSLStructuralIssues(workflow)
    expect(issues.some(issue => issue.code === 'NO_START_NODE' && issue.level === 'error')).toBe(true)
  })

  it('flags orphaned nodes as warnings', () => {
    const workflow = baseWorkflow()
    workflow.workflow.graph.nodes.push({
      id: 'llm-1',
      type: NODE_TYPES.LLM,
      position: { x: 400, y: 0 },
      data: { title: 'Unconnected LLM' },
    } as any)

    const issues = collectDSLStructuralIssues(workflow)
    const orphanWarning = issues.find(issue => issue.code === 'ORPHANED_NODE')
    expect(orphanWarning?.level).toBe('warning')
    expect(orphanWarning?.nodeId).toBe('llm-1')
  })
})
