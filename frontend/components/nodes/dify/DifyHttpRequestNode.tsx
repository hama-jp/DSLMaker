/**
 * Dify HTTP Request Node
 * External HTTP API calls
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyHttpRequestNodeData } from '@/types'

export function DifyHttpRequestNode(props: NodeProps) {
  const data = props.data as unknown as DifyHttpRequestNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="🌐"
    >
      {data.method && data.url && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
              {data.method}
            </span>
            <span className="text-xs text-gray-700 font-mono truncate">
              {data.url.substring(0, 30)}...
            </span>
          </div>
          {data.headers && data.headers.length > 0 && (
            <div className="text-xs text-gray-500">
              Headers: {data.headers.length}
            </div>
          )}
        </div>
      )}
    </DifyBaseNode>
  )
}
