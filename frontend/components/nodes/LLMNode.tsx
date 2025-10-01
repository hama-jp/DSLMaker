import { NodeProps } from '@xyflow/react'
import { Brain } from 'lucide-react'
import { BaseNode, BaseNodeData } from './BaseNode'

export function LLMNode(props: NodeProps) {
  const data = props.data as BaseNodeData

  return (
    <BaseNode
      {...props}
      data={data}
      icon={Brain}
      color={{
        bg: '#3b82f6',
        border: '#2563eb',
        text: '#fff',
      }}
    >
      <div className="space-y-1.5">
        {data.config?.model && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Model:</span>
            <span className="text-xs font-mono font-semibold">
              {data.config.model}
            </span>
          </div>
        )}

        {data.config?.prompt && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Prompt:</div>
            <div className="text-xs bg-muted/50 rounded px-2 py-1 max-h-12 overflow-hidden line-clamp-2">
              {String(data.config.prompt).slice(0, 100)}
              {String(data.config.prompt).length > 100 && '...'}
            </div>
          </div>
        )}

        {data.config?.temperature !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Temp:</span>
            <span className="text-xs font-mono">{data.config.temperature}</span>
          </div>
        )}
      </div>
    </BaseNode>
  )
}
