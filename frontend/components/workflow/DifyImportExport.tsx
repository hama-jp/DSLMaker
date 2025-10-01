/**
 * Dify DSL Import/Export Component
 * Modern, compact UI for Dify YAML file operations
 */

'use client'

import { useState, useRef } from 'react'
import { Upload, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { difyClient } from '@/lib/dify-client'
import { difyDSLToReactFlow, getDifyDSLStats } from '@/lib/dify-converter'
import { cn } from '@/lib/utils'

interface DifyImportExportProps {
  onImportSuccess?: (dsl: any, metadata: any) => void
  onExport?: () => void
  hasWorkflow?: boolean
}

export default function DifyImportExport({
  onImportSuccess,
  onExport,
  hasWorkflow = false,
}: DifyImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Auto-hide message after 3 seconds
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  /**
   * Handle file selection for import
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)

    try {
      const dsl = await difyClient.importFromFile(file)
      const { metadata } = difyDSLToReactFlow(dsl)
      const stats = getDifyDSLStats(dsl)

      showMessage('success', `Imported "${metadata.name}" (${stats.nodeCount} nodes)`)

      if (onImportSuccess) {
        onImportSuccess(dsl, { ...metadata, ...stats })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Import failed'
      showMessage('error', errorMsg)
      console.error('Import error:', err)
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  /**
   * Trigger export callback (actual export handled by parent)
   */
  const handleExport = () => {
    if (!hasWorkflow) {
      showMessage('error', 'No workflow to export')
      return
    }

    if (onExport) {
      onExport()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Import Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className={cn(
          "group relative flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all",
          "bg-card hover:bg-accent border border-border shadow-sm",
          "hover:shadow-md hover:scale-105 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        )}
        title="Import Dify YAML"
      >
        {importing ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        ) : (
          <Upload className="w-4 h-4 text-blue-600" />
        )}
        <span className="text-sm text-foreground hidden sm:inline">
          {importing ? 'Importing...' : 'Import'}
        </span>
      </button>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={!hasWorkflow}
        className={cn(
          "group relative flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all",
          "bg-card hover:bg-accent border border-border shadow-sm",
          "hover:shadow-md hover:scale-105 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        )}
        title="Export as Dify YAML"
      >
        <Download className="w-4 h-4 text-green-600" />
        <span className="text-sm text-foreground hidden sm:inline">Export</span>
      </button>

      {/* Dify Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
        <FileText className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary hidden sm:inline">Dify</span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".yaml,.yml"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Toast Message */}
      {message && (
        <div
          className={cn(
            "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-5",
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          )}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}
    </div>
  )
}
