/**
 * Dify Code Node
 * Python code execution
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyCodeNodeData } from '@/types'

export function DifyCodeNode(props: NodeProps) {
  const data = props.data as unknown as DifyCodeNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="💻"
    >
      <div className="space-y-1">
        {data.code_language && (
          <div className="text-xs font-medium text-gray-600">
            Language: {data.code_language}
          </div>
        )}
        {data.variables && data.variables.length > 0 && (
          <div className="text-xs text-gray-500">
            {data.variables.length} input variable(s)
          </div>
        )}
        {data.outputs && Object.keys(data.outputs).length > 0 && (
          <div className="text-xs text-gray-500">
            {Object.keys(data.outputs).length} output(s)
          </div>
        )}
        {data.code && (
          <div className="mt-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600 truncate">
            {data.code.split('\n')[0]}...
          </div>
        )}
      </div>
    </DifyBaseNode>
  )
}
