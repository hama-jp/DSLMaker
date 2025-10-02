"""
Unit tests for ArchitectureAgent
Test the agent's ability to design workflow architecture
"""

import pytest
from app.agents.architecture_agent import ArchitectureAgent
from app.graph.state import WorkflowGenerationState, ClarifiedRequirements


@pytest.fixture
def agent():
    """Create an ArchitectureAgent instance"""
    return ArchitectureAgent()


@pytest.fixture
def base_state():
    """Create a base workflow generation state"""
    return {
        "user_request": "",
        "preferences": None,
        "requirements": None,
        "architecture": None,
        "configured_nodes": [],
        "configured_edges": [],
        "quality_report": None,
        "final_dsl": None,
        "iterations": 0,
        "max_iterations": 3,
        "current_agent": "Test",
        "retrieved_patterns": [],
        "error_history": []
    }


class TestArchitectureAgent:
    """Test suite for ArchitectureAgent"""

    @pytest.mark.asyncio
    async def test_simple_qa_architecture(self, agent, base_state):
        """Test: Simple Q&A chatbot architecture"""
        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Q&A Chatbot",
            required_capabilities=["llm"],
            input_data={"type": "text", "source": "user"},
            expected_output={"type": "text", "format": "answer"},
            business_logic=["answer user questions using LLM"],
            integrations=["gpt-4"],
            constraints=["use GPT-4"],
            confidence_score=0.9
        )

        result = await agent.execute(base_state)

        assert result["architecture"] is not None
        arch = result["architecture"]

        # Should include start, llm, end
        assert "start" in arch.node_types
        assert "llm" in arch.node_types
        assert "end" in arch.node_types or "answer" in arch.node_types

        # Should have edges connecting them
        assert len(arch.edge_structure) >= 2

        # Should be simple complexity
        assert arch.complexity in ["simple", "moderate"]

    @pytest.mark.asyncio
    async def test_rag_architecture(self, agent, base_state):
        """Test: RAG workflow architecture"""
        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Document Q&A with knowledge base",
            required_capabilities=["knowledge-retrieval", "llm"],
            input_data={"type": "text", "description": "User query"},
            expected_output={"type": "text", "description": "Answer from documents"},
            business_logic=["Search knowledge base for relevant documents", "Use LLM to synthesize an answer from documents"],
            integrations=["knowledge-base", "llm"],
            constraints=[],
            confidence_score=0.9
        )

        result = await agent.execute(base_state)

        assert result["architecture"] is not None
        arch = result["architecture"]

        # Should include knowledge retrieval and LLM
        assert "knowledge-retrieval" in arch.node_types or "document-extractor" in arch.node_types
        assert "llm" in arch.node_types

        # Knowledge retrieval should come before LLM
        node_sequence = arch.node_types
        if "knowledge-retrieval" in node_sequence and "llm" in node_sequence:
            kr_idx = node_sequence.index("knowledge-retrieval")
            llm_idx = node_sequence.index("llm")
            assert kr_idx < llm_idx, "Knowledge retrieval should come before LLM"

    @pytest.mark.asyncio
    async def test_iteration_architecture(self, agent, base_state):
        """Test: Workflow with iteration"""
        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Process list of items",
            required_capabilities=["iteration", "llm"],
            input_data={"type": "array", "description": "List of items to process"},
            expected_output={"type": "array", "description": "Processed items"},
            business_logic=["Iterate over each item", "Apply LLM processing to each item"],
            integrations=["llm"],
            constraints=[],
            confidence_score=0.9
        )

        result = await agent.execute(base_state)

        assert result["architecture"] is not None
        arch = result["architecture"]

        # Should include iteration
        assert "iteration" in arch.node_types

        # Should mark has_iteration
        if hasattr(arch, 'has_iteration'):
            assert arch.has_iteration == True

        # Iteration should be in the middle (not first or last)
        iter_idx = arch.node_types.index("iteration")
        assert 0 < iter_idx < len(arch.node_types) - 1

    @pytest.mark.asyncio
    async def test_conditional_architecture(self, agent, base_state):
        """Test: Workflow with conditional branching"""
        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Route messages based on type",
            required_capabilities=["if-else", "llm"],
            input_data={"type": "text", "description": "Input message"},
            expected_output={"type": "text", "description": "Processed message"},
            business_logic=["Classify message type", "Route to different branches based on type"],
            integrations=["llm"],
            constraints=[],
            confidence_score=0.9
        )

        result = await agent.execute(base_state)

        assert result["architecture"] is not None
        arch = result["architecture"]

        # Should include conditional logic
        assert "if-else" in arch.node_types or "question-classifier" in arch.node_types

        # Should have multiple branches in edge structure
        edges = arch.edge_structure
        # Check for branching (one node connects to multiple nodes)
        source_counts = {}
        for edge in edges:
            source = edge.get("from", "")
            source_counts[source] = source_counts.get(source, 0) + 1

        has_branching = any(count > 1 for count in source_counts.values())
        assert has_branching, "Should have branching in edge structure"

    @pytest.mark.asyncio
    async def test_tool_integration_architecture(self, agent, base_state):
        """Test: Workflow with external tool"""
        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Search web and summarize",
            required_capabilities=["tool", "llm"],
            input_data={"type": "text", "description": "Search query"},
            expected_output={"type": "text", "description": "Summary of search results"},
            business_logic=["Use a search tool to find information", "Summarize results with an LLM"],
            integrations=["tavily-search", "llm"],
            constraints=["use Tavily search"],
            confidence_score=0.9
        )

        result = await agent.execute(base_state)

        assert result["architecture"] is not None
        arch = result["architecture"]

        # Should include tool node
        assert "tool" in arch.node_types

        # Tool should come before LLM (to provide data)
        if "tool" in arch.node_types and "llm" in arch.node_types:
            tool_idx = arch.node_types.index("tool")
            llm_idx = arch.node_types.index("llm")
            assert tool_idx < llm_idx, "Tool should come before LLM"

    @pytest.mark.asyncio
    async def test_complex_multi_step_architecture(self, agent, base_state):
        """Test: Complex multi-step workflow"""
        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Document processing pipeline",
            required_capabilities=["document-extractor", "knowledge-retrieval", "llm", "template-transform"],
            input_data={"type": "document", "description": "Input document"},
            expected_output={"type": "text", "description": "Formatted report"},
            business_logic=[
                "Extract text from the document",
                "Search a knowledge base for related information",
                "Generate a report with an LLM",
                "Format the output as markdown"
            ],
            integrations=["document-extractor", "knowledge-base", "llm", "template-transform"],
            constraints=[],
            confidence_score=0.95
        )

        result = await agent.execute(base_state)

        assert result["architecture"] is not None
        arch = result["architecture"]

        # Should include multiple node types
        assert len(arch.node_types) >= 5

        # Should be marked as complex
        assert arch.complexity in ["moderate", "complex"]

        # Should have reasonable estimated node count
        assert 5 <= arch.estimated_nodes <= 15

    @pytest.mark.asyncio
    async def test_edge_connectivity(self, agent, base_state):
        """Test: Edges properly connect nodes"""
        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Simple Q&A",
            required_capabilities=["llm"],
            input_data={"type": "text"},
            expected_output={"type": "text"},
            business_logic=["Answer questions"],
            integrations=["llm"],
            constraints=[],
            confidence_score=0.9
        )

        result = await agent.execute(base_state)

        assert result["architecture"] is not None
        arch = result["architecture"]

        # Get all nodes from node_types
        node_types_set = set(arch.node_types)

        # Check edges reference valid nodes
        for edge in arch.edge_structure:
            from_node = edge.get("from", "")
            to_node = edge.get("to", "")

            # Edges should reference node types in the architecture
            assert from_node in node_types_set, f"Edge 'from' node {from_node} not in architecture"
            assert to_node in node_types_set, f"Edge 'to' node {to_node} not in architecture"

    @pytest.mark.asyncio
    async def test_no_orphan_nodes(self, agent, base_state):
        """Test: No orphan nodes in architecture"""
        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Simple chatbot",
            required_capabilities=["llm"],
            input_data={"type": "text"},
            expected_output={"type": "text"},
            business_logic=["Chat with user"],
            integrations=["llm"],
            constraints=[],
            confidence_score=0.9
        )

        result = await agent.execute(base_state)

        assert result["architecture"] is not None
        arch = result["architecture"]

        # Build connectivity graph
        connected_nodes = set()
        for edge in arch.edge_structure:
            connected_nodes.add(edge.get("from", ""))
            connected_nodes.add(edge.get("to", ""))

        # Check all nodes (except start/end) are connected
        node_types_set = set(arch.node_types)
        # start node may not have incoming edge, end node may not have outgoing edge
        # but they should still be in edges
        assert len(connected_nodes) >= len(node_types_set) - 2, \
            f"Too many orphan nodes. Connected: {connected_nodes}, All: {node_types_set}"

    @pytest.mark.asyncio
    async def test_pattern_selection(self, agent, base_state):
        """Test: Agent selects appropriate pattern"""
        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Q&A Chatbot",
            required_capabilities=["llm"],
            input_data={"type": "text"},
            expected_output={"type": "text"},
            business_logic=["Answer questions"],
            integrations=["llm"],
            constraints=[],
            confidence_score=0.9
        )

        result = await agent.execute(base_state)

        assert result["architecture"] is not None
        arch = result["architecture"]

        # Should have pattern information
        assert hasattr(arch, 'pattern_id') or hasattr(arch, 'pattern_name')

        # Should have reasoning
        if hasattr(arch, 'reasoning'):
            assert len(arch.reasoning) > 0, "Should provide reasoning for architecture choices"

    @pytest.mark.asyncio
    async def test_node_count_estimation(self, agent, base_state):
        """Test: Estimated node count is reasonable"""
        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Simple workflow",
            required_capabilities=["llm"],
            input_data={"type": "text"},
            expected_output={"type": "text"},
            business_logic=["Process input"],
            integrations=["llm"],
            constraints=[],
            confidence_score=0.9
        )

        result = await agent.execute(base_state)

        assert result["architecture"] is not None
        arch = result["architecture"]

        # Estimated nodes should match actual node_types length (±2)
        actual_count = len(arch.node_types)
        estimated_count = arch.estimated_nodes

        diff = abs(actual_count - estimated_count)
        assert diff <= 2, f"Estimated {estimated_count} but designed {actual_count} nodes"


class TestArchitectureAgentMetrics:
    """Test performance metrics for ArchitectureAgent"""

    @pytest.mark.asyncio
    async def test_latency(self, agent, base_state):
        """Test: Agent response time"""
        import time

        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Q&A bot",
            required_capabilities=["llm"],
            input_data={"type": "text"},
            expected_output={"type": "text"},
            business_logic=["Answer questions"],
            integrations=["llm"],
            constraints=[],
            confidence_score=0.9
        )

        start = time.time()
        result = await agent.execute(base_state)
        elapsed = time.time() - start

        # Should complete within 10 seconds
        assert elapsed < 10.0, f"Agent took {elapsed:.2f}s (expected < 10s)"

    @pytest.mark.asyncio
    async def test_output_structure(self, agent, base_state):
        """Test: Architecture object has correct structure"""
        base_state["requirements"] = ClarifiedRequirements(
            business_intent="Simple bot",
            required_capabilities=["llm"],
            input_data={"type": "text"},
            expected_output={"type": "text"},
            business_logic=["Process input"],
            integrations=["llm"],
            constraints=[],
            confidence_score=0.9
        )

        result = await agent.execute(base_state)

        assert result["architecture"] is not None
        arch = result["architecture"]

        # Check required fields
        assert hasattr(arch, 'node_types')
        assert hasattr(arch, 'edge_structure')
        assert hasattr(arch, 'complexity')
        assert hasattr(arch, 'estimated_nodes')

        # Check types
        assert isinstance(arch.node_types, list)
        assert isinstance(arch.edge_structure, list)
        assert isinstance(arch.complexity, str)
        assert isinstance(arch.estimated_nodes, int)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])