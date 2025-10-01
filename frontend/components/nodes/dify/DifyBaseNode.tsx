/**
 * Dify-style Base Node Component
 * Enhanced version of BaseNode with Dify-specific styling
 */

import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { DIFY_NODE_COLORS } from '@/types'

export interface DifyNodeData extends Record<string, unknown> {
  title: string
  type: string
  desc?: string
  selected?: boolean
  [key: string]: any
}

export interface DifyNodeProps extends NodeProps {
  data: DifyNodeData
  icon?: string
  handles?: {
    left?: boolean
    right?: boolean
    custom?: Array<{
      type: 'source' | 'target'
      position: Position
      id: string
      label?: string
    }>
  }
  children?: React.ReactNode
}

export function DifyBaseNode({
  data,
  icon = '📦',
  handles = { left: true, right: true },
  children,
  selected,
}: DifyNodeProps) {
  const nodeType = data.type || 'generic'
  const color = DIFY_NODE_COLORS[nodeType] || '#6B7280'

  return (
    <div
      className={cn(
        'rounded-xl shadow-lg border-2 transition-all duration-200',
        'hover:shadow-xl bg-white w-full h-full relative',
        selected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      style={{
        borderColor: color,
      }}
    >
      {/* Left color bar (Dify signature) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl z-0"
        style={{ backgroundColor: color }}
      />

      {/* Handles */}
      {handles.left && (
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          className="!w-2.5 !h-2.5 !border-2 !border-white !rounded-full"
          style={{ backgroundColor: color, left: -5 }}
        />
      )}

      {handles.right && (
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          className="!w-2.5 !h-2.5 !border-2 !border-white !rounded-full"
          style={{ backgroundColor: color, right: -5 }}
        />
      )}

      {/* Custom handles (for if-else true/false branches) */}
      {handles.custom?.map((handle) => (
        <Handle
          key={handle.id}
          type={handle.type}
          position={handle.position}
          id={handle.id}
          className="!w-2.5 !h-2.5 !border-2 !border-white !rounded-full"
          style={{ backgroundColor: color }}
        >
          {handle.label && (
            <div className="absolute text-[10px] font-medium text-gray-600 whitespace-nowrap">
              {handle.label}
            </div>
          )}
        </Handle>
      ))}

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13px] text-gray-900 truncate leading-tight">
            {data.title}
          </div>
          {data.desc && (
            <div className="text-[11px] text-gray-500 truncate mt-1 leading-tight">
              {data.desc}
            </div>
          )}
        </div>

        {/* Type indicator */}
        <div
          className="px-2 py-1 rounded text-[10px] font-semibold text-white uppercase tracking-wide"
          style={{ backgroundColor: color }}
        >
          {nodeType}
        </div>
      </div>

      {/* Body (custom content) */}
      {children && (
        <div className="px-4 py-2.5 text-[12px] text-gray-700 bg-gray-50/50">
          {children}
        </div>
      )}
    </div>
  )
}
