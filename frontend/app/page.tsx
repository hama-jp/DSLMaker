'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('checking...')

  useEffect(() => {
    // Check backend API connection
    const checkApi = async () => {
      try {
        const response = await fetch('http://localhost:8000/health')
        const data = await response.json()
        setApiStatus(data.status)
      } catch (error) {
        setApiStatus('disconnected')
      }
    }
    checkApi()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          DSLMaker v2 🚀
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          AI-Powered Dify Workflow Generator
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">System Status</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <span className="font-medium">Backend API:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                apiStatus === 'healthy'
                  ? 'bg-green-100 text-green-800'
                  : apiStatus === 'checking...'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {apiStatus}
              </span>
            </div>
          </div>
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-semibold">Phase 0 Progress:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center">
                <span className="mr-2">✅</span>
                Architecture design completed
              </li>
              <li className="flex items-center">
                <span className="mr-2">✅</span>
                Backend environment setup
              </li>
              <li className="flex items-center">
                <span className="mr-2">✅</span>
                Frontend environment setup
              </li>
              <li className="flex items-center">
                <span className="mr-2">🚧</span>
                ChromaDB configuration (in progress)
              </li>
              <li className="flex items-center">
                <span className="mr-2">⏳</span>
                CI/CD pipeline basics (pending)
              </li>
            </ul>
          </div>
          <div className="mt-8 text-sm text-gray-500">
            <p>Version: 2.0.0-alpha | Status: Phase 0 (Preparation)</p>
          </div>
        </div>
      </div>
    </div>
  )
}