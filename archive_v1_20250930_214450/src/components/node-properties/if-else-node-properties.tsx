"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GitBranch, ArrowRight, ArrowDown } from "lucide-react"
import type { DifyNode } from "@/types/dify-workflow"

interface IfElseNodePropertiesProps {
  node: DifyNode
  onUpdate: (updates: Partial<DifyNode['data']>) => void
}

export function IfElseNodeProperties({ node, onUpdate }: IfElseNodePropertiesProps) {
  const { data } = node

  const handleTitleChange = useCallback((value: string) => {
    onUpdate({ title: value })
  }, [onUpdate])

  const handleConditionChange = useCallback((value: string) => {
    // Note: condition is not part of standard DifyNode data structure
    // onUpdate({ condition: value })
    console.log('Condition change not implemented:', value)
  }, [onUpdate])

  const handleTrueDescriptionChange = useCallback((value: string) => {
    // Note: true_description is not part of standard DifyNode data structure
    console.log('True description change not implemented:', value)
  }, [onUpdate])

  const handleFalseDescriptionChange = useCallback((value: string) => {
    // Note: false_description is not part of standard DifyNode data structure
    console.log('False description change not implemented:', value)
  }, [onUpdate])

  const handleRawDataChange = useCallback((value: string) => {
    try {
      const parsedData = JSON.parse(value)
      onUpdate(parsedData)
    } catch (error) {
      console.warn('Invalid JSON in raw data editor:', error)
    }
  }, [onUpdate])

  const rawDataString = JSON.stringify(data, null, 2)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            If-Else Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Node Title */}
          <div className="space-y-2">
            <Label htmlFor="if-else-title">Node Title</Label>
            <Input
              id="if-else-title"
              value={data.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter if-else node title"
            />
          </div>

          {/* Condition Expression */}
          <div className="space-y-2">
            <Label htmlFor="if-else-condition">Condition Expression</Label>
            <Textarea
              id="if-else-condition"
              value={(data as any).condition || ''}
              onChange={(e) => handleConditionChange(e.target.value)}
              placeholder="{{start-1.input_var}} > 50"
              className="resize-none font-mono"
              rows={2}
            />
            <div className="text-xs text-muted-foreground">
              Enter the condition to evaluate. Use variable references in double braces.
            </div>
          </div>

          {/* True Branch Description */}
          <div className="space-y-2">
            <Label htmlFor="true-description" className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3 text-green-600" />
              True Branch Description
            </Label>
            <Input
              id="true-description"
              value={(data as any).true_description || ''}
              onChange={(e) => handleTrueDescriptionChange(e.target.value)}
              placeholder="Description for when condition is true"
            />
          </div>

          {/* False Branch Description */}
          <div className="space-y-2">
            <Label htmlFor="false-description" className="flex items-center gap-2">
              <ArrowDown className="h-3 w-3 text-red-600" />
              False Branch Description
            </Label>
            <Input
              id="false-description"
              value={(data as any).false_description || ''}
              onChange={(e) => handleFalseDescriptionChange(e.target.value)}
              placeholder="Description for when condition is false"
            />
          </div>

          {/* Condition Examples */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-xs font-medium mb-2">Condition Examples:</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Number comparison: variable &gt; 50</div>
              <div>• String comparison: category == &apos;premium&apos;</div>
              <div>• Multiple conditions: status == &apos;active&apos; && score &gt; 80</div>
            </div>
          </div>

          {/* Raw Data Editor */}
          <div className="space-y-2">
            <Label htmlFor="if-else-raw-data">Advanced Configuration (JSON)</Label>
            <Textarea
              id="if-else-raw-data"
              value={rawDataString}
              onChange={(e) => handleRawDataChange(e.target.value)}
              className="font-mono text-xs leading-tight min-h-[150px]"
              placeholder="Advanced node configuration in JSON format..."
            />
            <div className="text-xs text-muted-foreground">
              Edit the raw JSON configuration for advanced settings.
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