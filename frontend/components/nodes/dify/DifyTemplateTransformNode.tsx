/**
 * Dify Template Transform Node
 * Jinja2 template transformation
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyTemplateTransformNodeData } from '@/types'

export function DifyTemplateTransformNode(props: NodeProps) {
  const data = props.data as unknown as DifyTemplateTransformNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="📝"
    >
      {data.template && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">Template:</div>
          <div className="text-xs text-gray-700 font-mono truncate">
            {data.template.substring(0, 50)}...
          </div>
          {data.variables && data.variables.length > 0 && (
            <div className="text-xs text-gray-500">
              {data.variables.length} variable(s)
            </div>
          )}
        </div>
      )}
    </DifyBaseNode>
  )
}
