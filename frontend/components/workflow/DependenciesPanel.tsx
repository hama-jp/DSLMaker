'use client'

import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Package, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react'

interface DifyDependency {
  current_identifier: string | null
  type: 'marketplace' | 'builtin'
  value?: {
    marketplace_plugin_unique_identifier?: string
  }
}

interface DependenciesPanelProps {
  dependencies?: DifyDependency[]
  className?: string
}

export default function DependenciesPanel({ dependencies = [], className = '' }: DependenciesPanelProps) {
  if (!dependencies || dependencies.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>No external dependencies</span>
        </div>
      </Card>
    )
  }

  const parseDependency = (dep: DifyDependency) => {
    if (dep.type !== 'marketplace' || !dep.value?.marketplace_plugin_unique_identifier) {
      return null
    }

    const identifier = dep.value.marketplace_plugin_unique_identifier
    // Format: org/plugin:version@hash
    const match = identifier.match(/^([^/]+)\/([^:]+):([^@]+)@(.+)$/)

    if (!match) {
      return {
        org: 'unknown',
        plugin: identifier,
        version: 'unknown',
        hash: '',
        identifier
      }
    }

    return {
      org: match[1],
      plugin: match[2],
      version: match[3],
      hash: match[4].substring(0, 8), // Short hash
      identifier
    }
  }

  const parsedDeps = dependencies
    .map(parseDependency)
    .filter((dep): dep is NonNullable<typeof dep> => dep !== null)

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-primary" />
          <Label className="text-sm font-semibold">
            Marketplace Dependencies ({parsedDeps.length})
          </Label>
        </div>

        <div className="space-y-2">
          {parsedDeps.map((dep, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-3 space-y-2 bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              {/* Plugin Name and Version */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {dep.org}/{dep.plugin}
                      </p>
                    </div>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-mono flex-shrink-0">
                  v{dep.version}
                </span>
              </div>

              {/* Hash and Status */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="font-mono">#{dep.hash}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-600 dark:text-green-400">✓ Installed</span>
                </div>
              </div>

              {/* Marketplace Link */}
              <div className="pt-1">
                <a
                  href={`https://marketplace.dify.ai/${dep.org}/${dep.plugin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  View in Marketplace
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          <p>
            This workflow uses {parsedDeps.length} external plugin{parsedDeps.length !== 1 ? 's' : ''} from the Dify Marketplace.
          </p>
        </div>
      </div>
    </Card>
  )
}
