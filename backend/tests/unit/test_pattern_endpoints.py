"""
Tests for Pattern Endpoints (Recommendation)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_pattern_recommendations():
    """Test pattern recommendation endpoint."""
    response = client.get(
        "/api/v1/patterns/recommend",
        params={
            "description": "I need a workflow for question answering with knowledge base",
            "n_results": 3,
            "use_llm_analysis": False  # Disable LLM for faster testing
        }
    )

    # May return 503 if vector store not initialized in test environment
    assert response.status_code in [200, 503]

    if response.status_code == 503:
        pytest.skip("Vector store not initialized in test environment")

    assert response.status_code == 200
    data = response.json()

    assert "description" in data
    assert "n_results" in data
    assert "recommendations" in data

    # Should have recommendations (assuming patterns are loaded)
    if data["n_results"] > 0:
        rec = data["recommendations"][0]
        assert "metadata" in rec
        assert "content" in rec
        assert "recommendation_score" in rec


def test_get_pattern_recommendations_with_complexity():
    """Test recommendations with complexity filter."""
    response = client.get(
        "/api/v1/patterns/recommend",
        params={
            "description": "Simple text processing",
            "n_results": 2,
            "complexity": "simple",
            "use_llm_analysis": False
        }
    )

    if response.status_code == 503:
        pytest.skip("Vector store not initialized")

    assert response.status_code == 200
    data = response.json()

    assert "recommendations" in data

    # Check that recommended patterns match complexity
    for rec in data["recommendations"]:
        assert rec["metadata"]["complexity"] == "simple"


def test_get_pattern_statistics():
    """Test pattern statistics endpoint."""
    response = client.get("/api/v1/patterns/statistics")

    # May return 503 if vector store not initialized
    assert response.status_code in [200, 503]

    if response.status_code == 503:
        pytest.skip("Vector store not initialized")

    data = response.json()

    # May return error if vector store not initialized
    assert "total_patterns" in data or "error" in data


def test_recommend_patterns_invalid_complexity():
    """Test recommendations with invalid complexity value."""
    response = client.get(
        "/api/v1/patterns/recommend",
        params={
            "description": "Test workflow",
            "complexity": "invalid_complexity",  # Invalid value
            "use_llm_analysis": False
        }
    )

    # May return 503 if vector store not initialized
    if response.status_code == 503:
        pytest.skip("Vector store not initialized")

    # Should still work, just won't filter by complexity
    assert response.status_code == 200