"""
Tests for Generation Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_generate_simple_workflow():
    """Test simple workflow generation endpoint."""
    response = client.post(
        "/api/v1/generate/simple",
        json={
            "description": "Create a workflow to summarize text",
            "preferences": {},
            "use_rag": False
        }
    )

    assert response.status_code == 200
    data = response.json()

    assert "workflow" in data
    assert "metadata" in data
    assert "quality_score" in data
    assert "generation_time" in data

    # Check workflow structure
    workflow = data["workflow"]
    assert "version" in workflow
    assert "graph" in workflow
    assert "nodes" in workflow["graph"]
    assert "edges" in workflow["graph"]


def test_generate_simple_workflow_validation():
    """Test that generated workflow is valid."""
    response = client.post(
        "/api/v1/generate/simple",
        json={
            "description": "Create a simple chatbot",
            "preferences": {},
            "use_rag": False
        }
    )

    assert response.status_code == 200
    data = response.json()
    workflow = data["workflow"]

    # Check for required nodes
    nodes = workflow["graph"]["nodes"]
    node_types = [node["type"] for node in nodes]
    assert "start" in node_types
    assert "end" in node_types


def test_generate_full_workflow_without_rag():
    """Test full workflow generation without RAG."""
    response = client.post(
        "/api/v1/generate/full",
        json={
            "description": "Create a customer support workflow",
            "preferences": {"complexity": "moderate"},
            "use_rag": False
        }
    )

    assert response.status_code == 200
    data = response.json()

    assert "workflow" in data
    assert "metadata" in data
    assert "quality_score" in data


def test_get_generation_status():
    """Test generation status endpoint."""
    response = client.get("/api/v1/generate/status")

    assert response.status_code == 200
    data = response.json()

    assert "llm_service" in data
    assert "vector_store" in data
    assert "dsl_service" in data


def test_generate_simple_workflow_invalid_request():
    """Test workflow generation with invalid request."""
    response = client.post(
        "/api/v1/generate/simple",
        json={}  # Missing required fields
    )

    assert response.status_code == 422  # Validation error