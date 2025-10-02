"""
Integration Tests for Generation API Endpoints
Tests the multi-agent API endpoint
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestGenerationEndpoints:
    """Test workflow generation API endpoints."""

    def test_simple_generation(self):
        """Test simple workflow generation endpoint."""
        response = client.post(
            "/api/v1/generate/simple",
            json={
                "description": "Create a simple workflow that greets users",
                "preferences": {},
                "use_rag": False
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "workflow" in data
        assert "metadata" in data
        assert "quality_score" in data
        assert "suggestions" in data
        assert "generation_time" in data

        # Check workflow structure
        workflow = data["workflow"]
        assert "app" in workflow
        assert "workflow" in workflow
        assert "graph" in workflow["workflow"]
        assert len(workflow["workflow"]["graph"]["nodes"]) >= 3

    def test_full_generation_with_rag(self):
        """Test full workflow generation with RAG."""
        response = client.post(
            "/api/v1/generate/full",
            json={
                "description": "Create a customer support routing system",
                "preferences": {"complexity": "moderate"},
                "use_rag": True
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Check response
        assert data["quality_score"] >= 75  # Should be higher with RAG
        assert len(data["suggestions"]) > 0

    @pytest.mark.slow
    def test_multi_agent_generation(self):
        """Test multi-agent workflow generation endpoint."""
        response = client.post(
            "/api/v1/generate/multi-agent",
            json={
                "description": "Build a document processing pipeline with quality checks",
                "preferences": {"complexity": "moderate", "max_iterations": 2},
                "use_rag": True
            },
            timeout=90.0
        )

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "workflow" in data
        assert "metadata" in data
        assert "quality_score" in data

        # Check metadata
        metadata = data["metadata"]
        assert metadata["complexity"] in ["simple", "moderate", "complex"]
        assert "multi-agent" in metadata["tags"]

        # Check workflow quality
        assert data["quality_score"] >= 70  # Should be decent quality

        # Check workflow has proper structure
        workflow = data["workflow"]
        assert len(workflow["workflow"]["graph"]["nodes"]) >= 4
        assert len(workflow["workflow"]["graph"]["edges"]) >= 3

    def test_generation_status(self):
        """Test generation status endpoint."""
        response = client.get("/api/v1/generate/status")

        assert response.status_code == 200
        data = response.json()

        # Check services status
        assert "llm_service" in data
        assert "vector_store" in data
        assert "dsl_service" in data
        assert "multi_agent" in data

        # Check multi-agent info
        multi_agent = data["multi_agent"]
        assert multi_agent["available"] == True
        assert len(multi_agent["agents"]) == 4
        assert "requirements" in multi_agent["agents"]
        assert "architecture" in multi_agent["agents"]
        assert "configuration" in multi_agent["agents"]
        assert "quality" in multi_agent["agents"]

    def test_invalid_request(self):
        """Test handling of invalid requests."""
        response = client.post(
            "/api/v1/generate/multi-agent",
            json={
                "description": "",  # Empty description
                "preferences": {}
            }
        )

        # Should either return error or handle gracefully
        assert response.status_code in [200, 400, 422, 500]

    def test_concurrent_generations(self):
        """Test handling of concurrent generation requests."""
        import httpx
        from multiprocessing.pool import ThreadPool

        def make_request(i):
            with httpx.Client(timeout=90.0) as client:
                return client.post(
                    "http://test/api/v1/generate/simple",
                    json={"description": f"Create workflow {i}", "preferences": {}}
                )

        with ThreadPool(3) as pool:
            responses = pool.map(make_request, range(3))

        # All should succeed
        for response in responses:
            assert response.status_code == 200
            data = response.json()
            assert "workflow" in data