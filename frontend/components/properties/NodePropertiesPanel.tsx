'use client'

import { Node } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Settings2, X, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import {
  DifyStartNodeData,
  DifyEndNodeData,
  DifyLLMNodeData,
  DifyIfElseNodeData,
  DifyCodeNodeData,
  DifyAnswerNodeData,
  DifyTemplateTransformNodeData,
  DifyDocumentExtractorNodeData,
  DifyHttpRequestNodeData,
  DifyToolNodeData,
  DifyVariableAggregatorNodeData,
  DifyAssignerNodeData,
  DifyIterationNodeData,
  DifyQuestionClassifierNodeData,
} from '@/types'

interface NodePropertiesPanelProps {
  selectedNode: Node | null
  onNodeUpdate: (nodeId: string, updates: any) => void
  onClose: () => void
}

export default function NodePropertiesPanel({
  selectedNode,
  onNodeUpdate,
  onClose,
}: NodePropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <Card className="flex-1 flex items-center justify-center border-t">
        <div className="text-center p-6">
          <Settings2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            No node selected
          </h3>
          <p className="text-xs text-muted-foreground">
            Select a node to view and edit its properties
          </p>
        </div>
      </Card>
    )
  }

  const handlePropertyChange = (key: string, value: any) => {
    onNodeUpdate(selectedNode.id, {
      ...selectedNode.data,
      [key]: value,
    })
  }

  const handleNestedPropertyChange = (path: string[], value: any) => {
    const newData = { ...selectedNode.data }
    let current: any = newData
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {}
      }
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
    onNodeUpdate(selectedNode.id, newData)
  }

  const renderStartNode = (data: DifyStartNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold mb-2 block">Input Variables</Label>
        {data.variables && data.variables.length > 0 ? (
          <div className="space-y-3">
            {data.variables.map((variable, idx) => (
              <Card key={idx} className="p-3 space-y-2">
                <div>
                  <Label className="text-xs">Variable Name</Label>
                  <Input
                    value={variable.variable || ''}
                    onChange={(e) => {
                      const newVars = [...(data.variables || [])]
                      newVars[idx] = { ...newVars[idx], variable: e.target.value }
                      handlePropertyChange('variables', newVars)
                    }}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={variable.label || ''}
                    onChange={(e) => {
                      const newVars = [...(data.variables || [])]
                      newVars[idx] = { ...newVars[idx], label: e.target.value }
                      handlePropertyChange('variables', newVars)
                    }}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <select
                    value={variable.type || 'string'}
                    onChange={(e) => {
                      const newVars = [...(data.variables || [])]
                      newVars[idx] = { ...newVars[idx], type: e.target.value as any }
                      handlePropertyChange('variables', newVars)
                    }}
                    className="mt-1 w-full h-8 text-xs border rounded px-2"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="select">Select</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={variable.required || false}
                    onChange={(e) => {
                      const newVars = [...(data.variables || [])]
                      newVars[idx] = { ...newVars[idx], required: e.target.checked }
                      handlePropertyChange('variables', newVars)
                    }}
                    className="w-4 h-4"
                  />
                  <Label className="text-xs">Required</Label>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No input variables defined</p>
        )}
      </div>
    </div>
  )

  const renderEndNode = (data: DifyEndNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold mb-2 block">Output Variables</Label>
        {data.outputs && data.outputs.length > 0 ? (
          <div className="space-y-3">
            {data.outputs.map((output, idx) => (
              <Card key={idx} className="p-3 space-y-2">
                <div>
                  <Label className="text-xs">Variable Name</Label>
                  <Input
                    value={output.variable || ''}
                    onChange={(e) => {
                      const newOutputs = [...(data.outputs || [])]
                      newOutputs[idx] = { ...newOutputs[idx], variable: e.target.value }
                      handlePropertyChange('outputs', newOutputs)
                    }}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Value Selector (JSON)</Label>
                  <Input
                    value={JSON.stringify(output.value_selector || [])}
                    onChange={(e) => {
                      try {
                        const newOutputs = [...(data.outputs || [])]
                        newOutputs[idx] = { ...newOutputs[idx], value_selector: JSON.parse(e.target.value) }
                        handlePropertyChange('outputs', newOutputs)
                      } catch {}
                    }}
                    className="mt-1 h-8 text-xs font-mono"
                    placeholder='["node_id", "field"]'
                  />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No output variables defined</p>
        )}
      </div>
    </div>
  )

  const renderLLMNode = (data: DifyLLMNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold">Model Configuration</Label>
        <Card className="mt-2 p-3 space-y-2">
          <div>
            <Label className="text-xs">Provider</Label>
            <Input
              value={data.model?.provider || ''}
              onChange={(e) => handleNestedPropertyChange(['model', 'provider'], e.target.value)}
              className="mt-1 h-8 text-xs"
              placeholder="openai"
            />
          </div>
          <div>
            <Label className="text-xs">Model Name</Label>
            <Input
              value={data.model?.name || ''}
              onChange={(e) => handleNestedPropertyChange(['model', 'name'], e.target.value)}
              className="mt-1 h-8 text-xs"
              placeholder="gpt-4"
            />
          </div>
          <div>
            <Label className="text-xs">Temperature</Label>
            <Input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={data.model?.completion_params?.temperature || 0.7}
              onChange={(e) => handleNestedPropertyChange(['model', 'completion_params', 'temperature'], parseFloat(e.target.value))}
              className="mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Max Tokens</Label>
            <Input
              type="number"
              value={data.model?.completion_params?.max_tokens || 512}
              onChange={(e) => handleNestedPropertyChange(['model', 'completion_params', 'max_tokens'], parseInt(e.target.value))}
              className="mt-1 h-8 text-xs"
            />
          </div>
        </Card>
      </div>

      <div>
        <Label className="text-xs font-semibold mb-2 block">Prompt Templates</Label>
        {data.prompt_template && data.prompt_template.length > 0 ? (
          <div className="space-y-3">
            {data.prompt_template.map((template, idx) => (
              <Card key={idx} className="p-3 space-y-2">
                <div>
                  <Label className="text-xs">Role</Label>
                  <select
                    value={template.role}
                    onChange={(e) => {
                      const newTemplates = [...(data.prompt_template || [])]
                      newTemplates[idx] = { ...newTemplates[idx], role: e.target.value as any }
                      handlePropertyChange('prompt_template', newTemplates)
                    }}
                    className="mt-1 w-full h-8 text-xs border rounded px-2"
                  >
                    <option value="system">System</option>
                    <option value="user">User</option>
                    <option value="assistant">Assistant</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Text</Label>
                  <Textarea
                    value={template.text || ''}
                    onChange={(e) => {
                      const newTemplates = [...(data.prompt_template || [])]
                      newTemplates[idx] = { ...newTemplates[idx], text: e.target.value }
                      handlePropertyChange('prompt_template', newTemplates)
                    }}
                    className="mt-1 text-xs min-h-[80px] font-mono"
                    placeholder="Enter prompt text..."
                  />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No prompt templates defined</p>
        )}
      </div>

      {data.context?.enabled && (
        <div>
          <Label className="text-xs font-semibold">Context Settings</Label>
          <Card className="mt-2 p-3">
            <p className="text-xs text-muted-foreground">
              Context from variable: {JSON.stringify(data.context.variable_selector)}
            </p>
          </Card>
        </div>
      )}
    </div>
  )

  const renderIfElseNode = (data: DifyIfElseNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold mb-2 block">Logical Operator</Label>
        <select
          value={data.logical_operator || 'and'}
          onChange={(e) => handlePropertyChange('logical_operator', e.target.value)}
          className="w-full h-8 text-xs border rounded px-2"
        >
          <option value="and">AND (All conditions must be true)</option>
          <option value="or">OR (At least one condition must be true)</option>
        </select>
      </div>

      <div>
        <Label className="text-xs font-semibold mb-2 block">Conditions</Label>
        {data.conditions && data.conditions.length > 0 ? (
          <div className="space-y-3">
            {data.conditions.map((condition, idx) => (
              <Card key={idx} className="p-3 space-y-2">
                <div>
                  <Label className="text-xs">Variable Selector (JSON)</Label>
                  <Input
                    value={JSON.stringify(condition.variable_selector || [])}
                    onChange={(e) => {
                      try {
                        const newConditions = [...(data.conditions || [])]
                        newConditions[idx] = { ...newConditions[idx], variable_selector: JSON.parse(e.target.value) }
                        handlePropertyChange('conditions', newConditions)
                      } catch {}
                    }}
                    className="mt-1 h-8 text-xs font-mono"
                    placeholder='["node_id", "field"]'
                  />
                </div>
                <div>
                  <Label className="text-xs">Comparison Operator</Label>
                  <select
                    value={condition.comparison_operator || 'equal'}
                    onChange={(e) => {
                      const newConditions = [...(data.conditions || [])]
                      newConditions[idx] = { ...newConditions[idx], comparison_operator: e.target.value as any }
                      handlePropertyChange('conditions', newConditions)
                    }}
                    className="mt-1 w-full h-8 text-xs border rounded px-2"
                  >
                    <option value="equal">Equal (=)</option>
                    <option value="not equal">Not Equal (≠)</option>
                    <option value="contains">Contains</option>
                    <option value="not contains">Not Contains</option>
                    <option value="start with">Starts With</option>
                    <option value="end with">Ends With</option>
                    <option value="is">Is</option>
                    <option value="is not">Is Not</option>
                    <option value="empty">Empty</option>
                    <option value="not empty">Not Empty</option>
                    <option value="null">Null</option>
                    <option value="not null">Not Null</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Comparison Value</Label>
                  <Input
                    value={condition.value || ''}
                    onChange={(e) => {
                      const newConditions = [...(data.conditions || [])]
                      newConditions[idx] = { ...newConditions[idx], value: e.target.value }
                      handlePropertyChange('conditions', newConditions)
                    }}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No conditions defined</p>
        )}
      </div>
    </div>
  )

  const renderCodeNode = (data: DifyCodeNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold">Code</Label>
        <Textarea
          value={data.code || ''}
          onChange={(e) => handlePropertyChange('code', e.target.value)}
          className="mt-2 text-xs min-h-[150px] font-mono"
          placeholder="Enter Python code here..."
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Input Variables (JSON)</Label>
        <Textarea
          value={JSON.stringify(data.variables || [], null, 2)}
          onChange={(e) => {
            try {
              handlePropertyChange('variables', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 text-xs min-h-[80px] font-mono"
          placeholder='[{"variable": "input1", "value_selector": ["node_id", "field"]}]'
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Output Variables (JSON)</Label>
        <Textarea
          value={JSON.stringify(data.outputs || {}, null, 2)}
          onChange={(e) => {
            try {
              handlePropertyChange('outputs', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 text-xs min-h-[60px] font-mono"
          placeholder='{"result": "string"}'
        />
      </div>
    </div>
  )

  const renderAnswerNode = (data: DifyAnswerNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold">Answer Template</Label>
        <Textarea
          value={data.answer || ''}
          onChange={(e) => handlePropertyChange('answer', e.target.value)}
          className="mt-2 text-xs min-h-[100px]"
          placeholder="Enter answer template with {{variables}}..."
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use {`{{variable_name}}`} to reference variables
        </p>
      </div>
    </div>
  )

  const renderTemplateTransformNode = (data: DifyTemplateTransformNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold">Template</Label>
        <Textarea
          value={data.template || ''}
          onChange={(e) => handlePropertyChange('template', e.target.value)}
          className="mt-2 text-xs min-h-[100px] font-mono"
          placeholder="Enter Jinja2 template..."
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Variables (JSON)</Label>
        <Textarea
          value={JSON.stringify(data.variables || [], null, 2)}
          onChange={(e) => {
            try {
              handlePropertyChange('variables', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 text-xs min-h-[80px] font-mono"
          placeholder='[{"variable": "var1", "value_selector": ["node_id", "field"]}]'
        />
      </div>
    </div>
  )

  const renderDocumentExtractorNode = (data: DifyDocumentExtractorNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold">Variable Selector (JSON)</Label>
        <Input
          value={JSON.stringify(data.variable_selector || [])}
          onChange={(e) => {
            try {
              handlePropertyChange('variable_selector', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 h-8 text-xs font-mono"
          placeholder='["node_id", "files"]'
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={data.is_array_file || false}
          onChange={(e) => handlePropertyChange('is_array_file', e.target.checked)}
          className="w-4 h-4"
        />
        <Label className="text-xs">Is Array File</Label>
      </div>
    </div>
  )

  const renderHttpRequestNode = (data: DifyHttpRequestNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold">HTTP Method</Label>
        <select
          value={data.method || 'GET'}
          onChange={(e) => handlePropertyChange('method', e.target.value)}
          className="mt-2 w-full h-8 text-xs border rounded px-2"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      <div>
        <Label className="text-xs font-semibold">URL</Label>
        <Input
          value={data.url || ''}
          onChange={(e) => handlePropertyChange('url', e.target.value)}
          className="mt-2 h-8 text-xs"
          placeholder="https://api.example.com/endpoint"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Headers (JSON)</Label>
        <Textarea
          value={JSON.stringify(data.headers || [], null, 2)}
          onChange={(e) => {
            try {
              handlePropertyChange('headers', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 text-xs min-h-[60px] font-mono"
          placeholder='[{"key": "Authorization", "value": "Bearer token"}]'
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Params (JSON)</Label>
        <Textarea
          value={JSON.stringify(data.params || {}, null, 2)}
          onChange={(e) => {
            try {
              handlePropertyChange('params', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 text-xs min-h-[60px] font-mono"
          placeholder='{"param1": "value1"}'
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Body (JSON)</Label>
        <Textarea
          value={JSON.stringify(data.body || {}, null, 2)}
          onChange={(e) => {
            try {
              handlePropertyChange('body', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 text-xs min-h-[80px] font-mono"
          placeholder='{"key": "value"}'
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Timeout (seconds)</Label>
        <Input
          type="number"
          value={data.timeout || 30}
          onChange={(e) => handlePropertyChange('timeout', parseInt(e.target.value))}
          className="mt-2 h-8 text-xs"
        />
      </div>
    </div>
  )

  const renderToolNode = (data: DifyToolNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold">Provider</Label>
        <Input
          value={data.provider_id || ''}
          onChange={(e) => handlePropertyChange('provider_id', e.target.value)}
          className="mt-2 h-8 text-xs"
          placeholder="google"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Tool Name</Label>
        <Input
          value={data.tool_name || ''}
          onChange={(e) => handlePropertyChange('tool_name', e.target.value)}
          className="mt-2 h-8 text-xs"
          placeholder="search"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Tool Parameters (JSON)</Label>
        <Textarea
          value={JSON.stringify(data.tool_parameters || {}, null, 2)}
          onChange={(e) => {
            try {
              handlePropertyChange('tool_parameters', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 text-xs min-h-[80px] font-mono"
          placeholder='{"query": "search term"}'
        />
      </div>
    </div>
  )

  const renderVariableAggregatorNode = (data: DifyVariableAggregatorNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold">Output Type</Label>
        <select
          value={data.output_type || 'object'}
          onChange={(e) => handlePropertyChange('output_type', e.target.value)}
          className="mt-2 w-full h-8 text-xs border rounded px-2"
        >
          <option value="object">Object</option>
          <option value="array">Array</option>
        </select>
      </div>
      <div>
        <Label className="text-xs font-semibold">Variables (JSON)</Label>
        <Textarea
          value={JSON.stringify(data.variables || [], null, 2)}
          onChange={(e) => {
            try {
              handlePropertyChange('variables', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 text-xs min-h-[80px] font-mono"
          placeholder='[{"variable": "var1", "value_selector": ["node_id", "field"]}]'
        />
      </div>
    </div>
  )

  const renderAssignerNode = (data: DifyAssignerNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold mb-2 block">Assignment Items</Label>
        {data.items && data.items.length > 0 ? (
          <div className="space-y-3">
            {data.items.map((item, idx) => (
              <Card key={idx} className="p-3 space-y-2">
                <div>
                  <Label className="text-xs">Variable Selector (JSON)</Label>
                  <Input
                    value={JSON.stringify(item.variable_selector || [])}
                    onChange={(e) => {
                      try {
                        const newItems = [...(data.items || [])]
                        newItems[idx] = { ...newItems[idx], variable_selector: JSON.parse(e.target.value) }
                        handlePropertyChange('items', newItems)
                      } catch {}
                    }}
                    className="mt-1 h-8 text-xs font-mono"
                    placeholder='["conversation", "var_name"]'
                  />
                </div>
                <div>
                  <Label className="text-xs">Operation</Label>
                  <select
                    value={item.operation || 'set'}
                    onChange={(e) => {
                      const newItems = [...(data.items || [])]
                      newItems[idx] = { ...newItems[idx], operation: e.target.value as any }
                      handlePropertyChange('items', newItems)
                    }}
                    className="mt-1 w-full h-8 text-xs border rounded px-2"
                  >
                    <option value="set">Set</option>
                    <option value="overwrite">Overwrite</option>
                    <option value="clear">Clear</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={item.value || ''}
                    onChange={(e) => {
                      const newItems = [...(data.items || [])]
                      newItems[idx] = { ...newItems[idx], value: e.target.value }
                      handlePropertyChange('items', newItems)
                    }}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No assignment items defined</p>
        )}
      </div>
    </div>
  )

  const renderIterationNode = (data: DifyIterationNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold">Iterator Selector (JSON)</Label>
        <Input
          value={JSON.stringify(data.iterator_selector || [])}
          onChange={(e) => {
            try {
              handlePropertyChange('iterator_selector', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 h-8 text-xs font-mono"
          placeholder='["node_id", "array_field"]'
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Output Selector (JSON)</Label>
        <Input
          value={JSON.stringify(data.output_selector || [])}
          onChange={(e) => {
            try {
              handlePropertyChange('output_selector', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 h-8 text-xs font-mono"
          placeholder='["iteration_node_id", "output"]'
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Output Type</Label>
        <select
          value={data.output_type || 'array'}
          onChange={(e) => handlePropertyChange('output_type', e.target.value)}
          className="mt-2 w-full h-8 text-xs border rounded px-2"
        >
          <option value="array">Array</option>
          <option value="object">Object</option>
          <option value="string">String</option>
        </select>
      </div>
      <div>
        <Label className="text-xs font-semibold">Start Node ID</Label>
        <Input
          value={data.start_node_id || ''}
          onChange={(e) => handlePropertyChange('start_node_id', e.target.value)}
          className="mt-2 h-8 text-xs"
          placeholder="node_id_to_iterate"
        />
      </div>
    </div>
  )

  const renderQuestionClassifierNode = (data: DifyQuestionClassifierNodeData) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold">Query Variable Selector (JSON)</Label>
        <Input
          value={JSON.stringify(data.query_variable_selector || [])}
          onChange={(e) => {
            try {
              handlePropertyChange('query_variable_selector', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 h-8 text-xs font-mono"
          placeholder='["start", "user_input"]'
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Classes (JSON)</Label>
        <Textarea
          value={JSON.stringify(data.classes || [], null, 2)}
          onChange={(e) => {
            try {
              handlePropertyChange('classes', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 text-xs min-h-[100px] font-mono"
          placeholder='[{"id": "cat1", "name": "Category 1"}]'
        />
      </div>
      <div>
        <Label className="text-xs font-semibold">Model (JSON)</Label>
        <Textarea
          value={JSON.stringify(data.model || {}, null, 2)}
          onChange={(e) => {
            try {
              handlePropertyChange('model', JSON.parse(e.target.value))
            } catch {}
          }}
          className="mt-2 text-xs min-h-[80px] font-mono"
          placeholder='{"provider": "openai", "name": "gpt-4"}'
        />
      </div>
    </div>
  )

  const renderPropertiesForNodeType = () => {
    // Get node type from data.type (Dify node type) instead of selectedNode.type (React Flow type)
    const nodeType = (selectedNode.data as any)?.type || selectedNode.type || 'default'
    // Get actual node data from config (where WorkflowVisualizer stores the original Dify data)
    const nodeData = (selectedNode.data as any)?.config || selectedNode.data || {}

    // Common title editor for all nodes
    const titleEditor = (
      <div className="mb-4 pb-4 border-b">
        <Label htmlFor="title" className="text-xs">Node Title</Label>
        <Input
          id="title"
          value={(nodeData.title as string) || ''}
          onChange={(e) => handlePropertyChange('title', e.target.value)}
          className="mt-1 h-8 text-xs"
          placeholder="Enter node title..."
        />
      </div>
    )

    switch (nodeType) {
      case 'start':
        return <>{titleEditor}{renderStartNode(nodeData as DifyStartNodeData)}</>
      case 'end':
        return <>{titleEditor}{renderEndNode(nodeData as DifyEndNodeData)}</>
      case 'llm':
        return <>{titleEditor}{renderLLMNode(nodeData as DifyLLMNodeData)}</>
      case 'if-else':
        return <>{titleEditor}{renderIfElseNode(nodeData as DifyIfElseNodeData)}</>
      case 'code':
        return <>{titleEditor}{renderCodeNode(nodeData as DifyCodeNodeData)}</>
      case 'answer':
        return <>{titleEditor}{renderAnswerNode(nodeData as DifyAnswerNodeData)}</>
      case 'template-transform':
        return <>{titleEditor}{renderTemplateTransformNode(nodeData as DifyTemplateTransformNodeData)}</>
      case 'document-extractor':
        return <>{titleEditor}{renderDocumentExtractorNode(nodeData as DifyDocumentExtractorNodeData)}</>
      case 'http-request':
        return <>{titleEditor}{renderHttpRequestNode(nodeData as DifyHttpRequestNodeData)}</>
      case 'tool':
        return <>{titleEditor}{renderToolNode(nodeData as DifyToolNodeData)}</>
      case 'variable-aggregator':
        return <>{titleEditor}{renderVariableAggregatorNode(nodeData as DifyVariableAggregatorNodeData)}</>
      case 'assigner':
      case 'conversation-variable-assigner':
        return <>{titleEditor}{renderAssignerNode(nodeData as DifyAssignerNodeData)}</>
      case 'iteration':
        return <>{titleEditor}{renderIterationNode(nodeData as DifyIterationNodeData)}</>
      case 'question-classifier':
        return <>{titleEditor}{renderQuestionClassifierNode(nodeData as DifyQuestionClassifierNodeData)}</>
      default:
        return (
          <>
            {titleEditor}
            <div>
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Textarea
                id="description"
                value={(nodeData.description as string) || ''}
                onChange={(e) => handlePropertyChange('description', e.target.value)}
                className="mt-1 text-xs min-h-[60px]"
                placeholder="Node description..."
              />
            </div>
          </>
        )
    }
  }

  return (
    <Card className="h-full flex flex-col border-t">
      {/* Header */}
      <div className="px-3 py-2 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Node Properties</h3>
            <p className="text-xs text-muted-foreground">
              {(selectedNode.data?.title as string) || selectedNode.id}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-accent transition-colors"
          aria-label="Close properties panel"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Properties Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {/* Node Type Badge */}
          <div className="flex items-center gap-2 pb-3 border-b">
            <span className="text-xs font-medium text-muted-foreground">Type:</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              {(selectedNode.data as any)?.type || selectedNode.type || 'default'}
            </span>
            <span className="text-xs font-medium text-muted-foreground ml-2">ID:</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted">
              {selectedNode.id}
            </span>
          </div>

          {/* Type-specific Properties */}
          {renderPropertiesForNodeType()}
        </div>
      </div>
    </Card>
  )
}
