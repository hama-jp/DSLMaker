/**
 * Dify Document Extractor Node
 * Extract text content from files (PDF, Word, etc.)
 */

import { NodeProps } from '@xyflow/react'
import { DifyBaseNode, DifyNodeData } from './DifyBaseNode'
import { DifyDocumentExtractorNodeData } from '@/types'

export function DifyDocumentExtractorNode(props: NodeProps) {
  const data = props.data as unknown as DifyDocumentExtractorNodeData

  return (
    <DifyBaseNode
      {...props}
      data={data as DifyNodeData}
      icon="📄"
    >
      {data.variable_selector && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">
            Source: {data.variable_selector.join('.')}
          </div>
          <div className="text-xs text-gray-500">
            Extracts text from documents
          </div>
        </div>
      )}
    </DifyBaseNode>
  )
}
