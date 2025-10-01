import { NodeProps } from '@xyflow/react'
import { Square } from 'lucide-react'
import { BaseNode, BaseNodeData } from './BaseNode'

export function EndNode(props: NodeProps) {
  const data = props.data as BaseNodeData

  return (
    <BaseNode
      {...props}
      data={data}
      icon={Square}
      color={{
        bg: '#ef4444',
        border: '#dc2626',
        text: '#fff',
      }}
      handles={{ top: true }}
    >
      {data.config?.outputs && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Outputs:</div>
          <div className="flex flex-wrap gap-1">
            {Object.keys(data.config.outputs).slice(0, 3).map((output) => (
              <span
                key={output}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-destructive/10 text-destructive font-mono"
              >
                {output}
              </span>
            ))}
            {Object.keys(data.config.outputs).length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{Object.keys(data.config.outputs).length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </BaseNode>
  )
}
