"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Zap,
  Brain,
  Cog,
  ShieldCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Users,
  ArrowRight
} from 'lucide-react'
import {
  WorkflowGenerationCoordinator,
  GenerationRequest,
  GenerationProgress,
  GenerationResult,
  ProgressCallback
} from '@/agents/workflow-generation-coordinator'
import { ClarificationQuestion } from '@/agents/requirements-agent'

interface MultiAgentWorkflowGeneratorProps {
  onWorkflowGenerated: (workflow: any, metadata: any) => void
  onError: (error: string) => void
  disabled?: boolean
  className?: string
}

interface ClarificationState {
  questions: ClarificationQuestion[]
  answers: Record<string, string>
  isAnswering: boolean
}

const stageIcons = {
  requirements: Brain,
  architecture: Cog,
  configuration: Cog,
  quality_assurance: ShieldCheck,
  completed: CheckCircle
}

const stageColors = {
  requirements: 'bg-blue-500',
  architecture: 'bg-purple-500',
  configuration: 'bg-orange-500',
  quality_assurance: 'bg-green-500',
  completed: 'bg-emerald-500'
}

const stageNames = {
  requirements: 'Requirements Analysis',
  architecture: 'Architecture Design',
  configuration: 'Node Configuration',
  quality_assurance: 'Quality Assurance',
  completed: 'Completed'
}

export function MultiAgentWorkflowGenerator({
  onWorkflowGenerated,
  onError,
  disabled = false,
  className = ''
}: MultiAgentWorkflowGeneratorProps) {
  const [userInput, setUserInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<GenerationProgress | null>(null)
  const [clarification, setClarification] = useState<ClarificationState | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // Advanced options
  const [preferences, setPreferences] = useState({
    complexity: 'Moderate' as 'Simple' | 'Moderate' | 'Complex' | 'Enterprise',
    performance: 'balanced' as 'speed' | 'quality' | 'balanced',
    budget: 'medium' as 'low' | 'medium' | 'high'
  })

  const handleProgressUpdate: ProgressCallback = useCallback((progressData) => {
    setProgress(progressData)
  }, [])

  const handleGenerate = async () => {
    if (!userInput.trim() || isGenerating) return

    setIsGenerating(true)
    setProgress(null)
    setResult(null)
    setClarification(null)

    try {
      const request: GenerationRequest = {
        userInput: userInput.trim(),
        clarificationAnswers: clarification?.answers,
        preferences: preferences
      }

      console.log('🚀 Starting multi-agent workflow generation:', request)

      const generationResult = await WorkflowGenerationCoordinator.generateWorkflow(
        request,
        handleProgressUpdate
      )

      setResult(generationResult)

      if (generationResult.success && generationResult.finalWorkflow) {
        console.log('✅ Multi-agent workflow generation successful')
        onWorkflowGenerated(generationResult.finalWorkflow, {
          qualityScore: generationResult.qualityScore,
          readinessLevel: generationResult.readinessLevel,
          generationTime: generationResult.metadata.generationTime,
          agentStages: generationResult.metadata.agentStages,
          recommendations: generationResult.metadata.recommendations
        })
      } else if (generationResult.clarificationNeeded) {
        console.log('❓ Clarification needed')
        setClarification({
          questions: generationResult.clarificationNeeded.questions,
          answers: {},
          isAnswering: false
        })
      } else if (generationResult.error) {
        console.error('❌ Multi-agent generation failed:', generationResult.error)
        onError(`Generation failed: ${generationResult.error.message}`)
      }

    } catch (error) {
      console.error('💥 Critical multi-agent generation error:', error)
      onError(`Critical error: ${error instanceof Error ? error.message : String(error)}`)
      setResult(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClarificationSubmit = async () => {
    if (!clarification) return

    // Update the request with clarification answers and retry
    setClarification({ ...clarification, isAnswering: true })

    try {
      const request: GenerationRequest = {
        userInput,
        clarificationAnswers: clarification.answers,
        preferences: preferences
      }

      const generationResult = await WorkflowGenerationCoordinator.generateWorkflow(
        request,
        handleProgressUpdate
      )

      setResult(generationResult)
      setClarification(null)

      if (generationResult.success && generationResult.finalWorkflow) {
        console.log('✅ Multi-agent workflow generation successful after clarification')
        onWorkflowGenerated(generationResult.finalWorkflow, {
          qualityScore: generationResult.qualityScore,
          readinessLevel: generationResult.readinessLevel,
          generationTime: generationResult.metadata.generationTime,
          agentStages: generationResult.metadata.agentStages,
          recommendations: generationResult.metadata.recommendations
        })
      } else if (generationResult.error) {
        onError(`Generation failed after clarification: ${generationResult.error.message}`)
      }

    } catch (error) {
      console.error('💥 Clarification retry error:', error)
      onError(`Clarification retry failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setClarification(prev => prev ? { ...prev, isAnswering: false } : null)
    }
  }

  const updateClarificationAnswer = (questionId: string, answer: string) => {
    if (!clarification) return
    setClarification({
      ...clarification,
      answers: {
        ...clarification.answers,
        [questionId]: answer
      }
    })
  }

  // Reset when user input changes significantly
  useEffect(() => {
    if (!isGenerating && !clarification) {
      setResult(null)
      setProgress(null)
    }
  }, [userInput, isGenerating, clarification])

  // Render progress indicator
  const renderProgress = () => {
    if (!progress) return null

    const Icon = stageIcons[progress.stage]
    const colorClass = stageColors[progress.stage]

    return (
      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-medium">{stageNames[progress.stage]}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {progress.currentStep}
              </div>
            </div>
          </div>
          <div className="text-sm font-medium">
            {progress.progress}%
          </div>
        </div>

        <Progress value={progress.progress} className="w-full" />

        {progress.estimatedTimeRemaining && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Estimated time remaining: {progress.estimatedTimeRemaining}
          </div>
        )}

        {/* Show stage results if available */}
        {progress.stageResults && (
          <div className="space-y-2 mt-3">
            {progress.stageResults.requirements && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Requirements analyzed (confidence: {(progress.stageResults.requirements.confidence * 100).toFixed(1)}%)</span>
              </div>
            )}
            {progress.stageResults.architecture && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Architecture designed ({progress.stageResults.architecture.estimatedNodes} nodes)</span>
              </div>
            )}
            {progress.stageResults.configuration && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Nodes configured with advanced prompts</span>
              </div>
            )}
            {progress.stageResults.qualityAssessment && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Quality assessment complete (score: {progress.stageResults.qualityAssessment.overallScore}/100)</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Render clarification questions
  const renderClarification = () => {
    if (!clarification) return null

    return (
      <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            Additional Information Needed
          </h4>
        </div>

        <p className="text-sm text-blue-700 dark:text-blue-300">
          To generate the best workflow, please answer these questions:
        </p>

        <div className="space-y-3">
          {clarification.questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {index + 1}. {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {question.options ? (
                <select
                  value={clarification.answers[question.id] || ''}
                  onChange={(e) => updateClarificationAnswer(question.id, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-200 dark:border-blue-700 rounded-md bg-white dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                >
                  <option value="">Select an option...</option>
                  {question.options.map((option, optIndex) => (
                    <option key={optIndex} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={clarification.answers[question.id] || ''}
                  onChange={(e) => updateClarificationAnswer(question.id, e.target.value)}
                  placeholder="Your answer..."
                  className="bg-white dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100"
                />
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={handleClarificationSubmit}
          disabled={clarification.isAnswering}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {clarification.isAnswering ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Answers...
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue Generation
            </>
          )}
        </Button>
      </div>
    )
  }

  // Render generation result
  const renderResult = () => {
    if (!result || !result.success) return null

    const qualityColor = (result.qualityScore || 0) >= 85 ? 'text-green-600' :
                        (result.qualityScore || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'

    return (
      <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h4 className="font-medium text-green-900 dark:text-green-100">
            Multi-Agent Workflow Generated Successfully!
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-green-800 dark:text-green-200">Quality Score</div>
            <div className={`text-lg font-bold ${qualityColor}`}>
              {result.qualityScore}/100
            </div>
          </div>
          <div>
            <div className="font-medium text-green-800 dark:text-green-200">Readiness Level</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-300 capitalize">
              {result.readinessLevel}
            </div>
          </div>
        </div>

        <div className="text-sm text-green-700 dark:text-green-300">
          Generation Time: {Math.round((result.metadata.generationTime || 0) / 1000)} seconds
        </div>

        {result.metadata.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium text-green-800 dark:text-green-200">Key Recommendations:</div>
            <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
              {result.metadata.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                  <span>{rec.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Multi-Agent Workflow Generation
        </h3>
        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
          AI-Powered
        </Badge>
      </div>

      {/* Description */}
      <Alert className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950">
        <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <AlertDescription className="text-indigo-700 dark:text-indigo-300">
          Advanced AI system with 4 specialized agents that collaboratively design high-quality workflows that surpass what beginners can create manually.
        </AlertDescription>
      </Alert>

      {/* Input Section */}
      <div className="space-y-3">
        <div>
          <label htmlFor="workflow-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Describe your workflow requirements:
          </label>
          <Input
            id="workflow-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="e.g., Create a customer support system that analyzes tickets and routes them appropriately..."
            className="mt-1"
            disabled={disabled || isGenerating}
          />
        </div>

        {/* Advanced Options Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="text-xs"
          >
            <Cog className="w-3 h-3 mr-1" />
            {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
          </Button>
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Complexity</label>
              <select
                value={preferences.complexity}
                onChange={(e) => setPreferences({ ...preferences, complexity: e.target.value as any })}
                className="w-full mt-1 px-2 py-1 text-xs border rounded"
                disabled={isGenerating}
              >
                <option value="Simple">Simple</option>
                <option value="Moderate">Moderate</option>
                <option value="Complex">Complex</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Performance</label>
              <select
                value={preferences.performance}
                onChange={(e) => setPreferences({ ...preferences, performance: e.target.value as any })}
                className="w-full mt-1 px-2 py-1 text-xs border rounded"
                disabled={isGenerating}
              >
                <option value="speed">Speed</option>
                <option value="balanced">Balanced</option>
                <option value="quality">Quality</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Budget</label>
              <select
                value={preferences.budget}
                onChange={(e) => setPreferences({ ...preferences, budget: e.target.value as any })}
                className="w-full mt-1 px-2 py-1 text-xs border rounded"
                disabled={isGenerating}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={disabled || isGenerating || !userInput.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating with AI Agents...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Generate with Multi-Agent System
            </>
          )}
        </Button>
      </div>

      {/* Progress Indicator */}
      {progress && renderProgress()}

      {/* Clarification Questions */}
      {clarification && renderClarification()}

      {/* Generation Result */}
      {result && renderResult()}
    </div>
  )
}

export default MultiAgentWorkflowGenerator