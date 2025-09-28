"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Code } from "lucide-react"
import type { DifyNode } from "@/types/dify-workflow"

interface TemplateTransformNodePropertiesProps {
  node: DifyNode
  onUpdate: (updates: Partial<DifyNode['data']>) => void
}

export function TemplateTransformNodeProperties({ node, onUpdate }: TemplateTransformNodePropertiesProps) {
  const { data } = node

  const handleTitleChange = useCallback((value: string) => {
    onUpdate({ title: value })
  }, [onUpdate])

  const handleTemplateChange = useCallback((value: string) => {
    onUpdate({ template: value })
  }, [onUpdate])

  const handleOutputFormatChange = useCallback((value: string) => {
    onUpdate({ output_format: value })
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
            <FileText className="h-4 w-4" />
            Template Transform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Node Title */}
          <div className="space-y-2">
            <Label htmlFor="template-title">Node Title</Label>
            <Input
              id="template-title"
              value={data.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter template transform node title"
            />
          </div>

          {/* Template Content */}
          <div className="space-y-2">
            <Label htmlFor="template-content">Template Content</Label>
            <Textarea
              id="template-content"
              value={(data as any).template || ''}
              onChange={(e) => handleTemplateChange(e.target.value)}
              placeholder="Enter your template with variable references..."
              className="resize-none font-mono min-h-[120px]"
            />
            <div className="text-xs text-muted-foreground">
              Use variable references like <code>{"{{#node.variable#}}"}</code> to insert dynamic content.
            </div>
          </div>

          {/* Output Format */}
          <div className="space-y-2">
            <Label htmlFor="output-format">Output Format</Label>
            <Select
              value={(data as any).output_format || 'text'}
              onValueChange={handleOutputFormatChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select output format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="yaml">YAML</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Examples */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-xs font-medium mb-2 flex items-center gap-1">
              <Code className="h-3 w-3" />
              Template Examples:
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• <code>{"Hello {{#user.name#}}, your score is {{#score.value#}}"}</code></div>
              <div>• <code>{"Item: {{#item.id#}}\\nStatus: {{#item.status#}}"}</code></div>
              <div>• <code>{`{"name": "{{#user.name#}}", "active": {{#user.active#}}}`}</code></div>
            </div>
          </div>

          {/* Variable Reference Guide */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">Variable References:</div>
            <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
              <div>• <code>{"{{#node_id.variable_name#}}"}</code> - Reference variable from specific node</div>
              <div>• <code>{"{{#start-1.input_data#}}"}</code> - Reference input from start node</div>
              <div>• <code>{"{{#llm-1.output#}}"}</code> - Reference output from LLM node</div>
            </div>
          </div>

          {/* Raw Data Editor */}
          <div className="space-y-2">
            <Label htmlFor="template-raw-data">Advanced Configuration (JSON)</Label>
            <Textarea
              id="template-raw-data"
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