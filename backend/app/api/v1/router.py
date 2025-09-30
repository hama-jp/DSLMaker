"""
API v1 Router
Aggregates all v1 endpoints
"""

from fastapi import APIRouter

from app.api.v1.endpoints import generation, patterns

# Create main v1 router
api_router = APIRouter(prefix="/api/v1")

# Include endpoint routers
api_router.include_router(generation.router, prefix="/generate", tags=["generation"])
api_router.include_router(patterns.router, prefix="/patterns", tags=["patterns"])