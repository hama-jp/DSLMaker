"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { FileText, Settings } from "lucide-react"
import { useSettingsStore } from "@/stores/settings-store"
import { SettingsModal } from "@/components/settings/settings-modal"

export function Header() {
  const { openSettings } = useSettingsStore()

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
