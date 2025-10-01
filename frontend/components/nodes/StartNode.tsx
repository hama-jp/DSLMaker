import { NodeProps } from '@xyflow/react'
import { Play } from 'lucide-react'
import { BaseNode, BaseNodeData } from './BaseNode'

export function StartNode(props: NodeProps) {
  const data = props.data as BaseNodeData

  return (
    <BaseNode
      {...props}
      data={data}
      icon={Play}
      color={{
        bg: '#10b981',
        border: '#059669',
        text: '#fff',
      }}
      handles={{ bottom: true }}
    >
      {data.config?.variables && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Input Variables:</div>
          <div className="flex flex-wrap gap-1">
            {Object.keys(data.config.variables).slice(0, 3).map((varName) => (
              <span
                key={varName}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-mono"
              >
                {varName}
              </span>
            ))}
            {Object.keys(data.config.variables).length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{Object.keys(data.config.variables).length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </BaseNode>
  )
}
