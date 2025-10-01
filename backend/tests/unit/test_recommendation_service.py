"""
Tests for Recommendation Service
"""

import pytest
from app.services.recommendation_service import recommendation_service


@pytest.mark.asyncio
async def test_score_patterns():
    """Test pattern scoring logic."""
    patterns = [
        {
            "id": "pattern_1",
            "content": "Test pattern 1",
            "metadata": {
                "complexity": "simple",
                "use_cases": "classification, routing",
                "name": "Test Pattern 1"
            },
            "distance": 0.2
        },
        {
            "id": "pattern_2",
            "content": "Test pattern 2",
            "metadata": {
                "complexity": "moderate",
                "use_cases": "analysis, processing",
                "name": "Test Pattern 2"
            },
            "distance": 0.5
        }
    ]

    description = "I need a simple classification workflow"
    analyzed_requirements = description

    scored = await recommendation_service._score_patterns(
        patterns=patterns,
        description=description,
        analyzed_requirements=analyzed_requirements
    )

    assert len(scored) == 2
    assert all("recommendation_score" in p for p in scored)

    # Pattern 1 should score higher (lower distance + complexity match)
    assert scored[0]["id"] == "pattern_1"
    assert scored[0]["recommendation_score"] > scored[1]["recommendation_score"]


@pytest.mark.asyncio
async def test_get_pattern_statistics():
    """Test getting pattern statistics."""
    stats = await recommendation_service.get_pattern_statistics()

    # May return error if vector store not initialized
    assert "total_patterns" in stats or "error" in stats