import { NodeProps } from '@xyflow/react'
import { Globe } from 'lucide-react'
import { BaseNode, BaseNodeData } from './BaseNode'

export function HttpRequestNode(props: NodeProps) {
  const data = props.data as BaseNodeData

  return (
    <BaseNode
      {...props}
      data={data}
      icon={Globe}
      color={{
        bg: '#06b6d4',
        border: '#0891b2',
        text: '#fff',
      }}
    >
      <div className="space-y-1.5">
        {data.config?.method && (
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              {String(data.config.method).toUpperCase()}
            </span>
          </div>
        )}

        {data.config?.api_url && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">URL:</div>
            <div className="text-xs bg-muted/50 rounded px-2 py-1 font-mono truncate">
              {String(data.config.api_url)}
            </div>
          </div>
        )}

        {data.config?.headers && Object.keys(data.config.headers).length > 0 && (
          <div className="text-xs text-muted-foreground">
            {Object.keys(data.config.headers).length} header(s)
          </div>
        )}
      </div>
    </BaseNode>
  )
}
