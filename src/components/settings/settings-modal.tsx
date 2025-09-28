"use client"

import { useState, useEffect } from "react"
import { useSettingsStore } from "@/stores/settings-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, CheckCircle, RotateCcw } from "lucide-react"

export function SettingsModal() {
  const {
    llmSettings,
    isSettingsOpen,
    updateLLMSettings,
    resetLLMSettings,
    closeSettings
  } = useSettingsStore()

  const [formData, setFormData] = useState(llmSettings)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    if (isSettingsOpen) {
      setFormData(llmSettings)
      setValidationErrors([])
    }
  }, [isSettingsOpen, llmSettings])

  const handleSave = () => {
    const { isValid, errors } = validateFormData(formData)

    if (isValid) {
      updateLLMSettings(formData)
      closeSettings()
    } else {
      setValidationErrors(errors)
    }
  }

  const handleReset = () => {
    resetLLMSettings()
    setFormData(useSettingsStore.getState().llmSettings)
    setValidationErrors([])
  }

  const handleCancel = () => {
    setFormData(llmSettings)
    setValidationErrors([])
    closeSettings()
  }

  const validateFormData = (data: typeof formData) => {
    const errors: string[] = []

    if (!data.baseUrl.trim()) {
      errors.push('Base URL is required')
    } else {
      try {
        new URL(data.baseUrl)
      } catch {
        errors.push('Base URL must be a valid URL')
      }
    }

    if (!data.modelName.trim()) {
      errors.push('Model name is required')
    }

    if (!data.apiKey.trim()) {
      errors.push('API Key is required')
    }

    if (data.temperature < 0 || data.temperature > 2) {
      errors.push('Temperature must be between 0 and 2')
    }

    if (data.maxTokens < 1 || data.maxTokens > 32000) {
      errors.push('Max tokens must be between 1 and 32000')
    }

    if (data.timeout < 1000 || data.timeout > 300000) {
      errors.push('Timeout must be between 1 and 300 seconds')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const updateField = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={isSettingsOpen} onOpenChange={closeSettings}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LLM API Settings</DialogTitle>
          <DialogDescription>
            Configure your LLM API settings for workflow generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {validationErrors.length > 0 && (
            <Card className="border-destructive">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Validation Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-destructive">• {error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  placeholder="https://api.openai.com/v1"
                  value={formData.baseUrl}
                  onChange={(e) => updateField('baseUrl', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The base URL for your LLM API endpoint
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelName">Model Name</Label>
                <Input
                  id="modelName"
                  placeholder="gpt-5-mini"
                  value={formData.modelName}
                  onChange={(e) => updateField('modelName', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The model identifier (e.g., gpt-5-mini, claude-3-5-sonnet)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={formData.apiKey}
                  onChange={(e) => updateField('apiKey', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your API key (stored locally and never sent to external services)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generation Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature">Temperature</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.temperature}
                  </span>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[formData.temperature]}
                  onValueChange={(value) => updateField('temperature', value[0])}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Higher values make output more random, lower values more focused
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="1"
                  max="32000"
                  value={formData.maxTokens}
                  onChange={(e) => updateField('maxTokens', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of tokens to generate (1-32000)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="1000"
                  max="300000"
                  value={formData.timeout}
                  onChange={(e) => updateField('timeout', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Request timeout in milliseconds (1-300 seconds)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
