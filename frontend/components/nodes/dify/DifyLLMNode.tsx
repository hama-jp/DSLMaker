/**
 * Dify LLM Node
 * Large Language Model inference
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyLLMNodeData } from '@/types'

export function DifyLLMNode(props: NodeProps) {
  const data = props.data as unknown as DifyLLMNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="🤖"
    >
      {data.model && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">Model:</div>
          <div className="text-xs text-gray-700 font-mono">
            {data.model.provider}/{data.model.name}
          </div>
          {data.model.completion_params?.temperature !== undefined && (
            <div className="text-xs text-gray-500">
              Temperature: {data.model.completion_params.temperature}
            </div>
          )}
          {data.prompt_template && data.prompt_template.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {data.prompt_template.length} prompt(s)
            </div>
          )}
        </div>
      )}
    </DifyBaseNode>
  )
}
