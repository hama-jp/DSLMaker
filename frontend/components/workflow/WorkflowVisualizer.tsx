/**
 * Workflow Visualizer Component
 * Displays Dify workflow graphs with automatic layout and custom nodes
 */

'use client'

import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Network, Download, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { nodeTypes, getNodeType } from '@/components/nodes'
import { getLayoutedElements } from '@/lib/layout'
import type { BaseNodeData } from '@/components/nodes/BaseNode'
import { DifyEdge } from '@/components/edges/DifyEdge'

export interface WorkflowVisualizerProps {
  onNodeSelect?: (nodeId: string | null) => void
  onImport?: () => void
  workflow: {
    workflow?: {
      graph?: {
        nodes?: any[]
        edges?: any[]
      }
    }
    app?: {
      name?: string
      description?: string
      nodes?: any[]
      edges?: any[]
    }
    graph?: {
      nodes?: any[]
      edges?: any[]
    }
    nodes?: any[]
    edges?: any[]
  } | null
  metadata?: {
    complexity?: string
    quality_score?: number
    pattern?: string
  }
}

// Define edge types with custom Dify edge
const edgeTypes = {
  dify: DifyEdge,
}

function WorkflowVisualizerInner({ workflow, metadata, onNodeSelect, onImport }: WorkflowVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Handle node selection
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeSelect?.(node.id)
  }, [onNodeSelect])

  // Handle pane click (deselect)
  const handlePaneClick = useCallback(() => {
    onNodeSelect?.(null)
  }, [onNodeSelect])

  // Convert Dify workflow to React Flow format
  useEffect(() => {
    if (!workflow) {
      setNodes([])
      setEdges([])
      return
    }

    // Handle multiple formats: workflow.workflow.graph.nodes, workflow.graph.nodes, workflow.app.nodes, or workflow.nodes
    const workflowNodes = workflow.workflow?.graph?.nodes || workflow.graph?.nodes || workflow.app?.nodes || workflow.nodes || []
    const workflowEdges = workflow.workflow?.graph?.edges || workflow.graph?.edges || workflow.app?.edges || workflow.edges || []

    if (workflowNodes.length === 0) {
      console.warn('No nodes found in workflow!')
      setNodes([])
      setEdges([])
      return
    }

    // Create React Flow nodes with custom types
    const flowNodes: Node[] = workflowNodes.map((node) => {
      const nodeType = node.data?.type || 'default'
      const reactFlowType = getNodeType(nodeType)

      const nodeData: BaseNodeData = {
        title: node.data?.title || node.id,
        type: nodeType,
        description: node.data?.desc || node.data?.description,
        config: node.data,
      }

      return {
        id: node.id,
        type: reactFlowType,
        position: { x: 0, y: 0 }, // Will be set by layout algorithm
        data: nodeData,
        style: {
          width: 200, // Match Dagre nodeWidth
          height: 110, // Match Dagre nodeHeight
        },
      }
    })

    // Create React Flow edges
    const flowEdges: Edge[] = workflowEdges.map((edge, index) => {
      // Determine if this is a conditional edge (from if-else node)
      const sourceNode = workflowNodes.find((n: any) => n.id === edge.source)
      const isConditional = sourceNode?.data?.type === 'if-else'

      // Determine edge label for conditional branches
      let label: string | undefined
      if (isConditional && edge.sourceHandle) {
        if (edge.sourceHandle === 'true') {
          label = '✓ True'
        } else if (edge.sourceHandle === 'false') {
          label = '✗ False'
        }
      }

      return {
        id: edge.id || `edge-${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: 'dify', // Use custom Dify edge with bezier curves
        animated: false,
        label,
        labelStyle: {
          fontSize: 11,
          fontWeight: 600,
          fill: isConditional ? (edge.sourceHandle === 'true' ? '#16a34a' : '#dc2626') : '#6b7280',
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.9,
        },
        style: {
          stroke: '#94a3b8',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed' as const,
          width: 20,
          height: 20,
          color: '#94a3b8',
        },
      }
    })

    // Apply automatic hierarchical layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      flowNodes,
      flowEdges,
      {
        direction: 'LR', // Left to Right (like Dify)
        nodeWidth: 200, // Match actual node width
        nodeHeight: 110, // Match actual node height with padding
        rankSep: 100,
        nodeSep: 60,
      }
    )

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [workflow, setNodes, setEdges])

  // Download workflow as JSON
  const handleDownload = useCallback(() => {
    if (!workflow) return

    const dataStr = JSON.stringify(workflow, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `workflow-${Date.now()}.json`
    link.click()

    URL.revokeObjectURL(url)
  }, [workflow])

  // Fit view to all nodes
  const handleFitView = useCallback(() => {
    // This will be handled by ReactFlow's fitView via panel button
  }, [])

  if (!workflow) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
            <Network className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No workflow yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Generate a workflow using the AI assistant to see it visualized here
          </p>
        </div>
      </Card>
    )
  }

  const workflowName = workflow.app?.name || 'Workflow'
  const workflowDesc = workflow.app?.description

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 border-b">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Network className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{workflowName}</CardTitle>
            {workflowDesc && (
              <p className="text-xs text-muted-foreground truncate">{workflowDesc}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Metadata badges */}
          {metadata?.complexity && (
            <span
              className={cn(
                'text-xs px-2 py-1 rounded-full font-medium',
                metadata.complexity === 'simple' && 'bg-green-100 text-green-700',
                metadata.complexity === 'moderate' && 'bg-blue-100 text-blue-700',
                metadata.complexity === 'complex' && 'bg-purple-100 text-purple-700'
              )}
            >
              {metadata.complexity}
            </span>
          )}

          {metadata?.quality_score !== undefined && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {metadata.quality_score.toFixed(0)}/100
            </span>
          )}

          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {nodes.length} nodes • {edges.length} edges
          </span>
        </div>
      </CardHeader>

      {/* Graph Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          className="bg-muted/30"
          proOptions={{ hideAttribution: true }}
        >
          {/* Background grid */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#d1d5db"
          />

          {/* Controls (zoom, fit view, etc.) */}
          <Controls
            className="!bg-card !border-border !shadow-sm !rounded-md"
            showInteractive={false}
          />

          {/* MiniMap */}
          <MiniMap
            className="!bg-card !border !border-border !shadow-sm !rounded-md"
            nodeClassName={(node) => {
              // Color nodes in minimap based on type
              const type = node.type || 'default'
              return `minimap-node-${type}`
            }}
            maskColor="rgb(249, 250, 251, 0.8)"
            pannable
            zoomable
          />

          {/* Pattern badge in corner */}
          {metadata?.pattern && (
            <Panel position="top-right" className="m-2">
              <div className="bg-card border border-border rounded-md px-3 py-1.5 shadow-sm">
                <div className="text-xs text-muted-foreground">Pattern:</div>
                <div className="text-xs font-semibold">{metadata.pattern}</div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Minimap node styles */}
      <style jsx global>{`
        .minimap-node-start { fill: #10b981; }
        .minimap-node-end { fill: #ef4444; }
        .minimap-node-llm { fill: #3b82f6; }
        .minimap-node-if-else { fill: #f59e0b; }
        .minimap-node-code { fill: #8b5cf6; }
        .minimap-node-http-request { fill: #06b6d4; }
        .minimap-node-iteration { fill: #a855f7; }
        .minimap-node-knowledge-retrieval { fill: #ec4899; }
        .minimap-node-question-classifier { fill: #06b6d4; }
        .minimap-node-variable-aggregator { fill: #6366f1; }
        .minimap-node-template-transform { fill: #14b8a6; }
        .minimap-node-parameter-extractor { fill: #84cc16; }
        .minimap-node-tool { fill: #64748b; }
        .minimap-node-assigner { fill: #22c55e; }
        .minimap-node-conversation-variable-assigner { fill: #f97316; }
        .minimap-node-default { fill: #6b7280; }
      `}</style>
    </Card>
  )
}

// Wrap with ReactFlowProvider
export default function WorkflowVisualizer(props: WorkflowVisualizerProps) {
  return (
    <ReactFlowProvider>
      <WorkflowVisualizerInner {...props} />
    </ReactFlowProvider>
  )
}
