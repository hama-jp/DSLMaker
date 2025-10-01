"""
Unit tests for RequirementsAgent
Test the agent's ability to extract structured requirements from natural language
"""

import pytest
from app.agents.requirements_agent import RequirementsAgent
from app.graph.state import WorkflowGenerationState


@pytest.fixture
def agent():
    """Create a RequirementsAgent instance"""
    return RequirementsAgent()


@pytest.fixture
def empty_state():
    """Create an empty workflow generation state"""
    return WorkflowGenerationState(
        user_input="",
        requirements=None,
        architecture=None,
        configured_nodes=[],
        configured_edges=[],
        quality_report=None,
        iteration_count=0,
        error_history=[],
        current_agent="Test"
    )


class TestRequirementsAgent:
    """Test suite for RequirementsAgent"""

    @pytest.mark.asyncio
    async def test_simple_qa_chatbot(self, agent, empty_state):
        """Test: Simple Q&A chatbot request"""
        empty_state["user_input"] = "Create a chatbot that answers questions using GPT-4"

        result = await agent.execute(empty_state)

        assert result["requirements"] is not None
        requirements = result["requirements"]

        # Check business intent
        assert "chatbot" in requirements.business_intent.lower() or "q&a" in requirements.business_intent.lower()

        # Check capabilities
        assert "llm" in requirements.required_capabilities

        # Check constraints mention GPT-4
        assert any("gpt-4" in c.lower() for c in requirements.constraints)

    @pytest.mark.asyncio
    async def test_rag_document_search(self, agent, empty_state):
        """Test: RAG workflow with knowledge retrieval"""
        empty_state["user_input"] = "Build a document search system that finds relevant information from uploaded PDFs"

        result = await agent.execute(empty_state)

        assert result["requirements"] is not None
        requirements = result["requirements"]

        # Should identify need for knowledge retrieval
        assert any(cap in requirements.required_capabilities for cap in ["knowledge-retrieval", "document-extractor"])

        # Should mention documents
        assert "document" in requirements.business_intent.lower()

    @pytest.mark.asyncio
    async def test_iteration_workflow(self, agent, empty_state):
        """Test: Workflow requiring iteration"""
        empty_state["user_input"] = "Process a list of customer reviews and summarize each one"

        result = await agent.execute(empty_state)

        assert result["requirements"] is not None
        requirements = result["requirements"]

        # Should identify iteration need
        assert "iteration" in requirements.required_capabilities or \
               any("list" in cap or "array" in cap for cap in requirements.required_capabilities)

        # Should identify LLM for summarization
        assert "llm" in requirements.required_capabilities

    @pytest.mark.asyncio
    async def test_conditional_workflow(self, agent, empty_state):
        """Test: Workflow with conditional logic"""
        empty_state["user_input"] = "Create a workflow that classifies support tickets and routes them to different teams"

        result = await agent.execute(empty_state)

        assert result["requirements"] is not None
        requirements = result["requirements"]

        # Should identify branching/classification need
        assert any(cap in requirements.required_capabilities for cap in ["if-else", "question-classifier"])

    @pytest.mark.asyncio
    async def test_tool_integration(self, agent, empty_state):
        """Test: Workflow requiring external tool"""
        empty_state["user_input"] = "Search the web for latest news and summarize the results"

        result = await agent.execute(empty_state)

        assert result["requirements"] is not None
        requirements = result["requirements"]

        # Should identify tool need
        assert "tool" in requirements.required_capabilities or \
               any("search" in cap or "api" in cap for cap in requirements.required_capabilities)

        # Should identify LLM for summarization
        assert "llm" in requirements.required_capabilities

    @pytest.mark.asyncio
    async def test_multi_step_workflow(self, agent, empty_state):
        """Test: Complex multi-step workflow"""
        empty_state["user_input"] = """
        Create a workflow that:
        1. Extracts text from uploaded documents
        2. Searches for related information in knowledge base
        3. Generates a comprehensive report using LLM
        4. Formats the output as markdown
        """

        result = await agent.execute(empty_state)

        assert result["requirements"] is not None
        requirements = result["requirements"]

        # Should identify multiple capabilities
        expected_caps = ["document-extractor", "knowledge-retrieval", "llm", "template-transform"]
        found_caps = set(requirements.required_capabilities)

        # At least 3 of the expected capabilities should be identified
        matching = sum(1 for cap in expected_caps if cap in found_caps)
        assert matching >= 3, f"Expected at least 3 capabilities, found: {found_caps}"

    @pytest.mark.asyncio
    async def test_empty_input(self, agent, empty_state):
        """Test: Empty or invalid input"""
        empty_state["user_input"] = ""

        result = await agent.execute(empty_state)

        # Should handle gracefully - either return error or basic requirements
        assert "requirements" in result or "error_history" in result

    @pytest.mark.asyncio
    async def test_vague_input(self, agent, empty_state):
        """Test: Vague user input"""
        empty_state["user_input"] = "I want to use AI for my business"

        result = await agent.execute(empty_state)

        assert result["requirements"] is not None
        requirements = result["requirements"]

        # Should still extract something useful
        assert len(requirements.business_intent) > 0
        assert len(requirements.required_capabilities) > 0

    @pytest.mark.asyncio
    async def test_technical_input(self, agent, empty_state):
        """Test: Technical user input with specific node types"""
        empty_state["user_input"] = "I need a workflow with start -> llm -> knowledge-retrieval -> llm -> end"

        result = await agent.execute(empty_state)

        assert result["requirements"] is not None
        requirements = result["requirements"]

        # Should identify explicit node types
        assert "llm" in requirements.required_capabilities
        assert "knowledge-retrieval" in requirements.required_capabilities

    @pytest.mark.asyncio
    async def test_output_format(self, agent, empty_state):
        """Test: Requirements object has correct structure"""
        empty_state["user_input"] = "Create a simple Q&A bot"

        result = await agent.execute(empty_state)

        assert result["requirements"] is not None
        requirements = result["requirements"]

        # Check required fields
        assert hasattr(requirements, 'business_intent')
        assert hasattr(requirements, 'required_capabilities')
        assert hasattr(requirements, 'constraints')
        assert hasattr(requirements, 'input_format')
        assert hasattr(requirements, 'output_format')

        # Check types
        assert isinstance(requirements.business_intent, str)
        assert isinstance(requirements.required_capabilities, list)
        assert isinstance(requirements.constraints, list)


class TestRequirementsAgentMetrics:
    """Test performance metrics for RequirementsAgent"""

    @pytest.mark.asyncio
    async def test_latency(self, agent, empty_state):
        """Test: Agent response time"""
        import time

        empty_state["user_input"] = "Create a chatbot"

        start = time.time()
        result = await agent.execute(empty_state)
        elapsed = time.time() - start

        # Should complete within 5 seconds
        assert elapsed < 5.0, f"Agent took {elapsed:.2f}s (expected < 5s)"

    @pytest.mark.asyncio
    async def test_consistency(self, agent, empty_state):
        """Test: Agent produces consistent results"""
        empty_state["user_input"] = "Create a chatbot that answers questions"

        # Run twice
        result1 = await agent.execute(empty_state.copy())
        result2 = await agent.execute(empty_state.copy())

        # Core capabilities should be the same
        caps1 = set(result1["requirements"].required_capabilities)
        caps2 = set(result2["requirements"].required_capabilities)

        # At least 80% overlap in capabilities
        overlap = len(caps1 & caps2) / max(len(caps1), len(caps2))
        assert overlap >= 0.8, f"Consistency only {overlap*100:.0f}% (expected >= 80%)"


# Test fixtures for common scenarios
@pytest.fixture
def qa_bot_input():
    return "Create a Q&A chatbot using GPT-4"


@pytest.fixture
def rag_input():
    return "Build a document search system with knowledge base"


@pytest.fixture
def iteration_input():
    return "Process a list of items and transform each one"


@pytest.fixture
def conditional_input():
    return "Route messages to different handlers based on content type"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
