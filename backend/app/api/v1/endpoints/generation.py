"""
Workflow Generation Endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
import time
from datetime import datetime

from app.models.workflow import (
    WorkflowRequest,
    WorkflowResponse,
    WorkflowMetadata
)
from app.services.llm_service import llm_service
from app.services.dsl_service import dsl_service
from app.services.vector_store import vector_store

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/simple", response_model=WorkflowResponse)
async def generate_simple_workflow(request: WorkflowRequest) -> WorkflowResponse:
    """
    Generate a simple linear workflow (Start -> LLM -> End).

    This is a basic workflow generator for testing and simple use cases.
    """
    start_time = time.time()

    try:
        logger.info(f"🚀 Starting simple workflow generation: {request.description[:50]}...")

        # Create metadata
        metadata = WorkflowMetadata(
            name="Generated Workflow",
            description=request.description,
            created_at=datetime.now(),
            complexity="simple",
            tags=["generated", "simple"]
        )

        # Generate workflow DSL
        workflow = dsl_service.generate_simple_workflow(
            description=request.description,
            metadata=metadata
        )

        # Validate workflow
        is_valid, errors = dsl_service.validate_workflow(workflow)
        if not is_valid:
            logger.error(f"❌ Generated workflow validation failed: {errors}")
            raise HTTPException(
                status_code=500,
                detail=f"Generated workflow is invalid: {', '.join(errors)}"
            )

        generation_time = time.time() - start_time

        logger.info(f"✅ Workflow generated successfully in {generation_time:.2f}s")

        return WorkflowResponse(
            workflow=workflow,
            metadata=metadata,
            quality_score=75.0,  # Basic score for simple workflow
            suggestions=[
                "Consider adding error handling",
                "Add more detailed variable descriptions",
                "Implement retry logic for robustness"
            ],
            generation_time=generation_time
        )

    except Exception as e:
        logger.error(f"❌ Failed to generate workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/full", response_model=WorkflowResponse)
async def generate_full_workflow(request: WorkflowRequest) -> WorkflowResponse:
    """
    Generate a complete workflow using multi-agent RAG system.

    This endpoint will eventually use the full LangGraph multi-agent system.
    For now, it uses RAG-enhanced generation.
    """
    start_time = time.time()

    try:
        logger.info(f"🚀 Starting full workflow generation: {request.description[:50]}...")

        # Retrieve similar patterns if RAG is enabled
        retrieved_patterns = []
        if request.use_rag and vector_store._initialized:
            logger.info("🔍 Retrieving similar patterns from knowledge base...")
            patterns = await vector_store.search_patterns(
                query=request.description,
                n_results=3
            )
            retrieved_patterns = [p['content'] for p in patterns]
            logger.info(f"📚 Retrieved {len(retrieved_patterns)} patterns")

        # Generate workflow description using LLM with RAG context
        if not llm_service._initialized:
            await llm_service.initialize()

        system_prompt = """You are an expert workflow designer for Dify platform.
Generate a workflow specification based on the user's requirements and reference patterns.
Focus on practical, production-ready workflows."""

        if retrieved_patterns:
            enhanced_description = await llm_service.generate_with_context(
                prompt=request.description,
                context_documents=retrieved_patterns,
                system_prompt=system_prompt,
                temperature=0.7
            )
        else:
            enhanced_description = await llm_service.generate_text(
                prompt=request.description,
                system_prompt=system_prompt,
                temperature=0.7
            )

        # Create metadata
        metadata = WorkflowMetadata(
            name="AI-Generated Workflow",
            description=enhanced_description[:200],
            created_at=datetime.now(),
            complexity=request.preferences.get("complexity", "moderate"),
            tags=["generated", "ai-enhanced", "rag"] if retrieved_patterns else ["generated"]
        )

        # Generate workflow DSL
        # For now, using simple workflow generator
        # TODO: Implement complex workflow generation based on LLM output
        workflow = dsl_service.generate_simple_workflow(
            description=enhanced_description,
            metadata=metadata
        )

        # Validate workflow
        is_valid, errors = dsl_service.validate_workflow(workflow)
        if not is_valid:
            logger.error(f"❌ Generated workflow validation failed: {errors}")
            raise HTTPException(
                status_code=500,
                detail=f"Generated workflow is invalid: {', '.join(errors)}"
            )

        generation_time = time.time() - start_time

        # Calculate quality score based on RAG usage and validation
        quality_score = 85.0 if retrieved_patterns else 75.0

        logger.info(f"✅ Full workflow generated successfully in {generation_time:.2f}s")

        return WorkflowResponse(
            workflow=workflow,
            metadata=metadata,
            quality_score=quality_score,
            suggestions=[
                "Workflow enhanced with knowledge base patterns" if retrieved_patterns else "Consider adding reference patterns",
                "Review variable connections",
                "Add comprehensive error handling"
            ],
            generation_time=generation_time
        )

    except Exception as e:
        logger.error(f"❌ Failed to generate full workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_generation_status() -> Dict[str, Any]:
    """Get the status of generation services."""
    return {
        "llm_service": llm_service.get_status(),
        "vector_store": vector_store.get_collection_stats(),
        "dsl_service": {"available": True}
    }