/**
 * Workflow Generator Component
 * Main UI for generating workflows with multi-agent system
 */

'use client'

import { useState } from 'react'
import { useWorkflowGeneration, type GenerationMethod } from '@/hooks/useWorkflowGeneration'

export default function WorkflowGenerator() {
  const [description, setDescription] = useState('')
  const [complexity, setComplexity] = useState<'simple' | 'moderate' | 'complex'>('moderate')
  const [method, setMethod] = useState<GenerationMethod>('multi-agent')
  const [maxIterations, setMaxIterations] = useState(3)

  const { loading, error, result, progress, generate, reset } = useWorkflowGeneration()

  const handleGenerate = async () => {
    if (!description.trim()) {
      return
    }

    await generate({
      description,
      preferences: {
        complexity,
        max_iterations: maxIterations,
      },
      use_rag: method !== 'simple',
    }, method)
  }

  const handleReset = () => {
    setDescription('')
    reset()
  }

  const downloadWorkflow = () => {
    if (!result) return

    const blob = new Blob([JSON.stringify(result.workflow, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          🤖 AI Workflow Generator
        </h1>

        {/* Input Form */}
        <div className="space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workflow Description
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Describe the workflow you want to create... (e.g., 'Create a customer support system that classifies messages and routes them to appropriate handlers')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Complexity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complexity
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={complexity}
                onChange={(e) => setComplexity(e.target.value as any)}
                disabled={loading}
              >
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
              </select>
            </div>

            {/* Generation Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={method}
                onChange={(e) => setMethod(e.target.value as GenerationMethod)}
                disabled={loading}
              >
                <option value="multi-agent">Multi-Agent (Recommended)</option>
                <option value="full">Full RAG</option>
                <option value="simple">Simple</option>
              </select>
            </div>

            {/* Max Iterations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Iterations
              </label>
              <input
                type="number"
                min="1"
                max="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={maxIterations}
                onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                disabled={loading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={loading || !description.trim()}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Workflow'}
            </button>

            {result && (
              <button
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                New Generation
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {loading && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-900 font-medium">{progress}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-medium mb-2">⚠️ Generation Failed</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* Quality Score */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Quality Score: {result.quality_score.toFixed(1)}/100
                </h2>
                <div className="text-sm text-gray-600">
                  Generated in {result.generation_time.toFixed(2)}s
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    result.quality_score >= 90
                      ? 'bg-green-500'
                      : result.quality_score >= 75
                      ? 'bg-blue-500'
                      : result.quality_score >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${result.quality_score}%` }}
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Workflow Info</h3>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Name:</span> {result.metadata.name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Complexity:</span> {result.metadata.complexity}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.metadata.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Workflow Structure</h3>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Nodes:</span>{' '}
                  {result.workflow.workflow.graph.nodes.length}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Edges:</span>{' '}
                  {result.workflow.workflow.graph.edges.length}
                </p>
              </div>
            </div>

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-3">💡 Suggestions</h3>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-yellow-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={downloadWorkflow}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                📥 Download Workflow JSON
              </button>
            </div>

            {/* Workflow Preview */}
            <details className="bg-gray-50 rounded-lg p-4">
              <summary className="cursor-pointer font-semibold text-gray-900 mb-2">
                📄 View Workflow DSL
              </summary>
              <pre className="mt-4 p-4 bg-gray-900 text-gray-100 rounded overflow-x-auto text-xs">
                {JSON.stringify(result.workflow, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}