"use client"

import { useCallback, useMemo, ChangeEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useWorkflowStore } from "@/stores/workflow-store"
import {
  Workflow,
  MessageSquare,
  Database,
  Code,
  Cpu,
  GitBranch,
  Settings,
  Layers
} from "lucide-react"

const nodeTypes = [
  {
    type: "start",
    label: "Start",
    icon: GitBranch,
    description: "Workflow starting point"
  },
  {
    type: "llm",
    label: "LLM",
    icon: MessageSquare,
    description: "Large Language Model node"
  },
  {
    type: "code",
    label: "Code",
    icon: Code,
    description: "Execute code logic"
  },
  {
    type: "tool",
    label: "Tool",
    icon: Cpu,
    description: "Use external tools"
  },
  {
    type: "http",
    label: "HTTP Request",
    icon: Database,
    description: "Make HTTP API calls"
  },
  {
    type: "end",
    label: "End",
    icon: Workflow,
    description: "Workflow endpoint"
  }
]

export function LeftSidebar() {
  const { selectedNodeId, nodes, updateNode } = useWorkflowStore()

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  )

  const selectedTitle = typeof selectedNode?.data?.title === 'string' ? selectedNode.data.title : ''
  const selectedDescription = typeof selectedNode?.data?.description === 'string'
    ? selectedNode.data.description
    : ''
  const rawNodeData = useMemo(
    () => JSON.stringify(selectedNode?.data ?? {}, null, 2),
    [selectedNode]
  )

  const handleTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedNodeId) return
    const currentNode = nodes.find((node) => node.id === selectedNodeId)
    if (!currentNode) return

    updateNode(selectedNodeId, {
      data: {
        ...currentNode.data,
        title: event.target.value,
      },
    })
  }, [nodes, selectedNodeId, updateNode])

  const handleDescriptionChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedNodeId) return
    const currentNode = nodes.find((node) => node.id === selectedNodeId)
    if (!currentNode) return

    updateNode(selectedNodeId, {
      data: {
        ...currentNode.data,
        description: event.target.value,
      },
    })
  }, [nodes, selectedNodeId, updateNode])

  return (
    <aside className="w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Node Library
          </h2>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Available Nodes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {nodeTypes.map((node) => (
                  <Button
                    key={node.type}
                    variant="outline"
                    className="h-auto p-3 justify-start text-left"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/reactflow", node.type)
                      e.dataTransfer.effectAllowed = "move"
                    }}
                  >
                    <node.icon className="h-4 w-4 mr-3 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium">{node.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {node.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Node Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedNode ? (
                <div className="text-sm text-muted-foreground">
                  Select a node in the canvas to view its properties.
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="font-medium text-foreground">
                      {selectedTitle || selectedNode.type}
                    </div>
                    <div className="text-xs text-muted-foreground break-all">
                      {selectedNode.type} • {selectedNode.id}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="node-title">Display Name</Label>
                    <Input
                      id="node-title"
                      value={selectedTitle}
                      onChange={handleTitleChange}
                      placeholder="Enter a name for this node"
                    />
                  </div>

                  {typeof selectedNode.data === 'object' && 'description' in selectedNode.data ? (
                    <div className="space-y-2">
                      <Label htmlFor="node-description">Description</Label>
                      <Textarea
                        id="node-description"
                        value={selectedDescription}
                        onChange={handleDescriptionChange}
                        placeholder="Describe what this node does"
                        className="resize-none"
                        rows={3}
                      />
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="node-raw">Raw Data</Label>
                    <Textarea
                      id="node-raw"
                      value={rawNodeData}
                      readOnly
                      className="font-mono text-xs leading-tight min-h-[140px]"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  )
}
