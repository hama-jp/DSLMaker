/**
 * Dify Variable Assigner Node (Conversation Variables)
 * Assign values to conversation variables
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyAssignerNodeData } from '@/types'

export function DifyVariableAssignerNode(props: NodeProps) {
  const data = props.data as unknown as DifyAssignerNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="📌"
    >
      {data.items && data.items.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">
            Assignments: {data.items.length}
          </div>
          <div className="space-y-0.5">
            {data.items.slice(0, 2).map((item, idx) => (
              <div key={idx} className="text-xs text-gray-700">
                → {item.variable_selector?.[1] || 'variable'}
              </div>
            ))}
            {data.items.length > 2 && (
              <div className="text-xs text-gray-500">
                +{data.items.length - 2} more
              </div>
            )}
          </div>
        </div>
      )}
    </DifyBaseNode>
  )
}
