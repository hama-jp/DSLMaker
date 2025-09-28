"use client"

import { useCallback, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combine, Plus, Trash2, Weight } from "lucide-react"
import type { DifyNode } from "@/types/dify-workflow"

interface VariableAggregatorNodePropertiesProps {
  node: DifyNode
  onUpdate: (updates: Partial<DifyNode['data']>) => void
}

export function VariableAggregatorNodeProperties({ node, onUpdate }: VariableAggregatorNodePropertiesProps) {
  const { data } = node
  const [newInputKey, setNewInputKey] = useState('')
  const [newInputWeight, setNewInputWeight] = useState('1')

  const handleTitleChange = useCallback((value: string) => {
    onUpdate({ title: value })
  }, [onUpdate])

  const handleAggregationModeChange = useCallback((value: string) => {
    onUpdate({ aggregation_mode: value })
  }, [onUpdate])

  const handleOutputVariableChange = useCallback((value: string) => {
    onUpdate({ output_variable: value })
  }, [onUpdate])

  const handleWeightChange = useCallback((inputKey: string, weight: string) => {
    const currentConfig = (data as any).weight_config || {}
    const newConfig = {
      ...currentConfig,
      [inputKey]: parseFloat(weight) || 1
    }
    onUpdate({ weight_config: newConfig })
  }, [data, onUpdate])

  const handleAddInput = useCallback(() => {
    if (!newInputKey.trim()) return

    const currentConfig = (data as any).weight_config || {}
    const newConfig = {
      ...currentConfig,
      [newInputKey]: parseFloat(newInputWeight) || 1
    }
    onUpdate({ weight_config: newConfig })
    setNewInputKey('')
    setNewInputWeight('1')
  }, [data, newInputKey, newInputWeight, onUpdate])

  const handleRemoveInput = useCallback((inputKey: string) => {
    const currentConfig = (data as any).weight_config || {}
    const newConfig = { ...currentConfig }
    delete newConfig[inputKey]
    onUpdate({ weight_config: newConfig })
  }, [data, onUpdate])

  const handleRawDataChange = useCallback((value: string) => {
    try {
      const parsedData = JSON.parse(value)
      onUpdate(parsedData)
    } catch (error) {
      console.warn('Invalid JSON in raw data editor:', error)
    }
  }, [onUpdate])

  const rawDataString = JSON.stringify(data, null, 2)
  const weightConfig = (data as any).weight_config || {}

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Combine className="h-4 w-4" />
            Variable Aggregator Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Node Title */}
          <div className="space-y-2">
            <Label htmlFor="aggregator-title">Node Title</Label>
            <Input
              id="aggregator-title"
              value={data.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter variable aggregator node title"
            />
          </div>

          {/* Aggregation Mode */}
          <div className="space-y-2">
            <Label htmlFor="aggregation-mode">Aggregation Mode</Label>
            <Select
              value={(data as any).aggregation_mode || 'merge'}
              onValueChange={handleAggregationModeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select aggregation mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merge">Simple Merge</SelectItem>
                <SelectItem value="weighted_merge">Weighted Merge</SelectItem>
                <SelectItem value="concatenate">Concatenate</SelectItem>
                <SelectItem value="first_valid">First Valid</SelectItem>
                <SelectItem value="priority_merge">Priority Merge</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Choose how multiple inputs should be combined into a single output.
            </div>
          </div>

          {/* Output Variable Name */}
          <div className="space-y-2">
            <Label htmlFor="output-variable">Output Variable Name</Label>
            <Input
              id="output-variable"
              value={(data as any).output_variable || ''}
              onChange={(e) => handleOutputVariableChange(e.target.value)}
              placeholder="aggregated_result"
            />
            <div className="text-xs text-muted-foreground">
              Name of the variable that will contain the aggregated result.
            </div>
          </div>

          {/* Weight Configuration (for weighted_merge mode) */}
          {(data as any).aggregation_mode === 'weighted_merge' && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Weight className="h-4 w-4" />
                Input Weights Configuration
              </Label>

              {/* Existing weights */}
              <div className="space-y-2">
                {Object.entries(weightConfig).map(([inputKey, weight]) => (
                  <div key={inputKey} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        value={inputKey}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        value={weight as number}
                        onChange={(e) => handleWeightChange(inputKey, e.target.value)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveInput(inputKey)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add new input */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <div className="flex-1">
                  <Input
                    placeholder="Input name (e.g., input1, input2)"
                    value={newInputKey}
                    onChange={(e) => setNewInputKey(e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    placeholder="Weight"
                    value={newInputWeight}
                    onChange={(e) => setNewInputWeight(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddInput}
                  disabled={!newInputKey.trim()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Weights determine the relative importance of each input. Higher weights have more influence on the final result.
              </div>
            </div>
          )}

          {/* Aggregation Mode Descriptions */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-xs font-medium mb-2">Aggregation Modes:</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• <strong>Simple Merge:</strong> Combines all inputs into a single object</div>
              <div>• <strong>Weighted Merge:</strong> Combines inputs based on specified weights</div>
              <div>• <strong>Concatenate:</strong> Joins text inputs with separator</div>
              <div>• <strong>First Valid:</strong> Uses the first non-empty input</div>
              <div>• <strong>Priority Merge:</strong> Merges based on input priority order</div>
            </div>
          </div>

          {/* Raw Data Editor */}
          <div className="space-y-2">
            <Label htmlFor="aggregator-raw-data">Advanced Configuration (JSON)</Label>
            <Textarea
              id="aggregator-raw-data"
              value={rawDataString}
              onChange={(e) => handleRawDataChange(e.target.value)}
              className="font-mono text-xs leading-tight min-h-[150px]"
              placeholder="Advanced node configuration in JSON format..."
            />
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