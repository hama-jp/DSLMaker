import { NodeProps } from '@xyflow/react'
import { Repeat } from 'lucide-react'
import { BaseNode, BaseNodeData } from './BaseNode'

export function IterationNode(props: NodeProps) {
  const data = props.data as BaseNodeData

  return (
    <BaseNode
      {...props}
      data={data}
      icon={Repeat}
      color={{
        bg: '#a855f7',
        border: '#9333ea',
        text: '#fff',
      }}
    >
      <div className="space-y-1.5">
        {data.config?.input_selector && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Iterate Over:</div>
            <div className="text-xs bg-muted/50 rounded px-2 py-1 font-mono truncate">
              {Array.isArray(data.config.input_selector)
                ? data.config.input_selector.join('.')
                : String(data.config.input_selector)}
            </div>
          </div>
        )}

        {data.config?.max_iterations && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Max Iterations:</span>
            <span className="text-xs font-mono font-semibold">
              {data.config.max_iterations}
            </span>
          </div>
        )}

        {data.config?.output_selector && (
          <div className="text-xs text-muted-foreground">
            Outputs: {Array.isArray(data.config.output_selector) ? data.config.output_selector.join(', ') : 'array'}
          </div>
        )}
      </div>
    </BaseNode>
  )
}
