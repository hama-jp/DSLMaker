import { NodeProps, Position } from '@xyflow/react'
import { GitBranch } from 'lucide-react'
import { BaseNode, BaseNodeData } from './BaseNode'

export function IfElseNode(props: NodeProps) {
  const data = props.data as BaseNodeData

  return (
    <BaseNode
      {...props}
      data={data}
      icon={GitBranch}
      color={{
        bg: '#f59e0b',
        border: '#d97706',
        text: '#fff',
      }}
      handles={{
        top: true,
        custom: [
          {
            type: 'source',
            position: Position.Bottom,
            id: 'true',
            style: { left: '30%' },
          },
          {
            type: 'source',
            position: Position.Bottom,
            id: 'false',
            style: { left: '70%' },
          },
        ],
      }}
    >
      <div className="space-y-1.5">
        {data.config?.conditions && Array.isArray(data.config.conditions) && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Conditions ({data.config.conditions.length}):
            </div>
            <div className="space-y-1">
              {data.config.conditions.slice(0, 2).map((condition: any, idx: number) => (
                <div
                  key={idx}
                  className="text-xs bg-muted/50 rounded px-2 py-1 font-mono truncate"
                >
                  {condition.variable_selector?.[0] || 'condition'} {condition.comparison_operator || '=='} ...
                </div>
              ))}
              {data.config.conditions.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{data.config.conditions.length - 2} more
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-green-600">✓ True</span>
          <span className="text-xs font-semibold text-red-600">✗ False</span>
        </div>
      </div>
    </BaseNode>
  )
}
