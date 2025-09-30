"use client"

import { useCallback, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ResizablePanel } from "@/components/ui/resizable"
import { useWorkflowStore } from "@/stores/workflow-store"
import { DifyNode } from "@/types/dify-workflow"
import { NodePropertiesPanel } from "@/components/node-properties/node-properties-panel"
import {
  Workflow,
  MessageSquare,
  Database,
  Code,
  Cpu,
  GitBranch,
  Settings,
  Layers,
  ChevronDown,
  ChevronRight
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
    type: "http-request",
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
  const [isNodesOpen, setIsNodesOpen] = useState(false)

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null

  const handleNodeUpdate = useCallback((nodeId: string, updates: Record<string, any>) => {
    const currentNode = nodes.find((node) => node.id === nodeId)
    if (!currentNode) return

    updateNode(nodeId, {
      data: {
        ...currentNode.data,
        ...updates,
      },
    } as Partial<DifyNode>)
  }, [nodes, updateNode])

  return (
    <ResizablePanel
      defaultWidth={320}
      minWidth={200}
      maxWidth={600}
      className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Node Library
          </h2>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <Collapsible open={isNodesOpen} onOpenChange={setIsNodesOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {isNodesOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Layers className="h-4 w-4" />
                    Available Nodes
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
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
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Node Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NodePropertiesPanel
                node={selectedNode}
                onUpdate={handleNodeUpdate}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </ResizablePanel>
  )
}
