'use client'

import { useState, useEffect } from 'react'
import { X, Key, Server, Sliders, Eye, EyeOff, Save, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Settings {
  apiKey: string
  baseUrl: string
  model: string
  maxIterations: number
  temperature: number
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>({
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-5-mini',
    maxIterations: 3,
    temperature: 0.7,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dslmaker-settings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  const handleSave = () => {
    setIsSaving(true)
    localStorage.setItem('dslmaker-settings', JSON.stringify(settings))
    setTimeout(() => {
      setIsSaving(false)
      onClose()
    }, 500)
  }

  const handleReset = () => {
    setSettings({
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-5-mini',
      maxIterations: 3,
      temperature: 0.7,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
            <p className="text-xs text-gray-500 mt-0.5">Configure your API and system parameters</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* API Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">API Configuration</h3>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Stored locally in browser (not encrypted)
              </p>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Base URL
              </label>
              <div className="relative">
                <Server className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={settings.baseUrl}
                  onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Change for Azure OpenAI or other providers
              </p>
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Model
              </label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="gpt-5-mini">GPT-5 Mini (Default)</option>
                <option value="gpt-5">GPT-5</option>
              </select>
            </div>
          </div>

          {/* System Settings */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">System Parameters</h3>
            </div>

            {/* Max Iterations */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Max Iterations
                </label>
                <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                  {settings.maxIterations}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={settings.maxIterations}
                onChange={(e) => setSettings({ ...settings, maxIterations: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of refinement iterations for workflow generation
              </p>
            </div>

            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Temperature
                </label>
                <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                  {settings.temperature.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                LLM creativity (0: deterministic, 1: random)
              </p>
            </div>
          </div>

          {/* Info Panel */}
          <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
            <p className="text-xs text-blue-900 font-medium mb-1.5">Tips</p>
            <ul className="text-xs text-blue-800 space-y-0.5">
              <li>• Keep your API key secure and never share it</li>
              <li>• Higher iterations improve quality but take longer</li>
              <li>• Lower temperature gives more consistent results</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md transition-colors",
                isSaving
                  ? "bg-blue-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
