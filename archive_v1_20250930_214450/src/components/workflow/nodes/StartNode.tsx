import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Play, FileInput } from 'lucide-react'

export function StartNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-gradient-to-r from-green-50 to-emerald-50
        ${selected ? 'border-green-600 shadow-lg' : 'border-green-400 shadow-md'}
        transition-all duration-200 hover:shadow-lg min-w-[180px]
      `}
    >
      <div className="flex items-center gap-3">
        <div className="bg-green-500 p-2 rounded-full">
          <Play className="w-4 h-4 text-white" fill="white" />
        </div>
        <div className="flex flex-col">
          <div className="font-semibold text-gray-800">Start</div>
          <div className="text-xs text-gray-600">{(data as any)?.title || 'Input'}</div>
        </div>
      </div>

      {(data as any)?.variables && (data as any).variables.length > 0 && (
        <div className="mt-2 pt-2 border-t border-green-200">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <FileInput className="w-3 h-3" />
            <span>Variables: {(data as any).variables.length}</span>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  )
}