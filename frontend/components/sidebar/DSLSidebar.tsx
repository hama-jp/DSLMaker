'use client'

import { useState } from 'react'
import { Copy, Download, FileCode, Check, FileJson } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export interface DSLSidebarProps {
  workflow: any | null
  dslYaml?: string
}

export default function DSLSidebar({ workflow, dslYaml }: DSLSidebarProps) {
  const [activeTab, setActiveTab] = useState<'json' | 'yaml'>('yaml')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const content = activeTab === 'yaml' ? dslYaml : JSON.stringify(workflow, null, 2)
    if (content) {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    const content = activeTab === 'yaml' ? dslYaml : JSON.stringify(workflow, null, 2)
    const blob = new Blob([content || ''], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow.${activeTab}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!workflow) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center">
            <FileCode className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No DSL yet</h3>
          <p className="text-xs text-muted-foreground">
            Generated workflow will<br />appear here
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileCode className="w-4 h-4" />
          DSL Code
        </CardTitle>
        <div className="flex gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            title={copied ? "Copied!" : "Copy"}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            title="Download"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <Tabs defaultValue="yaml" className="h-full flex flex-col">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="yaml" className="flex-1">
              <FileCode className="w-3 h-3 mr-1" />
              YAML
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              <FileJson className="w-3 h-3 mr-1" />
              JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="yaml" className="flex-1 overflow-auto p-3 bg-muted/30 m-0 data-[state=active]:flex">
            <pre className="text-xs font-mono leading-relaxed">
              <code>{dslYaml || 'Generating YAML...'}</code>
            </pre>
          </TabsContent>

          <TabsContent value="json" className="flex-1 overflow-auto p-3 bg-muted/30 m-0 data-[state=active]:flex">
            <pre className="text-xs font-mono leading-relaxed">
              <code>{JSON.stringify(workflow, null, 2)}</code>
            </pre>
          </TabsContent>
        </Tabs>

        {/* Stats */}
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Nodes</p>
              <p className="text-sm font-semibold">{workflow.nodes?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Edges</p>
              <p className="text-sm font-semibold">{workflow.edges?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Size</p>
              <p className="text-sm font-semibold">
                {(JSON.stringify(workflow).length / 1024).toFixed(1)}KB
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
