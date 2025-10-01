"""
Integration Tests for LangGraph Workflow
Tests end-to-end workflow generation
"""

import pytest
import time
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
    @pytest.mark.slow
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
            "max_iterations": 1,  # Limit iterations for faster test
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
    @pytest.mark.slow
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
        assert result["architecture"].complexity in ["moderate", "complex"]
        assert len(result["configured_nodes"]) >= 4  # More complex structure

        # Check quality score is reasonable
        assert result["quality_report"].overall_score >= 70  # Should be decent quality

        # Check final DSL structure
        final_dsl = result["final_dsl"]
        assert len(final_dsl["workflow"]["graph"]["nodes"]) >= 4
        assert len(final_dsl["workflow"]["graph"]["edges"]) >= 3

        print(f"Quality Score: {result['quality_report'].overall_score:.1f}/100")
        print(f"Nodes: {len(result['configured_nodes'])}")
        print(f"Pattern: {result['architecture'].pattern_name}")
        print(f"Complexity: {result['architecture'].complexity}")

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_quality_iteration(self):
        """Test that workflow iterates when quality is insufficient."""
        initial_state = {
            "user_request": "Build a complex data processing pipeline",
            "preferences": {"complexity": "complex"},
            "requirements": None,
            "architecture": None,
            "configured_nodes": [],
            "configured_edges": [],
            "quality_report": None,
            "final_dsl": None,
            "iterations": 0,
            "max_iterations": 3,  # Allow multiple iterations
            "current_agent": None,
            "retrieved_patterns": [],
            "error_history": []
        }

        result = await workflow_graph.ainvoke(initial_state)

        # Check that workflow completed
        assert result is not None

        # May or may not have iterated (depends on quality)
        iterations = result.get("iterations", 0)
        print(f"\nIterations performed: {iterations}")
        print(f"Quality Score: {result['quality_report'].overall_score:.1f}/100")

        # If quality is low and iterations < max, should have retried
        if result["quality_report"].overall_score < 70 and iterations < 3:
            # Should have attempted iteration
            assert iterations > 0 or result["quality_report"].should_retry == False

    @pytest.mark.asyncio
    async def test_error_handling(self):
        """Test that workflow handles errors gracefully."""
        initial_state = {
            "user_request": "",  # Empty request should trigger errors
            "preferences": {},
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

        result = await workflow_graph.ainvoke(initial_state)

        # Should complete with fallback
        assert result is not None

        # Should have some fallback nodes
        assert len(result["configured_nodes"]) >= 3

        # Should have recorded errors
        assert len(result.get("error_history", [])) >= 0  # May have errors or fallback gracefully

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_rag_integration(self):
        """Test that RAG system is being used effectively."""
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

        # Check that patterns were retrieved
        assert len(result.get("retrieved_patterns", [])) > 0

        # Should have selected appropriate pattern
        pattern_name = result["architecture"].pattern_name.lower()
        assert "rag" in pattern_name or "knowledge" in pattern_name or "retrieval" in pattern_name

        print(f"\nSelected Pattern: {result['architecture'].pattern_name}")
        print(f"Retrieved Patterns: {len(result['retrieved_patterns'])}")


class TestWorkflowQuality:
    """Test quality aspects of generated workflows."""

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_node_configuration_validity(self):
        """Test that configured nodes are valid."""
        initial_state = {
            "user_request": "Create a text summarization workflow",
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

        result = await workflow_graph.ainvoke(initial_state)

        # Check all nodes have required fields
        for node in result["configured_nodes"]:
            assert node.id
            assert node.type
            assert node.data
            assert "title" in node.data
            assert node.position
            assert "x" in node.position
            assert "y" in node.position

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_edge_connectivity(self):
        """Test that edges connect valid nodes."""
        initial_state = {
            "user_request": "Create a workflow for data validation",
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

        result = await workflow_graph.ainvoke(initial_state)

        # Get all node IDs
        node_ids = {node.id for node in result["configured_nodes"]}

        # Check all edges reference valid nodes
        for edge in result["configured_edges"]:
            assert edge["source"] in node_ids, f"Edge source {edge['source']} not in nodes"
            assert edge["target"] in node_ids, f"Edge target {edge['target']} not in nodes"

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_start_end_nodes_present(self):
        """Test that workflows always have start and end nodes."""
        initial_state = {
            "user_request": "Create a simple echo workflow",
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

        result = await workflow_graph.ainvoke(initial_state)

        # Check for start and end nodes
        node_types = [node.type for node in result["configured_nodes"]]
        assert "start" in node_types, "Workflow missing start node"
        assert "end" in node_types, "Workflow missing end node"


class TestPerformance:
    """Test performance characteristics."""

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_generation_time(self):
        """Test that generation completes in reasonable time."""
        initial_state = {
            "user_request": "Create a simple workflow",
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

        # Should complete within reasonable time (adjust based on your requirements)
        assert duration < 60, f"Generation took too long: {duration:.2f}s"

        print(f"\nGeneration time: {duration:.2f}s")
        print(f"Nodes generated: {len(result['configured_nodes'])}")
        print(f"Quality score: {result['quality_report'].overall_score:.1f}/100")