"""
Tests for API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint returns correct response."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "DSLMaker v2 API"
    assert data["version"] == "2.0.0-alpha"
    assert data["status"] == "operational"


def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "services" in data
    assert "api" in data["services"]


def test_api_info_endpoint():
    """Test API info endpoint."""
    response = client.get("/api/v1/info")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "2.0.0-alpha"
    assert "endpoints" in data
    assert "features" in data