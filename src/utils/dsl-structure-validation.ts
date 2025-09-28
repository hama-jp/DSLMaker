import { NODE_TYPES } from '@/constants/node-types'
import { DifyDSLFile, DifyNode } from '@/types/dify-workflow'

export interface DSLStructuralIssue {
  level: 'error' | 'warning'
  code: string
  message: string
  nodeId?: string
  edgeId?: string
}

const getStartNodes = (nodes: DifyNode[]) => nodes.filter(node => node.type === NODE_TYPES.START)
const getEndNodes = (nodes: DifyNode[]) => nodes.filter(node => node.type === NODE_TYPES.END)

export function collectDSLStructuralIssues(dsl: DifyDSLFile): DSLStructuralIssue[] {
  const nodes = dsl.workflow.graph.nodes
  const edges = dsl.workflow.graph.edges
  const issues: DSLStructuralIssue[] = []

  const startNodes = getStartNodes(nodes)
  if (startNodes.length === 0) {
    issues.push({
      level: 'error',
      code: 'NO_START_NODE',
      message: 'Workflow must have at least one Start node',
    })
  } else if (startNodes.length > 1) {
    issues.push({
      level: 'warning',
      code: 'MULTIPLE_START_NODES',
      message: 'Workflow has multiple Start nodes',
    })
  }

  const endNodes = getEndNodes(nodes)
  if (endNodes.length === 0) {
    issues.push({
      level: 'warning',
      code: 'NO_END_NODE',
      message: 'Workflow should have at least one End node',
    })
  }

  if (startNodes.length === 1) {
    const startNode = startNodes[0]
    const hasOutgoing = edges.some(edge => edge.source === startNode.id)
    if (!hasOutgoing) {
      issues.push({
        level: 'warning',
        code: 'DISCONNECTED_START',
        message: 'Start node has no outgoing connections',
        nodeId: startNode.id,
      })
    }
  }

  endNodes.forEach(endNode => {
    const hasIncoming = edges.some(edge => edge.target === endNode.id)
    if (!hasIncoming) {
      issues.push({
        level: 'warning',
        code: 'DISCONNECTED_END',
        message: 'End node has no incoming connections',
        nodeId: endNode.id,
      })
    }
  })

  const connectedNodeIds = new Set<string>()
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })

  nodes.forEach(node => {
    if (!connectedNodeIds.has(node.id) && node.type !== NODE_TYPES.START) {
      issues.push({
        level: 'warning',
        code: 'ORPHANED_NODE',
        message: `Node "${node.data.title}" is not connected to the workflow`,
        nodeId: node.id,
      })
    }
  })

  return issues
}
