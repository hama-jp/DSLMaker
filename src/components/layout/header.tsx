"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { FileText, Settings, Download } from "lucide-react"
import { useSettingsStore } from "@/stores/settings-store"
import { useWorkflowStore } from "@/stores/workflow-store"
import { SettingsModal } from "@/components/settings/settings-modal"

export function Header() {
  const { openSettings } = useSettingsStore()
  const { exportDSL, isExporting, dslFile } = useWorkflowStore()

  const handleExportDSL = async () => {
    try {
      const yamlContent = await exportDSL()

      // Create and trigger download
      const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dify-workflow-${Date.now()}.yml`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      // TODO: Show error toast/notification
    }
  }

  return (
    <>
      <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-semibold">DSL Maker</h1>
            </div>
            <Separator orientation="vertical" className="h-6" />
          </div>

          <div className="flex items-center gap-4">
            <Input placeholder="Workflow name..." className="w-64" />
            <Button size="sm">Generate Workflow</Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportDSL}
              disabled={!dslFile || isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export DSL'}
            </Button>
            <Button variant="ghost" size="sm" onClick={openSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <SettingsModal />
    </>
  )
}
