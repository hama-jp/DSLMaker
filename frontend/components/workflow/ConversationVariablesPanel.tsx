'use client'

import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Variable, List, Hash, Type, ToggleLeft } from 'lucide-react'

interface ConversationVariable {
  id: string
  name: string
  description?: string
  value_type: string
  value: any
  selector: string[]
}

interface ConversationVariablesPanelProps {
  variables?: ConversationVariable[]
  className?: string
}

const getTypeIcon = (valueType: string) => {
  if (valueType.startsWith('array')) {
    return <List className="h-3.5 w-3.5" />
  }
  if (valueType === 'number') {
    return <Hash className="h-3.5 w-3.5" />
  }
  if (valueType === 'string') {
    return <Type className="h-3.5 w-3.5" />
  }
  return <ToggleLeft className="h-3.5 w-3.5" />
}

const getTypeColor = (valueType: string) => {
  if (valueType.startsWith('array')) {
    return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950'
  }
  if (valueType === 'number') {
    return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950'
  }
  if (valueType === 'string') {
    return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
  }
  return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950'
}

const formatValue = (value: any, valueType: string): string => {
  if (value === null || value === undefined) {
    return '(not set)'
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return `[${value.length} item${value.length !== 1 ? 's' : ''}]`
  }
  if (typeof value === 'string') {
    return value || '(empty)'
  }
  return String(value)
}

export default function ConversationVariablesPanel({
  variables = [],
  className = ''
}: ConversationVariablesPanelProps) {
  if (!variables || variables.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Variable className="h-4 w-4" />
          <span>No conversation variables defined</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Variable className="h-4 w-4 text-primary" />
          <Label className="text-sm font-semibold">
            Conversation Variables ({variables.length})
          </Label>
        </div>

        <div className="space-y-2">
          {variables.map((variable) => (
            <div
              key={variable.id}
              className="border rounded-lg p-3 space-y-2 bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              {/* Variable Name and Type */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Variable className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {variable.name}
                      </p>
                    </div>
                  </div>
                  {variable.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {variable.description}
                    </p>
                  )}
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono flex-shrink-0 ${getTypeColor(variable.value_type)}`}>
                  {getTypeIcon(variable.value_type)}
                  <span>{variable.value_type}</span>
                </div>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Selector:</span>
                <code className="px-2 py-0.5 rounded bg-muted font-mono">
                  {variable.selector.join('.')}
                </code>
              </div>

              {/* Current Value */}
              <div className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground flex-shrink-0">Value:</span>
                <code className="px-2 py-0.5 rounded bg-muted/50 font-mono flex-1 truncate">
                  {formatValue(variable.value, variable.value_type)}
                </code>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          <p>
            Conversation variables persist across multiple workflow runs within the same conversation session.
          </p>
        </div>
      </div>
    </Card>
  )
}
