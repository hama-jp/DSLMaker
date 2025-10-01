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
from app.services.recommendation_service import recommendation_service
from app.graph.workflow_graph import workflow_graph
# from app.utils.dify_converter_v2 import DifyConverter  # Not used yet

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

        # Use intelligent pattern recommendation if RAG is enabled
        retrieved_patterns = []
        recommended_pattern_names = []
        if request.use_rag and vector_store._initialized:
            logger.info("🔍 Getting pattern recommendations...")
            recommendations = await recommendation_service.recommend_patterns(
                description=request.description,
                n_results=3,
                complexity=request.preferences.get("complexity"),
                use_llm_analysis=True
            )
            retrieved_patterns = [p['content'] for p in recommendations]
            recommended_pattern_names = [p['metadata']['name'] for p in recommendations]
            logger.info(f"📚 Recommended patterns: {', '.join(recommended_pattern_names)}")

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

        # Build suggestions
        suggestions = [
            "Review variable connections",
            "Add comprehensive error handling"
        ]
        if retrieved_patterns:
            suggestions.insert(0, f"Based on patterns: {', '.join(recommended_pattern_names)}")
        else:
            suggestions.insert(0, "Consider adding reference patterns")

        return WorkflowResponse(
            workflow=workflow,
            metadata=metadata,
            quality_score=quality_score,
            suggestions=suggestions,
            generation_time=generation_time
        )

    except Exception as e:
        logger.error(f"❌ Failed to generate full workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/multi-agent", response_model=WorkflowResponse)
async def generate_multi_agent_workflow(request: WorkflowRequest) -> WorkflowResponse:
    """
    Generate workflow using multi-agent LangGraph system.

    This endpoint uses a sophisticated multi-agent system:
    1. Requirements Agent - Analyzes and structures requirements
    2. Architecture Agent - Designs optimal workflow architecture
    3. Configuration Agent - Configures all nodes with proper settings
    4. Quality Agent - Validates and scores workflow quality
    5. Iterative refinement if quality is insufficient

    This is the recommended endpoint for production use.
    """
    start_time = time.time()

    try:
        logger.info(f"🤖 Starting multi-agent workflow generation: {request.description[:50]}...")

        # Initialize state
        initial_state = {
            "user_request": request.description,
            "preferences": request.preferences,
            "requirements": None,
            "architecture": None,
            "configured_nodes": [],
            "configured_edges": [],
            "quality_report": None,
            "final_dsl": None,
            "iterations": 0,
            "max_iterations": request.preferences.get("max_iterations", 3) if request.preferences else 3,
            "current_agent": None,
            "retrieved_patterns": [],
            "error_history": []
        }

        # Execute LangGraph multi-agent workflow
        logger.info("🚀 Executing LangGraph workflow...")
        result = await workflow_graph.ainvoke(initial_state)

        generation_time = time.time() - start_time

        # Extract results
        final_dsl = result.get("final_dsl")
        quality_report = result.get("quality_report")
        requirements = result.get("requirements")
        architecture = result.get("architecture")

        if not final_dsl:
            raise ValueError("Multi-agent workflow failed to generate DSL")

        # Create metadata
        metadata = WorkflowMetadata(
            name=final_dsl["app"]["name"],
            description=final_dsl["app"]["description"],
            created_at=datetime.now(),
            complexity=architecture.complexity if architecture else "moderate",
            tags=["generated", "multi-agent", "ai-enhanced"],
            node_count=len(result.get("configured_nodes", [])),
            edge_count=len(result.get("configured_edges", [])),
            iteration_count=result.get("iterations", 0)
        )

        # Build suggestions from quality report
        suggestions = []
        if quality_report:
            suggestions = quality_report.recommendations
            if quality_report.issues:
                suggestions.insert(0, f"⚠️ {len(quality_report.issues)} quality issues detected - review recommended")

        # Add pattern information
        if architecture:
            suggestions.insert(0, f"Based on pattern: {architecture.pattern_name}")

        logger.info(
            f"✅ Multi-agent workflow generated successfully\n"
            f"   Generation Time: {generation_time:.2f}s\n"
            f"   Iterations: {result.get('iterations', 0)}\n"
            f"   Nodes: {len(result.get('configured_nodes', []))}\n"
            f"   Quality Score: {quality_report.overall_score if quality_report else 'N/A'}\n"
            f"   Pattern: {architecture.pattern_name if architecture else 'N/A'}"
        )

        return WorkflowResponse(
            workflow=final_dsl,
            metadata=metadata,
            quality_score=quality_report.overall_score if quality_report else 75.0,
            suggestions=suggestions,
            generation_time=generation_time
        )

    except Exception as e:
        logger.error(f"❌ Multi-agent workflow generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Multi-agent generation failed: {str(e)}"
        )


@router.get("/status")
async def get_generation_status() -> Dict[str, Any]:
    """Get the status of generation services."""
    return {
        "llm_service": llm_service.get_status(),
        "vector_store": vector_store.get_collection_stats(),
        "dsl_service": {"available": True},
        "multi_agent": {
            "available": True,
            "agents": ["requirements", "architecture", "configuration", "quality"],
            "pattern_library_size": vector_store.get_collection_stats().get("total_patterns", 0)
        }
    }


@router.get("/usage")
async def get_token_usage() -> Dict[str, Any]:
    """Get detailed token usage statistics."""
    return {
        "usage_stats": llm_service.get_usage_stats(),
        "service": "DSLMaker v2 Backend"
    }


@router.post("/usage/reset")
async def reset_token_usage() -> Dict[str, str]:
    """Reset token usage statistics."""
    llm_service.reset_usage_stats()
    return {
        "status": "success",
        "message": "Token usage statistics have been reset"
    }


@router.post("/convert/dify")
async def convert_workflow_to_dify(workflow: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert DSLMaker workflow format to Dify-compatible format.

    This endpoint takes a workflow in DSLMaker format (with 'metadata' and 'workflow' keys)
    and converts it to Dify's DSL format which can be directly imported into Dify.

    Args:
        workflow: Workflow in DSLMaker format

    Returns:
        Workflow in Dify-compatible format
    """
    try:
        logger.info("🔄 Converting workflow to Dify format...")

        # Validate input format
        if "metadata" not in workflow or "workflow" not in workflow:
            raise HTTPException(
                status_code=400,
                detail="Invalid workflow format. Expected 'metadata' and 'workflow' keys."
            )

        # Convert to Dify format
        dify_workflow = convert_to_dify_format(workflow)

        logger.info("✅ Successfully converted workflow to Dify format")

        return {
            "status": "success",
            "data": dify_workflow,
            "format": "dify-v0.4.0"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to convert workflow to Dify format: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Conversion failed: {str(e)}"
        )