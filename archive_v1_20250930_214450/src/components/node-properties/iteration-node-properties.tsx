"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RotateCcw, List, Zap, Shield } from "lucide-react"
import type { DifyNode } from "@/types/dify-workflow"

interface IterationNodePropertiesProps {
  node: DifyNode
  onUpdate: (updates: Partial<DifyNode['data']>) => void
}

export function IterationNodeProperties({ node, onUpdate }: IterationNodePropertiesProps) {
  const { data } = node

  const handleTitleChange = useCallback((value: string) => {
    onUpdate({ title: value })
  }, [onUpdate])

  const handleIterationModeChange = useCallback((value: string) => {
    // Note: iteration_mode is not part of standard DifyNode data structure
    // onUpdate({ iteration_mode: value })
    console.log('Iteration mode change not implemented:', value)
  }, [onUpdate])

  const handleInputArrayChange = useCallback((value: string) => {
    // Note: input_array is not part of standard DifyNode data structure
    // onUpdate({ input_array: value })
    console.log('Input array change not implemented:', value)
  }, [onUpdate])

  const handleItemVariableChange = useCallback((value: string) => {
    // Note: item_variable is not part of standard DifyNode data structure
    // onUpdate({ item_variable: value })
    console.log('Item variable change not implemented:', value)
  }, [onUpdate])

  const handleOutputCollectionChange = useCallback((value: string) => {
    // Note: output_collection is not part of standard DifyNode data structure
    // onUpdate({ output_collection: value })
    console.log('Output collection change not implemented:', value)
  }, [onUpdate])

  const handleBatchSizeChange = useCallback((value: string) => {
    const numValue = parseInt(value) || 1
    // Note: batch_size is not part of standard DifyNode data structure
    // onUpdate({ batch_size: numValue })
    console.log('Batch size change not implemented:', numValue)
  }, [onUpdate])

  const handleErrorHandlingChange = useCallback((value: string) => {
    // Note: error_handling is not part of standard DifyNode data structure
    // onUpdate({ error_handling: value })
    console.log('Error handling change not implemented:', value)
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
            <RotateCcw className="h-4 w-4" />
            Iteration Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Node Title */}
          <div className="space-y-2">
            <Label htmlFor="iteration-title">Node Title</Label>
            <Input
              id="iteration-title"
              value={data.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter iteration node title"
            />
          </div>

          {/* Iteration Mode */}
          <div className="space-y-2">
            <Label htmlFor="iteration-mode" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Iteration Mode
            </Label>
            <Select
              value={(data as any).iteration_mode || 'sequential'}
              onValueChange={handleIterationModeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select iteration mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential</SelectItem>
                <SelectItem value="parallel">Parallel</SelectItem>
                <SelectItem value="batch">Batch Processing</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Sequential: Process items one by one. Parallel: Process multiple items simultaneously.
            </div>
          </div>

          {/* Input Array */}
          <div className="space-y-2">
            <Label htmlFor="input-array" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Input Array
            </Label>
            <Input
              id="input-array"
              value={(data as any).input_array || ''}
              onChange={(e) => handleInputArrayChange(e.target.value)}
              placeholder="{{start-1.data_array}}"
              className="font-mono"
            />
            <div className="text-xs text-muted-foreground">
              Reference to the array that will be iterated. Use variable syntax like <code>{"{{#node.array#}}"}</code>.
            </div>
          </div>

          {/* Item Variable Name */}
          <div className="space-y-2">
            <Label htmlFor="item-variable">Item Variable Name</Label>
            <Input
              id="item-variable"
              value={(data as any).item_variable || ''}
              onChange={(e) => handleItemVariableChange(e.target.value)}
              placeholder="current_item"
            />
            <div className="text-xs text-muted-foreground">
              Name of the variable that will hold each item during iteration.
            </div>
          </div>

          {/* Output Collection */}
          <div className="space-y-2">
            <Label htmlFor="output-collection">Output Collection Name</Label>
            <Input
              id="output-collection"
              value={(data as any).output_collection || ''}
              onChange={(e) => handleOutputCollectionChange(e.target.value)}
              placeholder="processed_items"
            />
            <div className="text-xs text-muted-foreground">
              Name of the collection that will store all processed results.
            </div>
          </div>

          {/* Batch Size (for batch mode) */}
          {(data as any).iteration_mode === 'batch' && (
            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch Size</Label>
              <Input
                id="batch-size"
                type="number"
                value={(data as any).batch_size || '1'}
                onChange={(e) => handleBatchSizeChange(e.target.value)}
                min="1"
                max="1000"
              />
              <div className="text-xs text-muted-foreground">
                Number of items to process in each batch (1-1000).
              </div>
            </div>
          )}

          {/* Error Handling */}
          <div className="space-y-2">
            <Label htmlFor="error-handling" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Error Handling
            </Label>
            <Select
              value={(data as any).error_handling || 'stop_on_error'}
              onValueChange={handleErrorHandlingChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select error handling strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stop_on_error">Stop on Error</SelectItem>
                <SelectItem value="continue_on_error">Continue on Error</SelectItem>
                <SelectItem value="skip_on_error">Skip on Error</SelectItem>
                <SelectItem value="retry_on_error">Retry on Error</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Choose how to handle errors during iteration processing.
            </div>
          </div>

          {/* Iteration Flow Guide */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">Iteration Flow:</div>
            <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
              <div>1. <strong>Input:</strong> Array flows into iteration node</div>
              <div>2. <strong>Item Output (🟠):</strong> Each item flows to processing nodes</div>
              <div>3. <strong>Result Input (🟣):</strong> Processed results flow back</div>
              <div>4. <strong>Final Output (🔵):</strong> Complete collection flows out</div>
            </div>
          </div>

          {/* Variable Examples */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-xs font-medium mb-2">Variable Reference Examples:</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• <code>{"{{#start-1.data_array#}}"}</code> - Input array from start node</div>
              <div>• <code>{"{{#iteration-1.current_item#}}"}</code> - Current item being processed</div>
              <div>• <code>{"{{#iteration-1.processed_items#}}"}</code> - Collection of results</div>
              <div>• <code>{"{{#iteration-1.processed_count#}}"}</code> - Number of processed items</div>
            </div>
          </div>

          {/* Raw Data Editor */}
          <div className="space-y-2">
            <Label htmlFor="iteration-raw-data">Advanced Configuration (JSON)</Label>
            <Textarea
              id="iteration-raw-data"
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
            <div><strong>Handles:</strong> Input, Item Output (🟠), Result Input (🟣), Final Output (🔵)</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}