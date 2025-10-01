import { NodeProps } from '@xyflow/react'
import { Circle, Database, Filter, Merge, FileText, Wrench, MessageSquare, Plus } from 'lucide-react'
import { BaseNode, BaseNodeData } from './BaseNode'

// Icon mapping for generic node types
const iconMap: Record<string, any> = {
  'knowledge-retrieval': Database,
  'question-classifier': Filter,
  'variable-aggregator': Merge,
  'template-transform': FileText,
  'parameter-extractor': Plus,
  tool: Wrench,
  assigner: Plus,
  'conversation-variable-assigner': MessageSquare,
  default: Circle,
}

// Color mapping for generic node types
const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  'knowledge-retrieval': { bg: '#ec4899', border: '#db2777', text: '#fff' },
  'question-classifier': { bg: '#06b6d4', border: '#0891b2', text: '#fff' },
  'variable-aggregator': { bg: '#6366f1', border: '#4f46e5', text: '#fff' },
  'template-transform': { bg: '#14b8a6', border: '#0d9488', text: '#fff' },
  'parameter-extractor': { bg: '#84cc16', border: '#65a30d', text: '#fff' },
  tool: { bg: '#64748b', border: '#475569', text: '#fff' },
  assigner: { bg: '#22c55e', border: '#16a34a', text: '#fff' },
  'conversation-variable-assigner': { bg: '#f97316', border: '#ea580c', text: '#fff' },
  default: { bg: '#6b7280', border: '#4b5563', text: '#fff' },
}

export function GenericNode(props: NodeProps) {
  const data = props.data as BaseNodeData
  const nodeType = data.type || 'default'

  const Icon = iconMap[nodeType] || iconMap.default
  const colors = colorMap[nodeType] || colorMap.default

  return (
    <BaseNode
      {...props}
      data={data}
      icon={Icon}
      color={colors}
    >
      {data.description && (
        <div className="text-xs text-muted-foreground line-clamp-2">
          {data.description}
        </div>
      )}

      {data.config && Object.keys(data.config).length > 0 && (
        <div className="text-xs text-muted-foreground pt-1">
          {Object.keys(data.config).length} configuration(s)
        </div>
      )}
    </BaseNode>
  )
}
