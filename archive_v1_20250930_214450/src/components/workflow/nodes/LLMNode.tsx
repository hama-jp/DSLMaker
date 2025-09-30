import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { BrainCircuit, Sparkles, Settings } from 'lucide-react'

export function LLMNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-gradient-to-r from-purple-50 to-indigo-50
        ${selected ? 'border-purple-600 shadow-lg' : 'border-purple-400 shadow-md'}
        transition-all duration-200 hover:shadow-lg min-w-[200px]
      `}
    >
      <div className="flex items-center gap-3">
        <div className="bg-purple-500 p-2 rounded-full">
          <BrainCircuit className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="font-semibold text-gray-800">LLM</div>
          <div className="text-xs text-gray-600">{(data as any)?.title || 'AI Process'}</div>
        </div>
      </div>

      {(data as any)?.model && (
        <div className="mt-2 pt-2 border-t border-purple-200">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span className="text-gray-700 font-medium">
              {(data as any).model.provider || 'openai'} / {(data as any).model.name || 'gpt-4'}
            </span>
          </div>
          {(data as any).model.completion_params && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
              <Settings className="w-3 h-3" />
              <span>
                Temp: {(data as any).model.completion_params.temperature || 0.7}
              </span>
            </div>
          )}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </div>
  )
}