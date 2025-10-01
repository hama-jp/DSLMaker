/**
 * Dify Iteration Node
 * Loop over array items
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyIterationNodeData } from '@/types'

export function DifyIterationNode(props: NodeProps) {
  const data = props.data as unknown as DifyIterationNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="🔄"
    >
      <div className="space-y-1">
        <div className="text-xs font-medium text-gray-600">Loop Configuration:</div>
        {data.output_type && (
          <div className="text-xs text-gray-500">
            Output: {data.output_type}
          </div>
        )}
        {data.startNodeType && (
          <div className="text-xs text-gray-500">
            Inner: {data.startNodeType}
          </div>
        )}
      </div>
    </DifyBaseNode>
  )
}
