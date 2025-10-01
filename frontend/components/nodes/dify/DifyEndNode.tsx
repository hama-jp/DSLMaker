/**
 * Dify End Node
 * Exit point with output mappings
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyEndNodeData } from '@/types'

export function DifyEndNode(props: NodeProps) {
  const data = props.data as unknown as DifyEndNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="⏹️"
      handles={{ left: true, right: false }}
    >
      {data.outputs && data.outputs.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">
            Outputs ({data.outputs.length}):
          </div>
          {data.outputs.slice(0, 3).map((o, i) => (
            <div key={i} className="text-xs text-gray-500 truncate">
              • {o.variable}
            </div>
          ))}
          {data.outputs.length > 3 && (
            <div className="text-xs text-gray-400">
              +{data.outputs.length - 3} more...
            </div>
          )}
        </div>
      )}
    </DifyBaseNode>
  )
}
