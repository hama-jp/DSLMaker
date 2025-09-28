import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { CheckCircle, FileOutput, Flag } from 'lucide-react'

export function EndNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-gradient-to-r from-red-50 to-orange-50
        ${selected ? 'border-red-600 shadow-lg' : 'border-red-400 shadow-md'}
        transition-all duration-200 hover:shadow-lg min-w-[180px]
      `}
    >
      <div className="flex items-center gap-3">
        <div className="bg-red-500 p-2 rounded-full">
          <Flag className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="font-semibold text-gray-800">End</div>
          <div className="text-xs text-gray-600">{data?.title || 'Output'}</div>
        </div>
      </div>

      {data?.outputs && Object.keys(data.outputs).length > 0 && (
        <div className="mt-2 pt-2 border-t border-red-200">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <FileOutput className="w-3 h-3" />
            <span>Outputs: {Object.keys(data.outputs).length}</span>
          </div>
          <div className="mt-1 space-y-1">
            {Object.keys(data.outputs).slice(0, 2).map(key => (
              <div key={key} className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-red-500" />
                <span className="text-xs text-gray-700">{key}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="w-3 h-3 bg-red-500 border-2 border-white"
      />
    </div>
  )
}