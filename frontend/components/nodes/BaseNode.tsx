/**
 * Base Node Component
 * Provides common structure and styling for all custom nodes
 */

import { Handle, Position, NodeProps } from '@xyflow/react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BaseNodeData {
  title: string
  type: string
  description?: string
  config?: Record<string, any>
  width?: number
  height?: number
}

export interface BaseNodeProps extends NodeProps {
  data: BaseNodeData
  icon: LucideIcon
  color: {
    bg: string
    border: string
    text: string
    iconBg?: string
  }
  handles?: {
    top?: boolean
    bottom?: boolean
    left?: boolean
    right?: boolean
    custom?: Array<{
      type: 'source' | 'target'
      position: Position
      id: string
      style?: React.CSSProperties
    }>
  }
  children?: React.ReactNode
}

export function BaseNode({
  data,
  icon: Icon,
  color,
  handles = { top: true, bottom: true },
  children,
  selected,
}: BaseNodeProps) {
  const nodeWidth = data.width || 220

  return (
    <div
      className={cn(
        'rounded-lg shadow-sm border-2 transition-all duration-200',
        'hover:shadow-md bg-card',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
      style={{
        borderColor: color.border,
        minWidth: nodeWidth,
      }}
    >
      {/* Handles */}
      {handles.top && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}

      {handles.bottom && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}

      {handles.left && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}

      {handles.right && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}

      {/* Custom handles */}
      {handles.custom?.map((handle) => (
        <Handle
          key={handle.id}
          type={handle.type}
          position={handle.position}
          id={handle.id}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
          style={handle.style}
        />
      ))}

      {/* Header */}
      <div
        className="px-3 py-2 rounded-t-md flex items-center gap-2"
        style={{ background: color.bg, color: color.text }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{
            background: color.iconBg || 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{data.title}</div>
        </div>
      </div>

      {/* Body */}
      {children && (
        <div className="px-3 py-2 bg-card text-card-foreground">
          {children}
        </div>
      )}

      {/* Type Badge */}
      <div className="px-3 py-1.5 bg-muted/50 rounded-b-md">
        <div className="text-xs text-muted-foreground font-medium">
          {data.type.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </div>
      </div>
    </div>
  )
}
