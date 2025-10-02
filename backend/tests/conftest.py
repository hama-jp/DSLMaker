import os
import pytest
import json
from unittest.mock import MagicMock, AsyncMock

# Set a dummy API key BEFORE any application modules are imported.
os.environ["OPENAI_API_KEY"] = "test_key_for_pytest"

from langchain_core.messages import AIMessage

# This import must happen AFTER the environment variable is set.
from app.agents.base import BaseAgent
from app.services.vector_store import vector_store
from app.graph.state import ClarifiedRequirements, WorkflowArchitecture, ConfiguredNode, QualityAssessment
from app.services.llm_service import llm_service

@pytest.fixture(autouse=True)
def mock_services_and_llm(monkeypatch):
    """
    Mocks external services and the LLM provider for all agent tests.
    It patches the `ensure_llm` method on the BaseAgent to return a mock LLM.
    It also patches the global llm_service for integration tests.
    """

    # This async function simulates the behavior of the LLM's ainvoke method for AGENTS
    async def mock_agent_llm_ainvoke(*args, **kwargs):
        prompt_input = args[0] if args else kwargs.get("input", {})
        user_content = str(prompt_input).lower()
        response_data = {}

        # Default response for vague/empty inputs
        default_requirements = ClarifiedRequirements(
            business_intent="Default mocked intent",
            required_capabilities=["llm", "default_capability"],
            input_data={"type": "text"}, expected_output={"type": "text"},
            business_logic=[], integrations=[], constraints=["gpt-4"], confidence_score=0.9
        ).model_dump()

        if "clarify requirements" in user_content:
            required_capabilities = ["llm"]
            if any(k in user_content for k in ["rag", "document", "knowledge"]):
                required_capabilities.append("knowledge-retrieval")
            if any(k in user_content for k in ["iterate", "list"]):
                required_capabilities.append("iteration")
            if any(k in user_content for k in ["conditional", "if-else", "route"]):
                required_capabilities.append("if-else")
            if any(k in user_content for k in ["tool", "search"]):
                required_capabilities.append("tool")
            if any(k in user_content for k in ["multi-step", "extracts text"]):
                 required_capabilities.extend(["document-extractor", "knowledge-retrieval", "template-transform"])

            if "i want to use ai for my business" in user_content or "user_request=''" in user_content or not required_capabilities:
                 response_data = default_requirements
            else:
                response_data = ClarifiedRequirements(
                    business_intent="Mocked intent for a specific test",
                    required_capabilities=list(set(required_capabilities)),
                    input_data={"type": "text"}, expected_output={"type": "text"},
                    business_logic=[], integrations=[], constraints=["gpt-4"], confidence_score=0.9
                ).model_dump()

        elif "design the workflow architecture" in user_content:
            node_types = ["start", "llm", "end"]
            pattern_name = "Linear"
            if any(k in user_content for k in ["rag", "knowledge-retrieval"]):
                node_types.append("knowledge-retrieval")
                pattern_name = "RAG"
            if "iteration" in user_content:
                node_types.append("iteration")
                pattern_name = "Iteration"
            if "conditional" in user_content or "if-else" in user_content:
                node_types.append("if-else")
                pattern_name = "Conditional"
            if "tool" in user_content:
                node_types.append("tool")
                pattern_name = "Tool Use"
            if any(k in user_content for k in ["multi-step", "complex"]):
                node_types.extend(["tool", "code", "http-request", "knowledge-retrieval"])
                pattern_name = "Complex"

            response_data = WorkflowArchitecture(
                pattern_id=f"pattern_{pattern_name.lower()}_001",
                pattern_name=pattern_name,
                node_types=list(set(node_types)),
                edge_structure=[{"from": "start", "to": "llm"}, {"from": "llm", "to": "end"}],
                complexity='moderate', estimated_nodes=len(set(node_types)),
                reasoning='Mocked reasoning'
            ).model_dump()

        elif "configure the nodes" in user_content:
            nodes = [
                ConfiguredNode(id='start', type='start', data={'title': 'Start'}, position={'x': 100, 'y': 100}),
                ConfiguredNode(id='llm', type='llm', data={'title': 'LLM'}, position={'x': 300, 'y': 100}),
                ConfiguredNode(id='end', type='end', data={'title': 'End'}, position={'x': 500, 'y': 100})
            ]
            response_data = {"nodes": [node.model_dump() for node in nodes]}

        elif "assess the quality" in user_content:
            response_data = QualityAssessment(
                overall_score=95.0, completeness_score=100.0, correctness_score=90.0,
                best_practices_score=95.0, issues=[], recommendations=[], should_retry=False
            ).model_dump()

        else:
            response_data = default_requirements

        # This is the correct format for JsonOutputParser
        return AIMessage(content=json.dumps(response_data))

    # --- Apply Agent Mock ---
    mock_llm_instance = MagicMock()
    mock_llm_instance.ainvoke = AsyncMock(side_effect=mock_agent_llm_ainvoke)
    async def mock_ensure_llm(*args, **kwargs):
        return mock_llm_instance
    monkeypatch.setattr(BaseAgent, "ensure_llm", mock_ensure_llm)

    # --- Apply Integration Test Mocks ---
    # Mock the global llm_service for tests that use it directly
    monkeypatch.setattr(llm_service, "generate_completion", AsyncMock(return_value=MagicMock(choices=[MagicMock(message=MagicMock(content='{"text": "mocked"}'))])))
    monkeypatch.setattr(llm_service, "generate_with_context", AsyncMock(return_value="Mocked RAG description"))

    # --- Mock Other Services ---
    monkeypatch.setattr(vector_store, "search_patterns", AsyncMock(return_value=[]))
    monkeypatch.setattr(
        "app.services.recommendation_service.recommendation_service.recommend_patterns",
        AsyncMock(return_value=[])
    )
    monkeypatch.setattr(
        "app.api.v1.endpoints.dify.run_dify_workflow",
        AsyncMock(return_value="Mocked workflow result")
    )