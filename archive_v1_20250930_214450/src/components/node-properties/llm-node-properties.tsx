"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MessageSquare } from "lucide-react"
import type { DifyLLMNode } from "@/types/dify-workflow"

interface LLMNodePropertiesProps {
  node: DifyLLMNode
  onUpdate: (updates: Partial<DifyLLMNode['data']>) => void
}

export function LLMNodeProperties({ node, onUpdate }: LLMNodePropertiesProps) {
  const { data } = node

  const handleTitleChange = useCallback((value: string) => {
    onUpdate({ title: value })
  }, [onUpdate])

  const handleProviderChange = useCallback((value: string) => {
    onUpdate({
      model: {
        ...data.model,
        provider: value
      }
    })
  }, [onUpdate, data.model])

  const handleModelChange = useCallback((value: string) => {
    onUpdate({
      model: {
        ...data.model,
        name: value
      }
    })
  }, [onUpdate, data.model])

  const handleTemperatureChange = useCallback((value: number[]) => {
    onUpdate({
      model: {
        ...data.model,
        completion_params: {
          ...data.model.completion_params,
          temperature: value[0]
        }
      }
    })
  }, [onUpdate, data.model])

  const handleMaxTokensChange = useCallback((value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue)) {
      onUpdate({
        model: {
          ...data.model,
          completion_params: {
            ...data.model.completion_params,
            max_tokens: numValue
          }
        }
      })
    }
  }, [onUpdate, data.model])

  const handlePromptChange = useCallback((value: string) => {
    // Note: Complex prompt_template structure not fully supported by current types
    // This would require extending the DifyLLMNode type to support message arrays
    console.log('Prompt change not fully implemented:', value)

    // Simple string prompt update (fallback)
    if (typeof data.prompt_template === 'string') {
      onUpdate({ prompt_template: value })
    }
  }, [onUpdate, data.prompt_template])

  const handleMemoryEnabledChange = useCallback((enabled: boolean) => {
    onUpdate({
      memory: {
        ...data.memory,
        enabled
      }
    })
  }, [onUpdate, data.memory])

  const systemPrompt = (typeof data.prompt_template === 'string')
    ? data.prompt_template
    : (data.prompt_template as any)?.messages?.find((msg: any) => msg.role === 'system')?.text || ''
  const temperature = data.model.completion_params?.temperature || 0.7
  const maxTokens = data.model.completion_params?.max_tokens || 1024

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            LLM Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Settings */}
          <div className="space-y-2">
            <Label htmlFor="llm-title">Node Title</Label>
            <Input
              id="llm-title"
              value={data.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter LLM node title"
            />
          </div>

          <Separator />

          {/* Model Configuration */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Model Settings</h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="llm-provider">Provider</Label>
                <Select value={data.model.provider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="azure_openai">Azure OpenAI</SelectItem>
                    <SelectItem value="huggingface_hub">Hugging Face</SelectItem>
                    <SelectItem value="ollama">Ollama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="llm-model">Model</Label>
                <Select value={data.model.name} onValueChange={handleModelChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                    <SelectItem value="gpt-oss-120b">GPT-OSS-120B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="llm-temperature">
                Temperature: {temperature.toFixed(2)}
              </Label>
              <Slider
                id="llm-temperature"
                min={0}
                max={2}
                step={0.1}
                value={[temperature]}
                onValueChange={handleTemperatureChange}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="llm-max-tokens">Max Tokens</Label>
              <Input
                id="llm-max-tokens"
                type="number"
                value={maxTokens}
                onChange={(e) => handleMaxTokensChange(e.target.value)}
                placeholder="1024"
                min="1"
                max="8192"
              />
            </div>
          </div>

          <Separator />

          {/* Prompt Configuration */}
          <div className="space-y-2">
            <Label htmlFor="llm-prompt">System Prompt</Label>
            <Textarea
              id="llm-prompt"
              value={systemPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Enter system prompt..."
              className="resize-none min-h-[120px]"
            />
          </div>

          <Separator />

          {/* Memory Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="llm-memory">Enable Memory</Label>
              <Switch
                id="llm-memory"
                checked={data.memory?.enabled || false}
                onCheckedChange={handleMemoryEnabledChange}
              />
            </div>

            {data.memory?.enabled && (
              <div className="pl-4 text-xs text-muted-foreground">
                Conversation history will be maintained across interactions
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}