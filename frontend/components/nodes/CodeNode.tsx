import { NodeProps } from '@xyflow/react'
import { Code } from 'lucide-react'
import { BaseNode, BaseNodeData } from './BaseNode'

export function CodeNode(props: NodeProps) {
  const data = props.data as BaseNodeData

  return (
    <BaseNode
      {...props}
      data={data}
      icon={Code}
      color={{
        bg: '#8b5cf6',
        border: '#7c3aed',
        text: '#fff',
      }}
    >
      <div className="space-y-1.5">
        {data.config?.code_language && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Language:</span>
            <span className="text-xs font-mono font-semibold uppercase">
              {data.config.code_language}
            </span>
          </div>
        )}

        {data.config?.code && (
          <div className="text-xs bg-muted/50 rounded px-2 py-1.5 font-mono max-h-16 overflow-hidden">
            <pre className="line-clamp-3 text-[10px]">
              {String(data.config.code).slice(0, 120)}
              {String(data.config.code).length > 120 && '\n...'}
            </pre>
          </div>
        )}

        {data.config?.variables && (
          <div className="text-xs text-muted-foreground">
            {Object.keys(data.config.variables).length} variable(s)
          </div>
        )}
      </div>
    </BaseNode>
  )
}
