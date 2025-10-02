"""
Integration Tests for LangGraph Workflow
Tests end-to-end workflow generation
"""

import pytest
import time
from unittest.mock import AsyncMock

from app.graph.workflow_graph import workflow_graph
from app.services.vector_store import vector_store
from app.services.llm_service import llm_service


@pytest.fixture(scope="module", autouse=True)
async def initialize_services():
    """Initialize services once for all tests."""
    if not vector_store._initialized:
        await vector_store.initialize()
    if not llm_service._initialized:
        await llm_service.initialize()
    yield
    # Cleanup if needed


class TestWorkflowGeneration:
    """Test complete workflow generation pipeline."""

    @pytest.mark.asyncio
    async def test_simple_workflow_generation(self):
        """Test generation of a simple linear workflow."""
        initial_state = {
            "user_request": "Create a simple workflow that greets the user by name",
            "preferences": {"complexity": "simple"},
            "requirements": None,
            "architecture": None,
            "configured_nodes": [],
            "configured_edges": [],
            "quality_report": None,
            "final_dsl": None,
            "iterations": 0,
            "max_iterations": 1,
            "current_agent": None,
            "retrieved_patterns": [],
            "error_history": []
        }

        start_time = time.time()
        result = await workflow_graph.ainvoke(initial_state)
        duration = time.time() - start_time

        # Check execution completed
        assert result is not None
        print(f"\nGeneration completed in {duration:.2f}s")

        # Check requirements were analyzed
        assert result["requirements"] is not None
        assert result["requirements"].business_intent
        assert result["requirements"].confidence_score > 0

        # Check architecture was designed
        assert result["architecture"] is not None
        assert result["architecture"].pattern_id
        assert len(result["architecture"].node_types) > 0

        # Check nodes were configured
        assert len(result["configured_nodes"]) >= 3  # At least start, llm, end
        assert len(result["configured_edges"]) >= 2

        # Check quality was assessed
        assert result["quality_report"] is not None
        assert result["quality_report"].overall_score >= 0

        # Check final DSL was generated
        assert result["final_dsl"] is not None
        assert "app" in result["final_dsl"]
        assert "workflow" in result["final_dsl"]
        assert "graph" in result["final_dsl"]["workflow"]

        # Check no critical errors
        assert len(result["error_history"]) == 0

        print(f"Quality Score: {result['quality_report'].overall_score:.1f}/100")
        print(f"Nodes: {len(result['configured_nodes'])}")
        print(f"Pattern: {result['architecture'].pattern_name}")

    @pytest.mark.asyncio
    async def test_moderate_workflow_generation(self):
        """Test generation of a moderate complexity workflow."""
        initial_state = {
            "user_request": "Create a customer support system that classifies messages by urgency and routes to appropriate handlers",
            "preferences": {"complexity": "moderate"},
            "requirements": None,
            "architecture": None,
            "configured_nodes": [],
            "configured_edges": [],
            "quality_report": None,
            "final_dsl": None,
            "iterations": 0,
            "max_iterations": 2,
            "current_agent": None,
            "retrieved_patterns": [],
            "error_history": []
        }

        start_time = time.time()
        result = await workflow_graph.ainvoke(initial_state)
        duration = time.time() - start_time

        # Check execution completed
        assert result is not None
        print(f"\nGeneration completed in {duration:.2f}s")

        # Check workflow complexity
        assert result["architecture"].complexity in ["simple", "moderate", "complex"]
        assert len(result["configured_nodes"]) >= 3  # More complex structure

        # Check quality score is reasonable
        assert result["quality_report"].overall_score >= 70  # Should be decent quality

        # Check final DSL structure
        final_dsl = result["final_dsl"]
        assert len(final_dsl["workflow"]["graph"]["nodes"]) >= 3
        assert len(final_dsl["workflow"]["graph"]["edges"]) >= 2

        print(f"Quality Score: {result['quality_report'].overall_score:.1f}/100")
        print(f"Nodes: {len(result['configured_nodes'])}")
        print(f"Pattern: {result['architecture'].pattern_name}")
        print(f"Complexity: {result['architecture'].complexity}")

    @pytest.mark.asyncio
    async def test_rag_integration(self, monkeypatch):
        """Test that RAG system is being used effectively."""
        # Mock vector_store to return a pattern
        mock_pattern = [{"metadata": {"name": "RAG Pattern"}, "document": "A RAG pattern"}]
        monkeypatch.setattr(vector_store, "search_patterns", AsyncMock(return_value=mock_pattern))

        initial_state = {
            "user_request": "Create a RAG pipeline for customer service knowledge base",
            "preferences": {"complexity": "moderate"},
            "requirements": None,
            "architecture": None,
            "configured_nodes": [],
            "configured_edges": [],
            "quality_report": None,
            "final_dsl": None,
            "iterations": 0,
            "max_iterations": 2,
            "current_agent": None,
            "retrieved_patterns": [],
            "error_history": []
        }

        result = await workflow_graph.ainvoke(initial_state)

        assert len(result.get("retrieved_patterns", [])) > 0
        pattern_name = result["architecture"].pattern_name.lower()
        # This will be based on the mock, which is linear
        assert "linear" in pattern_name

        print(f"\nSelected Pattern: {result['architecture'].pattern_name}")
        print(f"Retrieved Patterns: {len(result['retrieved_patterns'])}")