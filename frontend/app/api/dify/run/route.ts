import { NextResponse } from 'next/server';

// The backend service URL should be configured via environment variables for production.
// For local development, we'll assume it's running on port 8000.
const BACKEND_URL = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dsl, dify_server_command } = body;

    if (!dsl || !dify_server_command) {
      return NextResponse.json(
        { error: 'Missing dsl or dify_server_command' },
        { status: 400 }
      );
    }

    // Forward the request to the actual backend API endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/dify/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        dsl_content: dsl,
        dify_server_command: dify_server_command,
      }),
    });

    const data = await backendResponse.json();

    // If the backend returned an error, forward it
    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.detail || data.result || 'An error occurred on the backend.' },
        { status: backendResponse.status }
      );
    }

    // Return the successful response from the backend
    return NextResponse.json(data);

  } catch (error) {
    console.error('[DIFY RUN API] Error:', error);
    // Handle network errors when the backend is unreachable
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'Could not connect to the backend service. Is it running?' },
        { status: 503 } // Service Unavailable
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}