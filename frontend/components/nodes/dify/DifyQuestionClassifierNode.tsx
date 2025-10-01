/**
 * Dify Question Classifier Node
 * Classify user input into categories
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyQuestionClassifierNodeData } from '@/types'

export function DifyQuestionClassifierNode(props: NodeProps) {
  const data = props.data as unknown as DifyQuestionClassifierNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="🏷️"
    >
      {data.classes && data.classes.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">
            Classes: {data.classes.length}
          </div>
          <div className="flex flex-wrap gap-1">
            {data.classes.slice(0, 3).map((cls, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 bg-pink-100 text-pink-700 text-xs rounded"
              >
                {cls.name}
              </span>
            ))}
            {data.classes.length > 3 && (
              <span className="text-xs text-gray-500">
                +{data.classes.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </DifyBaseNode>
  )
}
