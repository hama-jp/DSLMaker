"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { GitBranch, Plus, Trash2 } from "lucide-react"
import type { DifyStartNode } from "@/types/dify-workflow"

interface StartNodePropertiesProps {
  node: DifyStartNode
  onUpdate: (updates: Partial<DifyStartNode['data']>) => void
}

export function StartNodeProperties({ node, onUpdate }: StartNodePropertiesProps) {
  const { data } = node

  const handleTitleChange = useCallback((value: string) => {
    onUpdate({ title: value })
  }, [onUpdate])

  const handleVariableChange = useCallback((index: number, field: string, value: string) => {
    const variables = [...(data.variables || [])]
    variables[index] = { ...variables[index], [field]: value }
    onUpdate({ variables })
  }, [onUpdate, data.variables])

  const handleAddVariable = useCallback(() => {
    const variables = [...(data.variables || [])]
    variables.push({
      variable: `input_${variables.length + 1}`,
      label: 'New Input',
      type: 'text-input',
      required: false
    })
    onUpdate({ variables })
  }, [onUpdate, data.variables])

  const handleRemoveVariable = useCallback((index: number) => {
    const variables = [...(data.variables || [])]
    variables.splice(index, 1)
    onUpdate({ variables })
  }, [onUpdate, data.variables])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Start Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Settings */}
          <div className="space-y-2">
            <Label htmlFor="start-title">Node Title</Label>
            <Input
              id="start-title"
              value={data.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter start node title"
            />
          </div>

          <Separator />

          {/* Input Variables */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Input Variables</h4>
              <Button size="sm" variant="outline" onClick={handleAddVariable}>
                <Plus className="h-3 w-3 mr-1" />
                Add Variable
              </Button>
            </div>

            {data.variables && data.variables.length > 0 ? (
              <div className="space-y-3">
                {data.variables.map((variable, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Variable {index + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveVariable(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Variable Name</Label>
                        <Input
                          value={variable.variable}
                          onChange={(e) => handleVariableChange(index, 'variable', e.target.value)}
                          placeholder="variable_name"
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Display Label</Label>
                        <Input
                          value={variable.label}
                          onChange={(e) => handleVariableChange(index, 'label', e.target.value)}
                          placeholder="Display Label"
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={variable.type}
                          onValueChange={(value) => handleVariableChange(index, 'type', value)}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-input">Text Input</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="file">File</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Required</Label>
                        <Select
                          value={variable.required ? 'true' : 'false'}
                          onValueChange={(value) => handleVariableChange(index, 'required', value === 'true')}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Optional</SelectItem>
                            <SelectItem value="true">Required</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {variable.description !== undefined && (
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={variable.description || ''}
                          onChange={(e) => handleVariableChange(index, 'description', e.target.value)}
                          placeholder="Variable description..."
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No input variables defined. Click "Add Variable" to create one.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}