#!/bin/bash

# Development server helper script
# This script ensures clean server startup without port conflicts

echo "🧹 Cleaning up existing development servers..."

# Kill any existing development servers on common ports
lsof -ti:3000,3001,3002,3003,3004 | xargs -r kill -9

# Wait a moment for processes to terminate
sleep 1

# Check if any npm run dev processes are still running
EXISTING_PROCESSES=$(ps aux | grep "npm run dev" | grep -v grep | wc -l)
if [ $EXISTING_PROCESSES -gt 0 ]; then
    echo "⚠️  Found $EXISTING_PROCESSES existing npm run dev processes. Terminating..."
    pkill -f "npm run dev" 2>/dev/null
    sleep 2
fi

echo "🚀 Starting development server..."
npm run dev