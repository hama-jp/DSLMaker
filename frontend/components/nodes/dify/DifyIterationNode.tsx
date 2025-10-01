/**
 * Dify Iteration Node
 * Container node for iteration/loop structures
 * Acts as a parent container that visually groups child nodes
 */

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
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
 *
 * IMPORTANT: This is a parent node that should contain child nodes.
 * In React Flow, parent nodes require:
 * - style={{ width, height }} to be explicitly set
 * - Child nodes must have parentId and extent: 'parent'
 */
function DifyIterationNodeComponent({ data, selected }: NodeProps<IterationNodeData>) {
  const title = data.title || 'Iteration'
  const description = data.desc || ''
  const parallelNums = data.parallel_nums || 1
  const outputType = data.output_type || 'array'

  // Parent container should have minimum dimensions to contain child nodes
  // These will be overridden by style prop in WorkflowVisualizer
  const minWidth = 600
  const minHeight = 400

  return (
    <div
      className={`
        relative p-4
        bg-gradient-to-br from-purple-100/50 to-indigo-100/50
        dark:from-purple-900/20 dark:to-indigo-900/20
        border-4 border-dashed rounded-lg
        ${selected
          ? 'border-purple-600 shadow-xl shadow-purple-500/30'
          : 'border-purple-400 dark:border-purple-600'
        }
        transition-all duration-200
      `}
      style={{
        width: '100%',
        height: '100%',
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        boxShadow: selected
          ? '0 0 0 2px rgba(147, 51, 234, 0.2), 0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          : '0 0 0 1px rgba(147, 51, 234, 0.1)'
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-purple-100/80 dark:bg-purple-900/30 rounded-t-lg border-b border-purple-200 dark:border-purple-800 z-10">
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
        <div className="mt-12 mb-3 px-2 z-10 relative">
          <p className="text-xs text-muted-foreground italic">{description}</p>
        </div>
      )}

      {/* Child nodes will be rendered here by React Flow */}
      {/* They need at least 40px top padding for the header */}

      {/* Handles */}
      <Handle
        id="target"
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-gray-900 !z-20"
        style={{ left: -6, top: '50%' }}
      />
      <Handle
        id="source"
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-gray-900 !z-20"
        style={{ right: -6, top: '50%' }}
      />

      {/* Footer info */}
      <div className="absolute bottom-2 right-3 flex items-center gap-1 text-xs text-purple-600/60 dark:text-purple-400/60 z-10">
        <ChevronRight className="w-3 h-3" />
        <span>Loop Flow</span>
      </div>
    </div>
  )
}

export const DifyIterationNode = memo(DifyIterationNodeComponent)
