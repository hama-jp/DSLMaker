/**
 * Graph Layout Utilities
 * Provides automatic hierarchical layout for workflow graphs using Dagre
 */

import dagre from 'dagre'
import { Node, Edge, Position } from '@xyflow/react'

export interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL'
  nodeWidth?: number
  nodeHeight?: number
  rankSep?: number
  nodeSep?: number
  edgeSep?: number
  align?: 'UL' | 'UR' | 'DL' | 'DR'
}

const defaultOptions: LayoutOptions = {
  direction: 'TB', // Top to Bottom
  nodeWidth: 220,
  nodeHeight: 80,
  rankSep: 100, // Vertical spacing between ranks
  nodeSep: 60, // Horizontal spacing between nodes
  edgeSep: 20, // Spacing between edges
  align: 'UL', // Upper Left alignment
}

/**
 * Calculate hierarchical layout for nodes and edges using Dagre
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const opts = { ...defaultOptions, ...options }

  // Create a new directed graph
  const dagreGraph = new dagre.graphlib.Graph()

  // Set graph configuration
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
    edgesep: opts.edgeSep,
    align: opts.align,
    acyclicer: 'greedy',
    ranker: 'network-simplex', // Best for hierarchical layouts
  })

  // Add nodes to the graph
  nodes.forEach((node) => {
    // Use custom dimensions if provided in node data, otherwise use defaults
    const width = (node.data?.width as number) || opts.nodeWidth
    const height = (node.data?.height as number) || opts.nodeHeight

    dagreGraph.setNode(node.id, {
      width,
      height,
      label: node.data?.label || node.id,
    })
  })

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target, {
      weight: edge.data?.weight || 1,
    })
  })

  // Calculate the layout
  dagre.layout(dagreGraph)

  // Apply calculated positions to nodes
  const layoutedNodes: Node[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)

    if (!nodeWithPosition) {
      // Node not found in graph (shouldn't happen)
      console.warn(`Node ${node.id} not found in layout graph`)
      return node
    }

    // Dagre gives us the center position, we need to adjust to top-left
    const width = (node.data?.width as number) || opts.nodeWidth!
    const height = (node.data?.height as number) || opts.nodeHeight!

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
      // Set source/target handle positions based on layout direction
      sourcePosition: opts.direction === 'LR' ? Position.Right : Position.Bottom,
      targetPosition: opts.direction === 'LR' ? Position.Left : Position.Top,
    }
  })

  return {
    nodes: layoutedNodes,
    edges,
  }
}

/**
 * Calculate bounding box for a set of nodes
 */
export function getNodesBoundingBox(nodes: Node[]): {
  x: number
  y: number
  width: number
  height: number
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach((node) => {
    const width = (node.data?.width as number) || defaultOptions.nodeWidth!
    const height = (node.data?.height as number) || defaultOptions.nodeHeight!

    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + width)
    maxY = Math.max(maxY, node.position.y + height)
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Center nodes in viewport
 */
export function centerNodes(
  nodes: Node[],
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): Node[] {
  const bbox = getNodesBoundingBox(nodes)

  const offsetX = (viewportWidth - bbox.width) / 2 - bbox.x + padding
  const offsetY = (viewportHeight - bbox.height) / 2 - bbox.y + padding

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY,
    },
  }))
}

/**
 * Detect if graph has cycles
 */
export function hasCycles(nodes: Node[], edges: Edge[]): boolean {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((node) => graph.setNode(node.id, {}))
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target))

  return !dagre.graphlib.alg.isAcyclic(graph)
}

/**
 * Find longest path in graph (critical path)
 */
export function findLongestPath(nodes: Node[], edges: Edge[]): string[] {
  const graph = new dagre.graphlib.Graph({ directed: true })
  graph.setDefaultEdgeLabel(() => ({ weight: 1 }))

  nodes.forEach((node) => graph.setNode(node.id, {}))
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target, { weight: 1 }))

  // Find all nodes with no incoming edges (start nodes)
  const startNodes = nodes.filter((node) => {
    return !edges.some((edge) => edge.target === node.id)
  })

  if (startNodes.length === 0) {
    return []
  }

  // Dijkstra from first start node (inverted for longest path)
  try {
    const distances = dagre.graphlib.alg.dijkstra(graph, startNodes[0].id, (edge) => -1)

    // Find node with maximum distance (longest path)
    let maxDistance = -Infinity
    let endNode = startNodes[0].id

    Object.entries(distances).forEach(([nodeId, info]) => {
      if (info.distance < maxDistance) {
        maxDistance = info.distance
        endNode = nodeId
      }
    })

    // Reconstruct path
    const path: string[] = []
    let current: string | undefined = endNode

    while (current) {
      path.unshift(current)
      current = distances[current]?.predecessor
    }

    return path
  } catch (error) {
    console.error('Error finding longest path:', error)
    return []
  }
}
