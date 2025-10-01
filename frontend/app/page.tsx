'use client'

import { useState, useEffect } from 'react'
import { Settings, Sparkles, AlertCircle, RefreshCw, Code2 } from 'lucide-react'
import ChatInterface from '@/components/chat/ChatInterface'
import WorkflowVisualizer from '@/components/workflow/WorkflowVisualizer'
import DSLSidebar from '@/components/sidebar/DSLSidebar'
import SettingsModal from '@/components/settings/SettingsModal'
import { useBackendStatus, useWorkflowGeneration } from '@/hooks/useWorkflowGeneration'
import { cn } from '@/lib/utils'

export default function Home() {
  const { healthy, checking, services, checkStatus } = useBackendStatus()
  const { result } = useWorkflowGeneration()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showDSL, setShowDSL] = useState(true)

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-none border-b border-border bg-card">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-foreground" />
            <div>
              <h1 className="text-base font-semibold text-foreground">
                DSL Maker
              </h1>
              <p className="text-xs text-muted-foreground">AI-Powered Workflow Designer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Status */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 border border-border">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                healthy ? "bg-green-500" : checking ? "bg-yellow-500" : "bg-red-500"
              )} />
              <span className="text-xs font-medium text-foreground">
                {healthy ? 'Connected' : checking ? 'Connecting...' : 'Offline'}
              </span>
              {!healthy && !checking && (
                <button
                  onClick={checkStatus}
                  className="p-0.5 rounded hover:bg-accent transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Toggle DSL */}
            <button
              onClick={() => setShowDSL(!showDSL)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                showDSL
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              {showDSL ? 'Hide Code' : 'Show Code'}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors border border-border"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Offline Warning Banner */}
        {!healthy && !checking && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <div>
                <span className="text-sm text-destructive font-medium block">
                  Backend Connection Lost
                </span>
                <span className="text-xs text-muted-foreground">
                  Please ensure the backend server is running on port 8000
                </span>
              </div>
            </div>
            <button
              onClick={checkStatus}
              className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors font-medium"
            >
              Reconnect
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="h-full flex gap-3">
          {/* Left: Chat Interface */}
          <div className="w-96 flex-shrink-0">
            <ChatInterface />
          </div>

          {/* Center: Workflow Visualizer */}
          <div className="flex-1">
            <WorkflowVisualizer workflow={result?.workflow || null} />
          </div>

          {/* Right: DSL Sidebar */}
          {showDSL && (
            <div className="w-96 flex-shrink-0">
              <DSLSidebar
                workflow={result?.workflow || null}
                dslYaml={result?.workflow ? JSON.stringify(result.workflow, null, 2) : undefined}
              />
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
