"""
API v1 Router
Aggregates all v1 endpoints
"""

from fastapi import APIRouter

# Create main v1 router
api_router = APIRouter(prefix="/api/v1")

# TODO: Import and include endpoint routers
# from app.api.v1.endpoints import generation, patterns
# api_router.include_router(generation.router, prefix="/generate", tags=["generation"])
# api_router.include_router(patterns.router, prefix="/patterns", tags=["patterns"])