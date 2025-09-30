"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Workflow, Plus, Trash2 } from "lucide-react"
import type { DifyEndNode, DifyOutput } from "@/types/dify-workflow"

interface EndNodePropertiesProps {
  node: DifyEndNode
  onUpdate: (updates: Partial<DifyEndNode['data']>) => void
}

export function EndNodeProperties({ node, onUpdate }: EndNodePropertiesProps) {
  const { data } = node

  const handleTitleChange = useCallback((value: string) => {
    onUpdate({ title: value })
  }, [onUpdate])

  const handleOutputChange = useCallback((outputKey: string, field: string, value: string | string[]) => {
    const outputs = { ...data.outputs }
    outputs[outputKey] = { ...outputs[outputKey], [field]: value }
    onUpdate({ outputs })
  }, [onUpdate, data.outputs])

  const handleAddOutput = useCallback(() => {
    const outputs = { ...data.outputs }
    const outputCount = Object.keys(outputs).length + 1
    const newKey = `output_${outputCount}`
    outputs[newKey] = {
      type: 'string',
      value_selector: []
    }
    onUpdate({ outputs })
  }, [onUpdate, data.outputs])

  const handleRemoveOutput = useCallback((outputKey: string) => {
    const outputs = { ...data.outputs }
    delete outputs[outputKey]
    onUpdate({ outputs })
  }, [onUpdate, data.outputs])

  const handleOutputKeyChange = useCallback((oldKey: string, newKey: string) => {
    if (oldKey === newKey || !newKey.trim()) return

    const outputs = { ...data.outputs }
    outputs[newKey] = outputs[oldKey]
    delete outputs[oldKey]
    onUpdate({ outputs })
  }, [onUpdate, data.outputs])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            End Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Settings */}
          <div className="space-y-2">
            <Label htmlFor="end-title">Node Title</Label>
            <Input
              id="end-title"
              value={data.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter end node title"
            />
          </div>

          <Separator />

          {/* Output Variables */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Output Variables</h4>
              <Button size="sm" variant="outline" onClick={handleAddOutput}>
                <Plus className="h-3 w-3 mr-1" />
                Add Output
              </Button>
            </div>

            {Object.keys(data.outputs).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(data.outputs).map(([outputKey, output]) => (
                  <div key={outputKey} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Output: {outputKey}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveOutput(outputKey)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Output Key</Label>
                        <Input
                          value={outputKey}
                          onChange={(e) => handleOutputKeyChange(outputKey, e.target.value)}
                          placeholder="output_key"
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Value Source</Label>
                        <Textarea
                          value={Array.isArray(output.value_selector) ? output.value_selector.join('.') : ''}
                          onChange={(e) => handleOutputChange(outputKey, 'value_selector', e.target.value.split('.'))}
                          placeholder="node_id.output_key or variable path..."
                          className="text-xs resize-none"
                          rows={2}
                        />
                        <div className="text-xs text-muted-foreground">
                          Reference output from another node or workflow variable
                        </div>
                      </div>

                      {(output as any).description !== undefined && (
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={(output as any).description || ''}
                            onChange={(e) => handleOutputChange(outputKey, 'description', e.target.value)}
                            placeholder="Output description..."
                            className="text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No output variables defined. Click &quot;Add Output&quot; to create one.
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Outputs define what data this workflow returns to the caller.
              Use value selectors to reference data from previous nodes.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}