import pytest
import json
from unittest.mock import MagicMock, AsyncMock

from app.agents.base import BaseAgent
from app.services.vector_store import vector_store
from app.graph.state import ClarifiedRequirements, WorkflowArchitecture, ConfiguredNode, QualityAssessment

@pytest.fixture(autouse=True)
def mock_services_and_llm(monkeypatch):
    """
    Mocks all external services and the LLM provider for all agent tests.
    It patches the `ensure_llm` method on the BaseAgent to return a mock LLM.
    This version of the mock returns a raw JSON string, which the JsonOutputParser
    is designed to handle, avoiding complexities with LangChain's internal message formats.
    """

    async def mock_llm_ainvoke(*args, **kwargs):
        # The input to the chain is passed to the llm's ainvoke method.
        # We can inspect it to decide which mock response to return.
        prompt_input = args[0] if args else kwargs.get("input", {})
        user_content = str(prompt_input).lower()

        response_data = {}

        # Default response for vague/empty inputs to prevent ZeroDivisionError in consistency test
        default_requirements = ClarifiedRequirements(
            business_intent="Default mocked intent",
            required_capabilities=["llm", "default_capability"],
            input_data={"type": "text"},
            expected_output={"type": "text"},
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

            # Use default for tests that send vague or empty requests
            if "i want to use ai for my business" in user_content or "user_request=''" in user_content:
                 response_data = default_requirements
            else:
                response_data = ClarifiedRequirements(
                    business_intent="Mocked intent for a specific test",
                    required_capabilities=list(set(required_capabilities)),
                    input_data={"type": "text"},
                    expected_output={"type": "text"},
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
            if any(k in user_content for k in ["conditional", "if-else"]):
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
                complexity='moderate',
                estimated_nodes=len(set(node_types)),
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

        # THE FINAL FIX: Return a raw JSON string. The JsonOutputParser will receive this string
        # directly from the chain and parse it.
        return json.dumps(response_data)

    # We need to mock the LLM instance that the agent will use.
    mock_llm_instance = MagicMock()
    # The chain calls `ainvoke` on the instance. We replace it with our async mock function.
    mock_llm_instance.ainvoke = AsyncMock(side_effect=mock_llm_ainvoke)

    # This async function will replace the real `ensure_llm` on the BaseAgent.
    async def mock_ensure_llm(*args, **kwargs):
        return mock_llm_instance

    # --- Apply the Mocks ---
    # 1. Patch the single point of entry for LLM creation in all agents.
    monkeypatch.setattr(BaseAgent, "ensure_llm", mock_ensure_llm)

    # 2. Mock other external services.
    monkeypatch.setattr(vector_store, "search_patterns", AsyncMock(return_value=[]))
    monkeypatch.setattr(
        "app.agents.architecture_agent.recommendation_service.recommend_patterns",
        AsyncMock(return_value=[])
    )
    monkeypatch.setattr(
        "app.api.v1.endpoints.dify.run_dify_workflow",
        AsyncMock(return_value="Mocked workflow result")
    )