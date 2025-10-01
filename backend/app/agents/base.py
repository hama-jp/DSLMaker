"""
Base Agent Class for Multi-Agent Workflow Generation
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, TYPE_CHECKING
import logging

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

if TYPE_CHECKING:
    from app.graph.state import WorkflowGenerationState

from app.services.vector_store import vector_store
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base class for all specialized agents in the workflow generation system.

    Each agent is responsible for one stage of the workflow generation process.
    """

    def __init__(self, name: str, llm: ChatOpenAI = None):
        """
        Initialize the agent.

        Args:
            name: Agent name for logging
            llm: Language model (defaults to llm_service)
        """
        self.name = name
        self.llm = llm
        logger.info(f"✅ Initialized {self.name}")

    async def ensure_llm(self) -> ChatOpenAI:
        """Ensure LLM is initialized and return it."""
        if self.llm:
            return self.llm

        # Use global llm_service
        if not llm_service._initialized:
            await llm_service.initialize()

        # Create ChatOpenAI instance
        from app.config import settings
        self.llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            temperature=0.7
        )
        return self.llm

    async def retrieve_context(
        self,
        query: str,
        n_results: int = 3,
        filter_metadata: Dict[str, Any] = None
    ) -> list[Dict[str, Any]]:
        """
        Retrieve relevant patterns from vector store.

        Args:
            query: Search query
            n_results: Number of results
            filter_metadata: Metadata filters

        Returns:
            List of relevant patterns
        """
        try:
            if not vector_store._initialized:
                await vector_store.initialize()

            patterns = await vector_store.search_patterns(
                query=query,
                n_results=n_results,
                filter_metadata=filter_metadata
            )

            logger.info(f"📚 Retrieved {len(patterns)} patterns for {self.name}")
            return patterns

        except Exception as e:
            logger.error(f"❌ Pattern retrieval failed: {e}")
            return []

    def format_patterns(self, patterns: list[Dict[str, Any]]) -> str:
        """
        Format retrieved patterns for prompt context.

        Args:
            patterns: List of pattern dictionaries

        Returns:
            Formatted string for prompt
        """
        if not patterns:
            return "No similar patterns found."

        formatted = []
        for i, pattern in enumerate(patterns, 1):
            metadata = pattern.get("metadata", {})
            formatted.append(
                f"{i}. {metadata.get('name', 'Unknown Pattern')}\n"
                f"   Description: {metadata.get('description', 'N/A')}\n"
                f"   Complexity: {metadata.get('complexity', 'N/A')}\n"
                f"   Use Cases: {metadata.get('use_cases', 'N/A')}"
            )

        return "\n\n".join(formatted)

    @abstractmethod
    async def execute(self, state: "WorkflowGenerationState") -> Dict[str, Any]:
        """
        Execute the agent's primary task.

        Args:
            state: Current workflow generation state

        Returns:
            Dictionary with state updates
        """
        pass

    def log_execution(self, state: "WorkflowGenerationState", result: Dict[str, Any]) -> None:
        """Log agent execution for monitoring."""
        logger.info(
            f"🤖 {self.name} completed\n"
            f"   Iteration: {state.get('iterations', 0)}\n"
            f"   Updates: {list(result.keys())}"
        )