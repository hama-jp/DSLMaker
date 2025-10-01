/**
 * Dify Answer Node
 * Streaming answer output for chat/agent modes
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyAnswerNodeData } from '@/types'

export function DifyAnswerNode(props: NodeProps) {
  const data = props.data as unknown as DifyAnswerNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="💬"
    >
      {data.answer && (
        <div className="space-y-1">
          <div className="text-xs text-gray-600">
            Answer: {typeof data.answer === 'string' ? data.answer.substring(0, 50) : '[Variable reference]'}
          </div>
        </div>
      )}
    </DifyBaseNode>
  )
}
