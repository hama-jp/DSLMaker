import React from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'
import { ArrowRight } from 'lucide-react'

export function CustomEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const edgeLabel = data?.label || data?.sourceType && data?.targetType
    ? `${data.sourceType} → ${data.targetType}`
    : null

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#9333ea',
          strokeWidth: 2,
          strokeDasharray: data?.isInIteration ? '5 5' : undefined,
        }}
      />
      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              fontWeight: 500,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-white px-2 py-1 rounded border border-purple-200 text-purple-700 flex items-center gap-1"
          >
            <ArrowRight className="w-3 h-3" />
            <span>{edgeLabel}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
