import os
import pytest
import json
import re
import asyncio
from unittest.mock import MagicMock, AsyncMock
from typing import Any, Dict, List, Optional

# Set a dummy API key BEFORE any application modules are imported.
os.environ["OPENAI_API_KEY"] = "test_key_for_pytest"

from langchain_core.runnables import Runnable, RunnableConfig
from langchain_core.messages import AIMessage
from langchain_core.runnables.utils import Input, Output

# This import must happen AFTER the environment variable is set.
from app.agents.base import BaseAgent
from app.services.vector_store import vector_store
from app.graph.state import ClarifiedRequirements, WorkflowArchitecture, ConfiguredNode, QualityAssessment
from app.services.llm_service import llm_service

class MockRunnableLLM(Runnable):
    """
    A mock runnable LLM that returns hardcoded responses based on agent prompts.
    This approach is more stable and predictable than dynamic regex parsing.
    """

    def invoke(self, input: Input, config: Optional[RunnableConfig] = None, **kwargs: Any) -> Output:
        return asyncio.run(self.ainvoke(input, config=config, **kwargs))

    async def ainvoke(self, input: Input, config: Optional[RunnableConfig] = None, **kwargs: Any) -> Output:
        user_content = str(input).lower()

        if "you are a requirements analysis expert" in user_content:
            response_data = self._mock_requirements_response(user_content)
        elif "you are a workflow architecture expert" in user_content:
            response_data = self._mock_architecture_response(user_content)
        elif "you are a dify dsl workflow configuration expert" in user_content:
            response_data = self._mock_configuration_response(user_content)
        elif "you are a dify dsl workflow quality assurance expert" in user_content:
            response_data = self._mock_quality_response(user_content)
        else:
            response_data = {}

        return AIMessage(content=json.dumps(response_data))

    def _mock_requirements_response(self, user_content: str) -> Dict[str, Any]:
        """Returns a hardcoded ClarifiedRequirements response based on keywords."""
        request_str = ""
        # A more robust regex to find the user request.
        match = re.search(r"user request:\s*(.*?)\s*similar successful workflows", user_content, re.DOTALL)
        if match:
            request_str = match.group(1).strip()

        # Default values
        business_intent = "Default fallback intent"
        required_capabilities = []
        constraints = []

        # Tailor response for each test case using simple keyword matching
        if "create a chatbot that answers questions" in request_str:
            business_intent = "Create a chatbot that answers questions using GPT-4"
            required_capabilities.append("llm")
            if "gpt-4" in request_str:
                constraints.append("use gpt-4")
        elif "build a document search system" in request_str:
            business_intent = "Build a document search system"
            required_capabilities.extend(["knowledge-retrieval", "document-extractor"])
        elif "process a list of customer reviews" in request_str:
            business_intent = "Process a list of customer reviews and summarize each one"
            required_capabilities.extend(["iteration", "llm"])
        elif "classifies support tickets" in request_str:
            business_intent = "Create a workflow that classifies support tickets"
            required_capabilities.extend(["if-else", "question-classifier"])
        elif "search the web for latest news" in request_str:
            business_intent = "Search the web for latest news and summarize the results"
            required_capabilities.extend(["tool", "llm"])
        elif "extracts text from uploaded documents" in request_str:
            business_intent = "Document processing pipeline"
            required_capabilities.extend(["document-extractor", "knowledge-retrieval", "llm", "template-transform"])
        elif "i need a workflow with start -> llm -> knowledge-retrieval" in request_str:
            business_intent = "I need a workflow with start -> llm -> knowledge-retrieval -> llm -> end"
            required_capabilities.extend(["llm", "knowledge-retrieval"])
        elif "i want to use ai for my business" in request_str:
            business_intent = "I want to use AI for my business"
            required_capabilities.append("llm")
        elif not request_str:
             business_intent = "Empty request"
             required_capabilities.append("llm")

        return ClarifiedRequirements(
            business_intent=business_intent,
            required_capabilities=list(dict.fromkeys(required_capabilities)),
            input_data={"type": "text"}, expected_output={"type": "text"},
            business_logic=[], integrations=[], constraints=constraints, confidence_score=0.9
        ).model_dump()

    def _mock_architecture_response(self, user_content: str) -> Dict[str, Any]:
        """Returns a hardcoded WorkflowArchitecture response based on capabilities."""
        caps_str = ""
        match = re.search(r"required capabilities: \[(.*?)\]", user_content)
        if match:
            caps_str = match.group(1).replace("'", "").replace('"', '').replace('\\', '')

        capabilities = [c.strip() for c in caps_str.split(',') if c.strip()]

        # Base structure
        node_types = ["start"] + capabilities + ["end"]
        edge_structure = []

        # Specific fixes for failing tests
        if "iteration" in capabilities:
            node_types = ["start", "iteration", "llm", "end"] # Enforce order
        elif "knowledge-retrieval" in capabilities:
            node_types = ["start", "knowledge-retrieval", "llm", "end"] # Enforce order
        elif "tool" in capabilities:
             node_types = ["start", "tool", "llm", "end"] # Enforce order

        if "if-else" in capabilities:
            node_types = ["start", "if-else", "true_branch_llm", "false_branch_llm", "end"]
            edge_structure.extend([
                {"from": "start", "to": "if-else"},
                {"from": "if-else", "to": "true_branch_llm", "sourceHandle": "true"},
                {"from": "if-else", "to": "false_branch_llm", "sourceHandle": "false"},
                {"from": "true_branch_llm", "to": "end"},
                {"from": "false_branch_llm", "to": "end"}
            ])
        else:
            # Use dict.fromkeys to preserve order while getting unique nodes
            current_nodes = list(dict.fromkeys(node_types))
            for i in range(len(current_nodes) - 1):
                edge_structure.append({"from": current_nodes[i], "to": current_nodes[i+1]})

        # Fix for complex architecture test
        if "document-extractor" in capabilities and "template-transform" in capabilities:
            node_types = ["start", "document-extractor", "knowledge-retrieval", "llm", "template-transform", "end"]

        # Ensure unique nodes while preserving order for the final response
        final_nodes = list(dict.fromkeys(node_types))

        return WorkflowArchitecture(
            pattern_id="pattern_mock_001", pattern_name="Mocked Pattern",
            node_types=final_nodes, edge_structure=edge_structure,
            complexity='moderate', estimated_nodes=len(final_nodes),
            reasoning='Mocked reasoning based on parsed capabilities.'
        ).model_dump()

    def _mock_configuration_response(self, user_content: str) -> Dict[str, Any]:
        nodes = [ConfiguredNode(id='start', type='start', data={'title': 'Start'}, position={'x':100, 'y':100})]
        edges = []
        return {"nodes": [n.model_dump() for n in nodes], "edges": edges}

    def _mock_quality_response(self, user_content: str) -> Dict[str, Any]:
        return QualityAssessment(
            overall_score=95.0, completeness_score=100.0, correctness_score=90.0,
            best_practices_score=95.0, issues=[], recommendations=[], should_retry=False
        ).model_dump()

@pytest.fixture(autouse=True)
def mock_services_and_llm(monkeypatch):
    """Mocks external services and the LLM provider for all agent tests."""
    mock_llm_instance = MockRunnableLLM()
    async def mock_ensure_llm(*args, **kwargs):
        return mock_llm_instance
    monkeypatch.setattr(BaseAgent, "ensure_llm", mock_ensure_llm)
    monkeypatch.setattr(llm_service, "generate_completion", AsyncMock(return_value=MagicMock(choices=[MagicMock(message=MagicMock(content='{"text": "mocked"}'))])))
    monkeypatch.setattr(llm_service, "generate_with_context", AsyncMock(return_value="Mocked RAG description"))
    monkeypatch.setattr(vector_store, "search_patterns", AsyncMock(return_value=[]))
    monkeypatch.setattr("app.services.recommendation_service.recommendation_service.recommend_patterns", AsyncMock(return_value=[]))
    monkeypatch.setattr("app.api.v1.endpoints.dify.run_dify_workflow", AsyncMock(return_value="Mocked workflow result"))