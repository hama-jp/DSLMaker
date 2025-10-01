/**
 * Dify Iteration Node
 * Container node for iteration/loop structures
 * Acts as a parent container that visually groups child nodes
 */

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, ChevronRight } from 'lucide-react'

interface IterationNodeData {
  title?: string
  desc?: string
  type: 'iteration'
  isInIteration?: boolean
  iteration_id?: string
  start_node_id?: string
  output_selector?: string[]
  output_type?: string
  parallel_nums?: number

  // Node styling
  label?: string
  color?: string
  selected?: boolean
}

/**
 * DifyIterationNode - Container node for iteration/loop structures
 * This node acts as a parent container that visually groups child nodes
 * representing the iteration's internal workflow.
 */
function DifyIterationNodeComponent({ data, selected }: NodeProps<IterationNodeData>) {
  const title = data.title || 'Iteration'
  const description = data.desc || ''
  const parallelNums = data.parallel_nums || 1
  const outputType = data.output_type || 'array'

  return (
    <div
      className={`
        relative min-w-[800px] min-h-[400px] p-4
        bg-gradient-to-br from-purple-50/30 to-indigo-50/30
        dark:from-purple-950/10 dark:to-indigo-950/10
        border-2 border-dashed rounded-lg
        ${selected
          ? 'border-purple-500 shadow-lg shadow-purple-500/20'
          : 'border-purple-300 dark:border-purple-700'
        }
        transition-all duration-200
      `}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-purple-100/80 dark:bg-purple-900/30 rounded-t-lg border-b border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-sm text-purple-900 dark:text-purple-100">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {parallelNums > 1 && (
            <Badge variant="secondary" className="text-xs bg-purple-200 dark:bg-purple-800">
              {parallelNums}x Parallel
            </Badge>
          )}
          <Badge variant="outline" className="text-xs border-purple-300 dark:border-purple-700">
            {outputType}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="mt-12 mb-3 px-2">
          <p className="text-xs text-muted-foreground italic">{description}</p>
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-gray-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-gray-900"
      />

      {/* Footer info */}
      <div className="absolute bottom-2 right-3 flex items-center gap-1 text-xs text-purple-600/60 dark:text-purple-400/60">
        <ChevronRight className="w-3 h-3" />
        <span>Loop Flow</span>
      </div>
    </div>
  )
}

export const DifyIterationNode = memo(DifyIterationNodeComponent)
