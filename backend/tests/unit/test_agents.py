"""
Unit Tests for Multi-Agent System
Tests individual agent functionality
"""

import pytest
from app.graph.state import (
    WorkflowGenerationState,
    ClarifiedRequirements,
    WorkflowArchitecture,
    ConfiguredNode,
    QualityAssessment
)
from app.agents import (
    RequirementsAgent,
    ArchitectureAgent,
    ConfigurationAgent,
    QualityAgent
)


@pytest.fixture
def simple_state():
    """Create a simple test state."""
    return {
        "user_request": "Create a workflow that translates text from English to Spanish",
        "preferences": {"complexity": "simple"},
        "requirements": None,
        "architecture": None,
        "configured_nodes": [],
        "configured_edges": [],
        "quality_report": None,
        "final_dsl": None,
        "iterations": 0,
        "max_iterations": 3,
        "current_agent": None,
        "retrieved_patterns": [],
        "error_history": []
    }


@pytest.fixture
def state_with_requirements():
    """Create state with requirements already analyzed."""
    return {
        "user_request": "Translate text from English to Spanish",
        "preferences": {"complexity": "simple"},
        "requirements": ClarifiedRequirements(
            business_intent="Translate text from English to Spanish",
            required_capabilities=["llm", "translation"],
            input_data={"type": "string", "description": "English text"},
            expected_output={"type": "string", "description": "Spanish translation"},
            business_logic=["Receive English text", "Translate to Spanish"],
            integrations=["Translation API"],
            performance_requirements={},
            constraints=[],
            confidence_score=0.9
        ),
        "architecture": None,
        "configured_nodes": [],
        "configured_edges": [],
        "quality_report": None,
        "final_dsl": None,
        "iterations": 0,
        "max_iterations": 3,
        "current_agent": None,
        "retrieved_patterns": [],
        "error_history": []
    }


@pytest.fixture
def state_with_architecture():
    """Create state with architecture designed."""
    requirements = ClarifiedRequirements(
        business_intent="Translate text from English to Spanish",
        required_capabilities=["llm", "translation"],
        input_data={"type": "string", "description": "English text"},
        expected_output={"type": "string", "description": "Spanish translation"},
        business_logic=["Receive English text", "Translate to Spanish"],
        integrations=["Translation API"],
        performance_requirements={},
        constraints=[],
        confidence_score=0.9
    )

    architecture = WorkflowArchitecture(
        pattern_id="pattern_linear_001",
        pattern_name="Linear Processing",
        node_types=["start", "http-request", "end"],
        edge_structure=[
            {"from": "start", "to": "http_request"},
            {"from": "http_request", "to": "end"}
        ],
        complexity="simple",
        estimated_nodes=3,
        reasoning="Simple linear workflow for translation"
    )

    return {
        "user_request": "Translate text from English to Spanish",
        "preferences": {"complexity": "simple"},
        "requirements": requirements,
        "architecture": architecture,
        "configured_nodes": [],
        "configured_edges": [],
        "quality_report": None,
        "final_dsl": None,
        "iterations": 0,
        "max_iterations": 3,
        "current_agent": None,
        "retrieved_patterns": [],
        "error_history": []
    }


class TestRequirementsAgent:
    """Test Requirements Agent functionality."""

    @pytest.mark.asyncio
    async def test_agent_initialization(self):
        """Test agent initializes correctly."""
        agent = RequirementsAgent()
        assert agent.name == "Requirements Agent"
        assert agent.llm is None  # Not initialized yet

    @pytest.mark.asyncio
    async def test_requirements_extraction(self, simple_state):
        """Test requirements extraction from user request."""
        agent = RequirementsAgent()
        result = await agent.execute(simple_state)

        # Check that requirements were created
        assert "requirements" in result
        requirements = result["requirements"]

        # Check requirements structure
        assert isinstance(requirements, ClarifiedRequirements)
        assert requirements.business_intent
        assert requirements.confidence_score >= 0.0
        assert requirements.confidence_score <= 1.0
        assert len(requirements.business_logic) > 0

    @pytest.mark.asyncio
    async def test_fallback_on_error(self, simple_state):
        """Test that agent has fallback on error."""
        agent = RequirementsAgent()

        # Create invalid state
        invalid_state = simple_state.copy()
        invalid_state["user_request"] = ""

        result = await agent.execute(invalid_state)

        # Should still return requirements (fallback)
        assert "requirements" in result
        assert result["requirements"] is not None


class TestArchitectureAgent:
    """Test Architecture Agent functionality."""

    @pytest.mark.asyncio
    async def test_agent_initialization(self):
        """Test agent initializes correctly."""
        agent = ArchitectureAgent()
        assert agent.name == "Architecture Agent"

    @pytest.mark.asyncio
    async def test_architecture_design(self, state_with_requirements):
        """Test architecture design from requirements."""
        agent = ArchitectureAgent()
        result = await agent.execute(state_with_requirements)

        # Check that architecture was created
        assert "architecture" in result
        architecture = result["architecture"]

        # Check architecture structure
        assert isinstance(architecture, WorkflowArchitecture)
        assert architecture.pattern_id
        assert architecture.pattern_name
        assert len(architecture.node_types) > 0
        assert architecture.estimated_nodes > 0
        assert architecture.complexity in ["simple", "moderate", "complex"]

    @pytest.mark.asyncio
    async def test_missing_requirements_error(self, simple_state):
        """Test that agent requires requirements."""
        agent = ArchitectureAgent()

        with pytest.raises(ValueError, match="Requirements must be analyzed"):
            await agent.execute(simple_state)


class TestConfigurationAgent:
    """Test Configuration Agent functionality."""

    @pytest.mark.asyncio
    async def test_agent_initialization(self):
        """Test agent initializes correctly."""
        agent = ConfigurationAgent()
        assert agent.name == "Configuration Agent"

    @pytest.mark.asyncio
    async def test_node_configuration(self, state_with_architecture):
        """Test node configuration from architecture."""
        agent = ConfigurationAgent()
        result = await agent.execute(state_with_architecture)

        # Check that nodes were configured
        assert "configured_nodes" in result
        assert "configured_edges" in result

        nodes = result["configured_nodes"]
        edges = result["configured_edges"]

        # Check nodes structure
        assert len(nodes) > 0
        for node in nodes:
            assert isinstance(node, ConfiguredNode)
            assert node.id
            assert node.type
            assert node.data
            assert "title" in node.data

        # Check edges structure
        assert len(edges) > 0
        for edge in edges:
            assert "id" in edge
            assert "source" in edge
            assert "target" in edge

    @pytest.mark.asyncio
    async def test_fallback_nodes(self, state_with_architecture):
        """Test that agent creates fallback nodes on error."""
        agent = ConfigurationAgent()

        # Simulate LLM failure by using invalid state
        invalid_state = state_with_architecture.copy()
        invalid_state["architecture"] = None

        with pytest.raises(ValueError):
            await agent.execute(invalid_state)


class TestQualityAgent:
    """Test Quality Agent functionality."""

    @pytest.mark.asyncio
    async def test_agent_initialization(self):
        """Test agent initializes correctly."""
        agent = QualityAgent()
        assert agent.name == "Quality Assurance Agent"

    @pytest.mark.asyncio
    async def test_quality_assessment(self, state_with_architecture):
        """Test quality assessment of configured workflow."""
        # First configure the workflow
        config_agent = ConfigurationAgent()
        config_result = await config_agent.execute(state_with_architecture)

        # Update state with configured nodes
        state_with_nodes = state_with_architecture.copy()
        state_with_nodes.update(config_result)

        # Run quality assessment
        quality_agent = QualityAgent()
        result = await quality_agent.execute(state_with_nodes)

        # Check quality report
        assert "quality_report" in result
        report = result["quality_report"]

        assert isinstance(report, QualityAssessment)
        assert report.overall_score >= 0
        assert report.overall_score <= 100
        assert report.completeness_score >= 0
        assert report.correctness_score >= 0
        assert report.best_practices_score >= 0
        assert isinstance(report.issues, list)
        assert isinstance(report.recommendations, list)
        assert isinstance(report.should_retry, bool)

    @pytest.mark.asyncio
    async def test_quality_scoring_dimensions(self, state_with_architecture):
        """Test that quality assessment covers all dimensions."""
        # Configure workflow
        config_agent = ConfigurationAgent()
        config_result = await config_agent.execute(state_with_architecture)

        state_with_nodes = state_with_architecture.copy()
        state_with_nodes.update(config_result)

        # Assess quality
        quality_agent = QualityAgent()
        result = await quality_agent.execute(state_with_nodes)
        report = result["quality_report"]

        # Check all quality dimensions are scored
        assert report.completeness_score is not None
        assert report.correctness_score is not None
        assert report.best_practices_score is not None

        # Overall score should be within range
        assert 0 <= report.overall_score <= 100

    @pytest.mark.asyncio
    async def test_requires_complete_workflow(self, simple_state):
        """Test that agent requires complete workflow."""
        quality_agent = QualityAgent()

        # Execute with incomplete state should raise error
        with pytest.raises(ValueError, match="Complete workflow must be generated"):
            await quality_agent.execute(simple_state)