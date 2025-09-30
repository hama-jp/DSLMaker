import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import {
  Code,
  Globe,
  Wrench,
  Database,
  GitBranch,
  Zap,
  Box,
  Search,
  FileText,
  Layers,
  Filter,
  RotateCcw,
  Archive
} from 'lucide-react'

const nodeStyles = {
  code: {
    gradient: 'from-yellow-50 to-amber-50',
    borderSelected: 'border-yellow-600',
    borderDefault: 'border-yellow-400',
    bgIcon: 'bg-yellow-500',
    icon: Code
  },
  http_request: {
    gradient: 'from-blue-50 to-sky-50',
    borderSelected: 'border-blue-600',
    borderDefault: 'border-blue-400',
    bgIcon: 'bg-blue-500',
    icon: Globe
  },
  tool: {
    gradient: 'from-gray-50 to-slate-50',
    borderSelected: 'border-gray-600',
    borderDefault: 'border-gray-400',
    bgIcon: 'bg-gray-500',
    icon: Wrench
  },
  knowledge_retrieval: {
    gradient: 'from-teal-50 to-cyan-50',
    borderSelected: 'border-teal-600',
    borderDefault: 'border-teal-400',
    bgIcon: 'bg-teal-500',
    icon: Database
  },
  'knowledge-retrieval': {
    gradient: 'from-teal-50 to-cyan-50',
    borderSelected: 'border-teal-600',
    borderDefault: 'border-teal-400',
    bgIcon: 'bg-teal-500',
    icon: Database
  },
  if_else: {
    gradient: 'from-orange-50 to-red-50',
    borderSelected: 'border-orange-600',
    borderDefault: 'border-orange-400',
    bgIcon: 'bg-orange-500',
    icon: GitBranch
  },
  'if-else': {
    gradient: 'from-orange-50 to-red-50',
    borderSelected: 'border-orange-600',
    borderDefault: 'border-orange-400',
    bgIcon: 'bg-orange-500',
    icon: GitBranch
  },
  template_transform: {
    gradient: 'from-pink-50 to-rose-50',
    borderSelected: 'border-pink-600',
    borderDefault: 'border-pink-400',
    bgIcon: 'bg-pink-500',
    icon: Zap
  },
  'template-transform': {
    gradient: 'from-pink-50 to-rose-50',
    borderSelected: 'border-pink-600',
    borderDefault: 'border-pink-400',
    bgIcon: 'bg-pink-500',
    icon: Zap
  },
  'parameter-extractor': {
    gradient: 'from-emerald-50 to-green-50',
    borderSelected: 'border-emerald-600',
    borderDefault: 'border-emerald-400',
    bgIcon: 'bg-emerald-500',
    icon: Filter
  },
  'variable-aggregator': {
    gradient: 'from-indigo-50 to-blue-50',
    borderSelected: 'border-indigo-600',
    borderDefault: 'border-indigo-400',
    bgIcon: 'bg-indigo-500',
    icon: Layers
  },
  'variable-assigner': {
    gradient: 'from-violet-50 to-purple-50',
    borderSelected: 'border-violet-600',
    borderDefault: 'border-violet-400',
    bgIcon: 'bg-violet-500',
    icon: Archive
  },
  iteration: {
    gradient: 'from-cyan-50 to-blue-50',
    borderSelected: 'border-cyan-600',
    borderDefault: 'border-cyan-400',
    bgIcon: 'bg-cyan-500',
    icon: RotateCcw
  },
  extract: {
    gradient: 'from-lime-50 to-green-50',
    borderSelected: 'border-lime-600',
    borderDefault: 'border-lime-400',
    bgIcon: 'bg-lime-500',
    icon: Filter
  },
  kb: {
    gradient: 'from-teal-50 to-cyan-50',
    borderSelected: 'border-teal-600',
    borderDefault: 'border-teal-400',
    bgIcon: 'bg-teal-500',
    icon: Database
  },
  condition: {
    gradient: 'from-orange-50 to-red-50',
    borderSelected: 'border-orange-600',
    borderDefault: 'border-orange-400',
    bgIcon: 'bg-orange-500',
    icon: GitBranch
  },
  document: {
    gradient: 'from-slate-50 to-gray-50',
    borderSelected: 'border-slate-600',
    borderDefault: 'border-slate-400',
    bgIcon: 'bg-slate-500',
    icon: FileText
  },
  search: {
    gradient: 'from-yellow-50 to-orange-50',
    borderSelected: 'border-yellow-600',
    borderDefault: 'border-yellow-400',
    bgIcon: 'bg-yellow-500',
    icon: Search
  },
  retrieval: {
    gradient: 'from-teal-50 to-cyan-50',
    borderSelected: 'border-teal-600',
    borderDefault: 'border-teal-400',
    bgIcon: 'bg-teal-500',
    icon: Database
  },
  classifier: {
    gradient: 'from-purple-50 to-pink-50',
    borderSelected: 'border-purple-600',
    borderDefault: 'border-purple-400',
    bgIcon: 'bg-purple-500',
    icon: Filter
  },
  aggregator: {
    gradient: 'from-indigo-50 to-blue-50',
    borderSelected: 'border-indigo-600',
    borderDefault: 'border-indigo-400',
    bgIcon: 'bg-indigo-500',
    icon: Layers
  },
  assigner: {
    gradient: 'from-violet-50 to-purple-50',
    borderSelected: 'border-violet-600',
    borderDefault: 'border-violet-400',
    bgIcon: 'bg-violet-500',
    icon: Archive
  },
  default: {
    gradient: 'from-gray-50 to-gray-100',
    borderSelected: 'border-gray-600',
    borderDefault: 'border-gray-400',
    bgIcon: 'bg-gray-500',
    icon: Box
  }
}

export function DefaultNode({ data, selected, type }: NodeProps) {
  const style = nodeStyles[type as keyof typeof nodeStyles] || nodeStyles.default
  const Icon = style.icon

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-gradient-to-r ${style.gradient}
        ${selected ? style.borderSelected + ' shadow-lg' : style.borderDefault + ' shadow-md'}
        transition-all duration-200 hover:shadow-lg min-w-[180px]
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`${style.bgIcon} p-2 rounded-full`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="font-semibold text-gray-800 capitalize">
            {type?.replace(/_/g, ' ') || 'Node'}
          </div>
          <div className="text-xs text-gray-600">{(data as any)?.title || (data as any)?.label || ''}</div>
        </div>
      </div>

      {(data as any)?.description && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 line-clamp-2">{(data as any).description}</p>
        </div>
      )}

      {/* Input handles - multiple for aggregator nodes */}
      {(type === 'variable-aggregator' || type === 'variable_aggregator' ||
        type === 'variable-assigner' || type === 'variable_assigner' ||
        type === 'aggregator' || type === 'assigner') ? (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="input1"
            className={`w-3 h-3 ${style.bgIcon} border-2 border-white`}
            style={{ top: '25%' }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id="input2"
            className={`w-3 h-3 ${style.bgIcon} border-2 border-white`}
            style={{ top: '50%' }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id="input3"
            className={`w-3 h-3 ${style.bgIcon} border-2 border-white`}
            style={{ top: '75%' }}
          />
        </>
      ) : (
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          className={`w-3 h-3 ${style.bgIcon} border-2 border-white`}
        />
      )}

      {/* Output handles - multiple for branching/iteration nodes */}
      {(type === 'if-else' || type === 'if_else') ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="w-3 h-3 bg-green-500 border-2 border-white"
            style={{ top: '30%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="w-3 h-3 bg-red-500 border-2 border-white"
            style={{ top: '70%' }}
          />
        </>
      ) : (type === 'iteration') ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="item_output"
            className="w-3 h-3 bg-orange-500 border-2 border-white"
            style={{ top: '25%' }}
          />
          <Handle
            type="target"
            position={Position.Right}
            id="result_input"
            className="w-3 h-3 bg-purple-500 border-2 border-white"
            style={{ top: '50%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="final_output"
            className={`w-3 h-3 ${style.bgIcon} border-2 border-white`}
            style={{ top: '75%' }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          className={`w-3 h-3 ${style.bgIcon} border-2 border-white`}
        />
      )}
    </div>
  )
}