/**
 * Dify Start Node
 * Entry point with input variables
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyStartNodeData } from '@/types'

export function DifyStartNode(props: NodeProps) {
  const data = props.data as unknown as DifyStartNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="▶️"
      handles={{ right: true, left: false }}
    >
      {data.variables && data.variables.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">
            Input Variables ({data.variables.length}):
          </div>
          {data.variables.slice(0, 3).map((v, i) => (
            <div key={i} className="text-xs text-gray-500 truncate">
              • {v.label || v.variable}
            </div>
          ))}
          {data.variables.length > 3 && (
            <div className="text-xs text-gray-400">
              +{data.variables.length - 3} more...
            </div>
          )}
        </div>
      )}
    </DifyBaseNode>
  )
}
