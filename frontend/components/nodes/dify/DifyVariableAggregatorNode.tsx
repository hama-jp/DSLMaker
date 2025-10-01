/**
 * Dify Variable Aggregator Node
 * Aggregate multiple variables into array/object
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyVariableAggregatorNodeData } from '@/types'

export function DifyVariableAggregatorNode(props: NodeProps) {
  const data = props.data as unknown as DifyVariableAggregatorNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="📊"
    >
      {data.variables && data.variables.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">
            Aggregating: {data.variables.length} variable(s)
          </div>
          <div className="text-xs text-gray-500">
            Output: {data.output_type}
          </div>
        </div>
      )}
    </DifyBaseNode>
  )
}
