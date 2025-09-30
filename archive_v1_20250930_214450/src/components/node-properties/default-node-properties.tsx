"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"
import type { DifyNode } from "@/types/dify-workflow"

interface DefaultNodePropertiesProps {
  node: DifyNode
  onUpdate: (updates: Partial<DifyNode['data']>) => void
}

export function DefaultNodeProperties({ node, onUpdate }: DefaultNodePropertiesProps) {
  const { data } = node

  const handleTitleChange = useCallback((value: string) => {
    onUpdate({ title: value })
  }, [onUpdate])

  const handleDescriptionChange = useCallback((value: string) => {
    // Note: description is not part of the standard DifyNode data structure
    // onUpdate({ description: value })
    console.log('Description change not implemented:', value)
  }, [onUpdate])

  const handleRawDataChange = useCallback((value: string) => {
    try {
      const parsedData = JSON.parse(value)
      onUpdate(parsedData)
    } catch (error) {
      // Invalid JSON, don't update
      console.warn('Invalid JSON in raw data editor:', error)
    }
  }, [onUpdate])

  const rawDataString = JSON.stringify(data, null, 2)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {node.type} Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Settings */}
          <div className="space-y-2">
            <Label htmlFor="node-title">Node Title</Label>
            <Input
              id="node-title"
              value={data.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={`Enter ${node.type} node title`}
            />
          </div>

          {/* Description if available */}
          {('description' in data) && (
            <div className="space-y-2">
              <Label htmlFor="node-description">Description</Label>
              <Textarea
                id="node-description"
                value={(data as any).description || ''}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Describe what this node does..."
                className="resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Raw Data Editor */}
          <div className="space-y-2">
            <Label htmlFor="node-raw-data">Raw Configuration (JSON)</Label>
            <Textarea
              id="node-raw-data"
              value={rawDataString}
              onChange={(e) => handleRawDataChange(e.target.value)}
              className="font-mono text-xs leading-tight min-h-[200px]"
              placeholder="Node configuration in JSON format..."
            />
            <div className="text-xs text-muted-foreground">
              Edit the raw JSON configuration for advanced settings.
              Changes will be applied when valid JSON is entered.
            </div>
          </div>

          {/* Node Info */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            <div><strong>Node Type:</strong> {node.type}</div>
            <div><strong>Node ID:</strong> {node.id}</div>
            <div><strong>Position:</strong> ({node.position.x}, {node.position.y})</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}