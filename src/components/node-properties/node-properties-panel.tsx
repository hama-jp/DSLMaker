"use client"

import { useCallback } from "react"
import { NODE_TYPES } from "@/constants/node-types"
import { LLMNodeProperties } from "./llm-node-properties"
import { StartNodeProperties } from "./start-node-properties"
import { EndNodeProperties } from "./end-node-properties"
import { DefaultNodeProperties } from "./default-node-properties"
import type { DifyNode } from "@/types/dify-workflow"

interface NodePropertiesPanelProps {
  node: DifyNode | null
  onUpdate: (nodeId: string, updates: Partial<DifyNode['data']>) => void
}

export function NodePropertiesPanel({ node, onUpdate }: NodePropertiesPanelProps) {
  const handleUpdate = useCallback((updates: Partial<DifyNode['data']>) => {
    if (!node) return
    onUpdate(node.id, updates)
  }, [node, onUpdate])

  if (!node) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Select a node in the canvas to view its properties.
      </div>
    )
  }

  // Render appropriate property component based on node type
  switch (node.type) {
    case NODE_TYPES.LLM:
      return (
        <LLMNodeProperties
          node={node as any} // Type assertion for specific node type
          onUpdate={handleUpdate}
        />
      )

    case NODE_TYPES.START:
      return (
        <StartNodeProperties
          node={node as any}
          onUpdate={handleUpdate}
        />
      )

    case NODE_TYPES.END:
      return (
        <EndNodeProperties
          node={node as any}
          onUpdate={handleUpdate}
        />
      )

    default:
      return (
        <DefaultNodeProperties
          node={node}
          onUpdate={handleUpdate}
        />
      )
  }
}

export default NodePropertiesPanel