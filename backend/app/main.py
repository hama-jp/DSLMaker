"""
DSLMaker v2 Backend - Main FastAPI Application
Multi-Agent RAG System for Dify Workflow Generation
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.services.vector_store import vector_store
from app.services.llm_service import llm_service
from app.api.v1.router import api_router
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.logging import RequestLoggingMiddleware

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("🚀 Starting DSLMaker v2 Backend...")
    logger.info("📦 Initializing services...")

    # Initialize ChromaDB
    try:
        await vector_store.initialize()

        # Check if patterns need to be loaded
        stats = vector_store.get_collection_stats()
        pattern_count = stats.get("total_patterns", 0)

        if pattern_count == 0:
            logger.info("📚 No patterns found in vector store. Loading patterns...")
            try:
                from scripts.initialize_patterns import initialize_patterns
                result = await initialize_patterns(force_reload=False)
                if result["status"] == "success":
                    logger.info(f"✅ Loaded {result['loaded']} patterns successfully")
                else:
                    logger.warning(f"⚠️ Pattern loading completed with warnings")
            except Exception as pattern_error:
                logger.error(f"Failed to load patterns: {pattern_error}")
                logger.warning("⚠️ Continuing without patterns - manual initialization may be required")
        else:
            logger.info(f"✅ Vector store contains {pattern_count} patterns")

    except Exception as e:
        logger.error(f"Failed to initialize ChromaDB: {e}")
        # Continue startup even if ChromaDB fails (for development)

    # Initialize LLM service
    try:
        await llm_service.initialize()
    except Exception as e:
        logger.error(f"Failed to initialize LLM service: {e}")
        # Continue startup even if LLM fails (for development)

    # TODO: Initialize agents

    logger.info("✅ Backend started successfully")

    yield

    # Shutdown
    logger.info("🛑 Shutting down DSLMaker v2 Backend...")
    # TODO: Cleanup resources
    logger.info("👋 Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="DSLMaker v2 API",
    description="AI-Powered Dify Workflow Generator with Multi-Agent RAG System",
    version="2.0.0-alpha",
    lifespan=lifespan
)

# Configure Request Logging (first, so it logs everything)
app.add_middleware(RequestLoggingMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Rate Limiting
app.add_middleware(
    RateLimitMiddleware,
    requests=settings.rate_limit_requests,
    period=settings.rate_limit_period,
    enabled=settings.rate_limit_enabled
)

# Include API router
app.include_router(api_router)


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "name": "DSLMaker v2 API",
        "version": "2.0.0-alpha",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    chromadb_status = "operational" if vector_store._initialized else "not_initialized"
    chromadb_stats = vector_store.get_collection_stats() if vector_store._initialized else {}
    llm_status = "operational" if llm_service._initialized else "not_initialized"
    llm_stats = llm_service.get_status()

    return {
        "status": "healthy",
        "services": {
            "api": "operational",
            "chromadb": chromadb_status,
            "chromadb_stats": chromadb_stats,
            "llm": llm_status,
            "llm_stats": llm_stats,
            "agents": "pending",  # TODO: Check agent status
        }
    }


@app.get("/api/v1/info")
async def api_info():
    """API information endpoint."""
    return {
        "version": "2.0.0-alpha",
        "endpoints": {
            "generation": "/api/v1/generate/*",
            "patterns": "/api/v1/patterns/*",
            "health": "/health",
        },
        "features": [
            "Multi-agent workflow generation",
            "RAG-based pattern retrieval",
            "Quality assurance validation",
            "DSL generation and optimization",
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower()
    )