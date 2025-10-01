'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Settings, Sparkles, AlertCircle, RefreshCw, Code2 } from 'lucide-react'
import yaml from 'js-yaml'
import ChatInterface from '@/components/chat/ChatInterface'
import WorkflowVisualizer from '@/components/workflow/WorkflowVisualizer'
import DSLSidebar from '@/components/sidebar/DSLSidebar'
import SettingsModal from '@/components/settings/SettingsModal'
import DifyImportExport from '@/components/workflow/DifyImportExport'
import { ResizableHandle } from '@/components/ui/ResizableHandle'
import { useBackendStatus, useWorkflowGeneration } from '@/hooks/useWorkflowGeneration'
import { cn } from '@/lib/utils'

export default function Home() {
  const { healthy, checking, services, checkStatus } = useBackendStatus()
  const { result, generate, setResult } = useWorkflowGeneration()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showDSL, setShowDSL] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Resizable widths (in pixels)
  const [leftWidth, setLeftWidth] = useState(384) // 96 * 4 = 384px (w-96)
  const [rightWidth, setRightWidth] = useState(384)

  // Convert workflow to YAML
  const dslYaml = useMemo(() => {
    if (!result?.workflow) return undefined
    try {
      return yaml.dump(result.workflow, { indent: 2, lineWidth: 120 })
    } catch (error) {
      console.error('Failed to convert to YAML:', error)
      return undefined
    }
  }, [result?.workflow])

  // Handle Dify import
  const handleDifyImport = useCallback((dsl: any, metadata: any) => {
    const importedResult = {
      workflow: dsl,
      metadata: {
        name: metadata.name || 'Imported Workflow',
        description: metadata.description || 'Imported from Dify YAML',
        complexity: 'moderate',
        node_count: metadata.nodeCount || 0,
        edge_count: metadata.edgeCount || 0,
        iteration_count: 0,
        tags: ['dify', 'imported'],
      },
      quality_score: 100,
      suggestions: [],
      generation_time: 0,
    }
    setResult(importedResult)
  }, [setResult])

  // Handle Dify export
  const handleDifyExport = useCallback(() => {
    if (!result?.workflow) return

    try {
      const dsl = result.workflow
      import('@/lib/dify-client').then(({ difyClient }) => {
        difyClient.downloadAsYAML(dsl, `dify-workflow-${Date.now()}.yml`)
      })
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export workflow: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [result])

  // Import DSL from file (legacy JSON/YAML import)
  const handleImportDSL = useCallback((file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        let workflowData: any

        // Parse based on file extension
        if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          workflowData = yaml.load(content)
        } else if (file.name.endsWith('.json')) {
          workflowData = JSON.parse(content)
        } else {
          throw new Error('Unsupported file format. Please use .yaml, .yml, or .json')
        }

        // Create a WorkflowResponse object
        const importedResult = {
          workflow: workflowData,
          metadata: {
            name: workflowData.app?.name || 'Imported Workflow',
            description: workflowData.app?.description || 'Imported from file',
            complexity: 'moderate',
            node_count: workflowData.workflow?.graph?.nodes?.length || workflowData.graph?.nodes?.length || 0,
            edge_count: workflowData.workflow?.graph?.edges?.length || workflowData.graph?.edges?.length || 0,
            iteration_count: 0,
            tags: ['imported'],
          },
          quality_score: 100,
          suggestions: [],
          generation_time: 0,
        }

        setResult(importedResult)
      } catch (error) {
        console.error('Failed to import DSL:', error)
        alert('Failed to import DSL: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    }

    reader.readAsText(file)
  }, [setResult])

  // Trigger file selection dialog for import
  const triggerImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.yaml,.yml'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleImportDSL(file)
      }
    }
    input.click()
  }, [handleImportDSL])

  // Debug: Load test workflow
  const loadTestWorkflow = useCallback(() => {
    const testWorkflow = {
      app: {
        name: 'Test Workflow',
        description: 'Simple test workflow for debugging node sizes',
        mode: 'workflow',
        icon: '🧪',
        icon_background: '#EFF1F5'
      },
      kind: 'app',
      version: '0.1.5',
      workflow: {
        environment_variables: [],
        features: {},
        graph: {
          nodes: [
            {
              id: 'start_1',
              type: 'start',
              data: {
                title: 'Start Node',
                variables: [
                  { name: 'input', type: 'string', label: 'Input', required: true }
                ]
              },
              position: { x: 100, y: 200 }
            },
            {
              id: 'llm_1',
              type: 'llm',
              data: {
                title: 'LLM Node',
                provider: 'openai',
                model: 'gpt-4',
                prompt: 'Process: {{start_1.input}}',
                temperature: 0.7,
                maxTokens: 100
              },
              position: { x: 300, y: 200 }
            },
            {
              id: 'end_1',
              type: 'end',
              data: {
                title: 'End Node',
                outputs: [{ name: 'result', variable: '{{llm_1.output}}' }]
              },
              position: { x: 500, y: 200 }
            }
          ],
          edges: [
            { id: 'edge_1', source: 'start_1', target: 'llm_1' },
            { id: 'edge_2', source: 'llm_1', target: 'end_1' }
          ]
        }
      }
    }

    setResult({
      workflow: testWorkflow,
      metadata: {
        name: 'Test Workflow',
        description: 'Simple test workflow for debugging node sizes',
        complexity: 'moderate',
        node_count: 3,
        edge_count: 2,
        iteration_count: 0,
        tags: ['test', 'debug']
      },
      quality_score: 100,
      suggestions: [],
      generation_time: 0
    })
  }, [setResult])

  // Get selected node
  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !result?.workflow) return null

    const nodes = result.workflow.workflow?.graph?.nodes || []
    const node = nodes.find((n: any) => n.id === selectedNodeId)

    if (!node) return null

    // Convert to React Flow Node format
    return {
      id: node.id,
      type: node.type,
      position: node.position || { x: 0, y: 0 },
      data: node.data,
    }
  }, [selectedNodeId, result])

  // Handle node property updates
  const handleNodeUpdate = useCallback((nodeId: string, updatedData: any) => {
    if (!result?.workflow) return

    const updatedWorkflow = { ...result.workflow }
    const nodes = updatedWorkflow.workflow?.graph?.nodes || []

    const nodeIndex = nodes.findIndex((n: any) => n.id === nodeId)
    if (nodeIndex !== -1) {
      nodes[nodeIndex] = {
        ...nodes[nodeIndex],
        data: updatedData,
      }

      setResult({
        ...result,
        workflow: updatedWorkflow,
      })
    }
  }, [result, setResult])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-none border-b border-border bg-card">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-foreground" />
            <div>
              <h1 className="text-base font-semibold text-foreground">
                DSL Maker
              </h1>
              <p className="text-xs text-muted-foreground">AI-Powered Workflow Designer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Debug: Load Test Workflow */}
            <button
              onClick={loadTestWorkflow}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/20 transition-colors border border-yellow-500/20"
            >
              🧪 Test
            </button>

            {/* Dify Import/Export */}
            <DifyImportExport
              onImportSuccess={handleDifyImport}
              onExport={handleDifyExport}
              hasWorkflow={!!result?.workflow}
            />

            {/* Backend Status */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 border border-border">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                healthy ? "bg-green-500" : checking ? "bg-yellow-500" : "bg-red-500"
              )} />
              <span className="text-xs font-medium text-foreground">
                {healthy ? 'Connected' : checking ? 'Connecting...' : 'Offline'}
              </span>
              {!healthy && !checking && (
                <button
                  onClick={checkStatus}
                  className="p-0.5 rounded hover:bg-accent transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Toggle DSL */}
            <button
              onClick={() => setShowDSL(!showDSL)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                showDSL
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              {showDSL ? 'Hide Code' : 'Show Code'}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors border border-border"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Offline Warning Banner */}
        {!healthy && !checking && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <div>
                <span className="text-sm text-destructive font-medium block">
                  Backend Connection Lost
                </span>
                <span className="text-xs text-muted-foreground">
                  Please ensure the backend server is running on port 8000
                </span>
              </div>
            </div>
            <button
              onClick={checkStatus}
              className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors font-medium"
            >
              Reconnect
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="h-full flex">
          {/* Left: Chat Interface */}
          <div style={{ width: `${leftWidth}px` }} className="flex-shrink-0">
            <ChatInterface onGenerate={generate} workflowResult={result} />
          </div>

          {/* Left Resize Handle */}
          <ResizableHandle
            direction="horizontal"
            onResize={(delta) => setLeftWidth(prev => Math.max(250, Math.min(600, prev + delta)))}
          />

          {/* Center: Workflow Visualizer */}
          <div className="flex-1 mx-3">
            <WorkflowVisualizer
              workflow={result?.workflow || null}
              onNodeSelect={setSelectedNodeId}
              onImport={triggerImport}
            />
          </div>

          {/* Right Resize Handle */}
          {showDSL && (
            <>
              <ResizableHandle
                direction="horizontal"
                onResize={(delta) => setRightWidth(prev => Math.max(300, Math.min(700, prev - delta)))}
              />

              {/* Right: DSL Sidebar */}
              <div style={{ width: `${rightWidth}px` }} className="flex-shrink-0">
                <DSLSidebar
                  workflow={result?.workflow || null}
                  dslYaml={dslYaml}
                  onImport={handleImportDSL}
                  selectedNode={selectedNode}
                  onNodeUpdate={handleNodeUpdate}
                  onNodeDeselect={() => setSelectedNodeId(null)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
