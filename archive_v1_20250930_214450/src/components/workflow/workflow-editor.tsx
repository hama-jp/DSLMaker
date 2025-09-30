"use client"

import { useCallback, useRef, useMemo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  ConnectionMode,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { Button } from "@/components/ui/button"
import { Save, AlertTriangle, CheckCircle, Loader2, Upload } from "lucide-react"
import { useWorkflowStore } from "@/stores/workflow-store"
import { DifyNode, DifyEdge } from "@/types/dify-workflow"
import { NODE_TYPES } from "@/constants/node-types"
import { StartNode } from './nodes/StartNode'
import { LLMNode } from './nodes/LLMNode'
import { EndNode } from './nodes/EndNode'
import { DefaultNode } from './nodes/DefaultNode'
import { CustomEdge } from './edges/CustomEdge'
import { ValidationPanel } from './validation-panel'
import { performanceMonitor, monitorOperation } from '@/utils/performance-monitor'

export function WorkflowEditor() {
  // Define custom node types using NODE_TYPES constants
  const nodeTypes = useMemo(() => ({
    [NODE_TYPES.START]: StartNode,
    [NODE_TYPES.LLM]: LLMNode,
    [NODE_TYPES.END]: EndNode,
    [NODE_TYPES.CODE]: DefaultNode,
    [NODE_TYPES.HTTP_REQUEST]: DefaultNode,
    'http_request': DefaultNode, // Legacy support
    [NODE_TYPES.TOOL]: DefaultNode,
    [NODE_TYPES.KNOWLEDGE_RETRIEVAL]: DefaultNode,
    'knowledge_retrieval': DefaultNode, // Legacy support
    [NODE_TYPES.IF_ELSE]: DefaultNode,
    'if_else': DefaultNode, // Legacy support
    [NODE_TYPES.TEMPLATE_TRANSFORM]: DefaultNode,
    'template_transform': DefaultNode, // Legacy support
    [NODE_TYPES.VARIABLE_AGGREGATOR]: DefaultNode,
    'variable_aggregator': DefaultNode, // Legacy support
    [NODE_TYPES.VARIABLE_ASSIGNER]: DefaultNode,
    'variable_assigner': DefaultNode, // Legacy support
    [NODE_TYPES.ITERATION]: DefaultNode,
    [NODE_TYPES.PARAMETER_EXTRACTOR]: DefaultNode,
    'parameter_extractor': DefaultNode, // Legacy support
    [NODE_TYPES.QUESTION_CLASSIFIER]: DefaultNode,
    'question_classifier': DefaultNode, // Legacy support
    [NODE_TYPES.ANSWER]: DefaultNode,
    [NODE_TYPES.AGENT]: DefaultNode,
    [NODE_TYPES.CONVERSATION_VARIABLES]: DefaultNode,
    [NODE_TYPES.LIST_OPERATOR]: DefaultNode,
    [NODE_TYPES.DOCUMENT_EXTRACTOR]: DefaultNode,
    [NODE_TYPES.LOOP]: DefaultNode,
    // Additional node types
    [NODE_TYPES.EXTRACT]: DefaultNode,
    [NODE_TYPES.KB]: DefaultNode,
    [NODE_TYPES.CONDITION]: DefaultNode,
    [NODE_TYPES.DOCUMENT]: DefaultNode,
    [NODE_TYPES.SEARCH]: DefaultNode,
    [NODE_TYPES.RETRIEVAL]: DefaultNode,
    [NODE_TYPES.CLASSIFIER]: DefaultNode,
    [NODE_TYPES.AGGREGATOR]: DefaultNode,
    [NODE_TYPES.ASSIGNER]: DefaultNode,
  }), [])

  // Define custom edge types
  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), [])

  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    validationResult,
    isValidating,
    setNodes,
    setEdges,
    addNode,
    addEdge: addWorkflowEdge,
    selectNode,
    selectEdge,
    clearSelection,
    validateWorkflow,
    exportDSL,
    importDSL,
    isImporting,
    isExporting,
    importError,
  } = useWorkflowStore()

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  // Convert Dify nodes/edges to React Flow format
  const reactFlowNodes = useMemo(
    () =>
      nodes.map((node: DifyNode) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        selected: selectedNodeId === node.id,
      })),
    [nodes, selectedNodeId]
  )

  const reactFlowEdges = useMemo(
    () =>
      edges.map((edge: DifyEdge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type || 'custom', // デフォルトでcustomタイプを使用
      })),
    [edges]
  )

  const handleNodesChange = useCallback((changes: Parameters<typeof applyNodeChanges>[0]) => {
    const nextNodes = applyNodeChanges<DifyNode>(changes as any, nodes.map(node => ({
      ...node,
      position: { ...node.position },
      data: node.data ? JSON.parse(JSON.stringify(node.data)) : node.data,
    })))
    setNodes(nextNodes)

    if (changes.some(change => change.type === 'remove' && change.id === selectedNodeId)) {
      selectNode(null)
    }
  }, [nodes, selectedNodeId, setNodes, selectNode])

  const handleEdgesChange = useCallback((changes: Parameters<typeof applyEdgeChanges>[0]) => {
    const nextEdges = applyEdgeChanges<DifyEdge>(changes as any, edges)
    setEdges(nextEdges)

    if (changes.some(change => change.type === 'remove' && change.id === selectedEdgeId)) {
      selectEdge(null)
    }
  }, [edges, selectedEdgeId, setEdges, selectEdge])

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      if (params.source && params.target) {
        const newEdge: Omit<DifyEdge, 'id'> = {
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle || 'source',
          targetHandle: params.targetHandle || 'target',
          type: 'custom',
          zIndex: 0,
          data: {
            isInIteration: false,
            sourceType: nodes.find(n => n.id === params.source)?.type || 'unknown',
            targetType: nodes.find(n => n.id === params.target)?.type || 'unknown',
          }
        }
        addWorkflowEdge(newEdge)
      }
    },
    [addWorkflowEdge, nodes]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  const onPaneClick = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  // Drag and drop handlers for node creation
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()

    const nodeType = event.dataTransfer.getData('application/reactflow')

    // Ensure we have a valid node type
    if (typeof nodeType === 'undefined' || !nodeType) {
      return
    }

    // Convert screen position to flow position
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    // Create the new node
    const newNode: Omit<DifyNode, 'id'> = {
      type: nodeType as any,
      position,
      data: {
        title: nodeType.charAt(0).toUpperCase() + nodeType.slice(1).replace(/-/g, ' '),
        variables: [],
        inputs: {},
        outputs: {}
      },
    }

    addNode(newNode)
  }, [screenToFlowPosition, addNode])

  const handleValidate = useCallback(() => {
    void validateWorkflow()
  }, [validateWorkflow])

  const handleExport = useCallback(async () => {
    try {
      const dslContent = await exportDSL()
      // Create and download file
      const blob = new Blob([dslContent], { type: 'text/yaml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'workflow.yml'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [exportDSL])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()

      // Monitor the workflow import performance
      const { result, metrics } = await monitorOperation(
        'workflow-import',
        async () => {
          // Parse the content to get workflow data for metrics
          let workflowData = null
          try {
            workflowData = JSON.parse(content)
          } catch {
            // If not JSON, might be YAML - we'll track it anyway
            workflowData = { workflow: { graph: { nodes: [], edges: [] } } }
          }

          await importDSL(content)
          return { success: true, fileName: file.name }
        },
        (() => {
          try {
            return JSON.parse(content)
          } catch {
            return { workflow: { graph: { nodes: [], edges: [] } } }
          }
        })()
      )

      // Log performance metrics to console for debugging
      console.log('🚀 Workflow Import Performance Report:')
      console.log(`├─ File: ${result.fileName}`)
      console.log(`├─ Import Duration: ${metrics.timing.duration?.toFixed(2)}ms`)
      console.log(`├─ Memory Usage: ${(metrics.memoryUsage.used / 1024 / 1024).toFixed(2)}MB`)
      console.log(`├─ Workflow Complexity: ${metrics.workflowStats.complexityScore}`)
      console.log(`├─ Node Count: ${metrics.workflowStats.nodeCount}`)
      console.log(`└─ Iteration Nodes: ${metrics.workflowStats.iterationNodeCount}`)

      // Store metrics for potential future analysis
      const operationId = `import-${file.name}-${Date.now()}`
      performanceMonitor.startMonitoring(operationId, (() => {
        try {
          return JSON.parse(content)
        } catch {
          return { workflow: { graph: { nodes: [], edges: [] } } }
        }
      })())
      performanceMonitor.stopMonitoring(operationId)

    } catch (error) {
      console.error('Import failed:', error)
    } finally {
      event.target.value = ''
    }
  }, [importDSL])

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }

    if (!validationResult) return null

    if (validationResult.errors.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    }

    if (validationResult.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }

    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getValidationText = () => {
    if (isValidating) return "Validating..."

    if (!validationResult) return "Validate"

    if (validationResult.errors.length > 0) {
      return `${validationResult.errors.length} Error${validationResult.errors.length > 1 ? 's' : ''}`
    }

    if (validationResult.warnings.length > 0) {
      return `${validationResult.warnings.length} Warning${validationResult.warnings.length > 1 ? 's' : ''}`
    }

    return "Valid"
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Workflow Editor</h2>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".yml,.yaml,.json"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isImporting ? 'Importing…' : 'Import DSL'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isExporting ? 'Exporting…' : 'Export DSL'}
            </Button>
            <Button
              size="sm"
              onClick={handleValidate}
              disabled={isValidating}
              variant={validationResult?.errors.length ? "destructive" : "default"}
            >
              {getValidationIcon()}
              <span className="ml-2">{getValidationText()}</span>
            </Button>
          </div>
        </div>
        {importError ? (
          <p className="mt-2 text-sm text-destructive">Import failed: {importError}</p>
        ) : null}
      </div>

      <div className="flex-1 relative min-h-0">
        <div ref={reactFlowWrapper} className="absolute inset-0">
          <ReactFlow
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            defaultEdgeOptions={{
              type: 'custom',
              markerEnd: {
                type: 'arrowclosed',
                width: 20,
                height: 20,
                color: '#9333ea',
              },
              style: {
                strokeWidth: 2,
                stroke: '#9333ea',
              },
            }}
            attributionPosition="bottom-left"
          >
            <Background />
            <Controls />
            <MiniMap
              className="!bg-background !border-border"
              nodeColor="#rgb(148 163 184)"
              maskColor="rgba(0, 0, 0, 0.1)"
            />

            {/* Validation Panel */}
            <ValidationPanel validationResult={validationResult} icon={getValidationIcon()} />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
