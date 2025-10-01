/**
 * Iteration Start Node
 * Entry point marker for iteration flow
 */

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Play } from 'lucide-react'

interface IterationStartNodeData {
  title?: string
  desc?: string
  type: 'iteration-start'
  isInIteration?: boolean

  // Node styling
  label?: string
  color?: string
  selected?: boolean
}

/**
 * IterationStartNode - Entry point marker for iteration flow
 * This small node marks where the iteration loop begins
 */
function IterationStartNodeComponent({ data, selected }: NodeProps<IterationStartNodeData>) {
  return (
    <Card
      className={`
        w-12 h-12 flex items-center justify-center
        bg-purple-100 dark:bg-purple-900/40
        border-2
        ${selected
          ? 'border-purple-500 shadow-md'
          : 'border-purple-300 dark:border-purple-700'
        }
        rounded-full
        transition-all duration-200
      `}
    >
      <Play className="w-5 h-5 text-purple-600 dark:text-purple-400 fill-current" />

      {/* Source handle only - this is where iteration starts */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-purple-500 !border-2 !border-white dark:!border-gray-900"
      />
    </Card>
  )
}

export default memo(IterationStartNodeComponent)
