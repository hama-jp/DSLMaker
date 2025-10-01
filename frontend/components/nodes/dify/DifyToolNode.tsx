/**
 * Dify Tool Node
 * External tool integration
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyToolNodeData } from '@/types'

export function DifyToolNode(props: NodeProps) {
  const data = props.data as unknown as DifyToolNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="🛠️"
    >
      <div className="space-y-1">
        {data.tool_label && (
          <div className="text-xs font-medium text-gray-700">
            {data.tool_label}
          </div>
        )}
        {data.provider_name && (
          <div className="text-xs text-gray-500">
            Provider: {data.provider_name}
          </div>
        )}
        {data.tool_parameters && Object.keys(data.tool_parameters).length > 0 && (
          <div className="text-xs text-gray-500">
            {Object.keys(data.tool_parameters).length} parameter(s)
          </div>
        )}
      </div>
    </DifyBaseNode>
  )
}
