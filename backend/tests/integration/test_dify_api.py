import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import status

from app.main import app

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio


async def test_execute_dify_workflow_success():
    """
    Test the successful execution of a Dify workflow via the /execute endpoint.
    It should return a 200 OK with the mocked result.
    """
    request_data = {
        "dify_server_command": ["echo", "hello"],
        "dsl_content": "some_dsl_content"
    }
    # Correct way to test an ASGI app with httpx.AsyncClient
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/dify/execute", json=request_data)

    assert response.status_code == status.HTTP_200_OK
    response_json = response.json()
    assert response_json["status"] == "success"
    assert response_json["result"] == "Mocked workflow result"


async def test_execute_dify_workflow_invalid_body():
    """
    Test the /execute endpoint with an invalid request body.
    It should return a 422 Unprocessable Entity error.
    """
    # Missing dsl_content
    request_data = {
        "dify_server_command": ["echo", "hello"]
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/dify/execute", json=request_data)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY