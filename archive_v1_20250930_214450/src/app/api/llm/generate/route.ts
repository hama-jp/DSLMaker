import { NextRequest, NextResponse } from 'next/server'

// Secure server-side LLM API route
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, settings } = body

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: prompt is required' },
        { status: 400 }
      )
    }

    // Use server-side environment variables for API keys
    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.OPENAI_MODEL || 'gpt-4'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: API key not configured' },
        { status: 500 }
      )
    }

    // Make secure server-side API call
    const llmResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: settings?.temperature ?? 0.7,
        max_tokens: settings?.maxTokens ?? 4000,
      }),
    })

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text()
      console.error('LLM API Error:', errorText)
      return NextResponse.json(
        { error: 'LLM service unavailable' },
        { status: 503 }
      )
    }

    const result = await llmResponse.json()

    // Return sanitized response (no API keys)
    return NextResponse.json({
      content: result.choices?.[0]?.message?.content || '',
      usage: result.usage,
    })

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}