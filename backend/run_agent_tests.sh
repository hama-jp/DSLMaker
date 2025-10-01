#!/bin/bash
#
# Run agent unit tests and generate coverage report
#

set -e

echo "======================================"
echo "🧪 Running Agent Unit Tests"
echo "======================================"
echo ""

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Install test dependencies if needed
echo "📦 Checking dependencies..."
pip install -q pytest pytest-asyncio pytest-cov 2>/dev/null || true

# Run tests with coverage
echo ""
echo "🏃 Running tests..."
echo ""

# Run only agent tests
python -m pytest \
    tests/agents/ \
    -v \
    --tb=short \
    --cov=app/agents \
    --cov-report=term-missing \
    --cov-report=html:htmlcov \
    --asyncio-mode=auto \
    "$@"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "======================================"
    echo "✅ All tests passed!"
    echo "======================================"
    echo ""
    echo "📊 Coverage report generated in htmlcov/index.html"
else
    echo "======================================"
    echo "❌ Some tests failed!"
    echo "======================================"
fi

exit $EXIT_CODE
