/**
 * Dify If/Else Node
 * Conditional branching with true/false outputs
 */

import { NodeProps, Position } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyIfElseNodeData } from '@/types'

export function DifyIfElseNode(props: NodeProps) {
  const data = props.data as unknown as DifyIfElseNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="🔀"
      handles={{
        left: true,
        right: false,
        custom: [
          {
            type: 'source',
            position: Position.Right,
            id: 'true',
            label: 'true',
          },
          {
            type: 'source',
            position: Position.Right,
            id: 'false',
            label: 'false',
          },
        ],
      }}
    >
      {data.conditions && data.conditions.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">
            Conditions ({data.conditions.length}):
          </div>
          {data.logical_operator && (
            <div className="text-xs text-gray-500 uppercase font-medium">
              {data.logical_operator}
            </div>
          )}
          {data.conditions.slice(0, 2).map((c, i) => (
            <div key={i} className="text-xs text-gray-500 truncate">
              • {c.comparison_operator} {c.value}
            </div>
          ))}
          {data.conditions.length > 2 && (
            <div className="text-xs text-gray-400">
              +{data.conditions.length - 2} more...
            </div>
          )}
        </div>
      )}
    </DifyBaseNode>
  )
}
