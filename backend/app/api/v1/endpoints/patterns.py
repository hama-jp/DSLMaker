"""
Pattern Management Endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import logging

from app.services.vector_store import vector_store
from app.services.recommendation_service import recommendation_service
from app.models.workflow import PatternMetadata, WorkflowPattern

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/list")
async def list_patterns() -> Dict[str, Any]:
    """List all workflow patterns in the knowledge base."""
    try:
        stats = vector_store.get_collection_stats()
        return {
            "total_patterns": stats.get("total_patterns", 0),
            "collection_name": stats.get("collection_name"),
            "status": "ready" if vector_store._initialized else "not_initialized"
        }
    except Exception as e:
        logger.error(f"❌ Failed to list patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_patterns(
    query: str,
    n_results: int = 3,
    complexity: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search for similar workflow patterns.

    Args:
        query: Search query text
        n_results: Number of results to return
        complexity: Optional complexity filter (simple, moderate, complex)
    """
    try:
        if not vector_store._initialized:
            raise HTTPException(
                status_code=503,
                detail="Vector store not initialized"
            )

        # Build metadata filter
        filter_metadata = {}
        if complexity:
            filter_metadata["complexity"] = complexity

        # Search patterns
        patterns = await vector_store.search_patterns(
            query=query,
            n_results=n_results,
            filter_metadata=filter_metadata if filter_metadata else None
        )

        return {
            "query": query,
            "n_results": len(patterns),
            "patterns": patterns
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to search patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{pattern_id}")
async def get_pattern(pattern_id: str) -> Dict[str, Any]:
    """Get a specific pattern by ID."""
    try:
        if not vector_store._initialized:
            raise HTTPException(
                status_code=503,
                detail="Vector store not initialized"
            )

        pattern = await vector_store.get_pattern(pattern_id)

        if not pattern:
            raise HTTPException(
                status_code=404,
                detail=f"Pattern '{pattern_id}' not found"
            )

        return pattern

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get pattern: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add")
async def add_pattern(pattern: WorkflowPattern) -> Dict[str, str]:
    """
    Add a new workflow pattern to the knowledge base.

    This endpoint allows adding custom patterns for RAG.
    """
    try:
        if not vector_store._initialized:
            raise HTTPException(
                status_code=503,
                detail="Vector store not initialized"
            )

        # Add pattern to vector store
        await vector_store.add_pattern(
            pattern_id=pattern.metadata.pattern_id,
            content=pattern.content,
            metadata=pattern.metadata.model_dump()
        )

        logger.info(f"✅ Added pattern: {pattern.metadata.pattern_id}")

        return {
            "status": "success",
            "pattern_id": pattern.metadata.pattern_id,
            "message": "Pattern added successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to add pattern: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{pattern_id}")
async def delete_pattern(pattern_id: str) -> Dict[str, str]:
    """Delete a pattern from the knowledge base."""
    try:
        if not vector_store._initialized:
            raise HTTPException(
                status_code=503,
                detail="Vector store not initialized"
            )

        await vector_store.delete_pattern(pattern_id)

        logger.info(f"🗑️ Deleted pattern: {pattern_id}")

        return {
            "status": "success",
            "pattern_id": pattern_id,
            "message": "Pattern deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete pattern: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommend")
async def recommend_patterns(
    description: str,
    n_results: int = 3,
    complexity: Optional[str] = None,
    use_llm_analysis: bool = True
) -> Dict[str, Any]:
    """
    Get pattern recommendations based on workflow description.

    Uses intelligent scoring combining:
    - Semantic similarity from vector search
    - Complexity matching
    - Use case relevance

    Args:
        description: Workflow description
        n_results: Number of recommendations (default: 3)
        complexity: Optional complexity filter (simple, moderate, complex)
        use_llm_analysis: Whether to use LLM for requirement analysis (default: True)
    """
    try:
        if not vector_store._initialized:
            raise HTTPException(
                status_code=503,
                detail="Vector store not initialized"
            )

        recommendations = await recommendation_service.recommend_patterns(
            description=description,
            n_results=n_results,
            complexity=complexity,
            use_llm_analysis=use_llm_analysis
        )

        return {
            "description": description,
            "n_results": len(recommendations),
            "recommendations": recommendations
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
async def get_pattern_statistics() -> Dict[str, Any]:
    """Get statistics about the pattern library."""
    try:
        stats = await recommendation_service.get_pattern_statistics()
        return stats

    except Exception as e:
        logger.error(f"❌ Failed to get statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))