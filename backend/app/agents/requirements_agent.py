"""
Requirements Clarification Agent
Transforms vague user input into structured requirements
"""

import json
import logging
from typing import Dict, Any

from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.agents.base import BaseAgent
from app.graph.state import WorkflowGenerationState, ClarifiedRequirements

logger = logging.getLogger(__name__)


class RequirementsAgent(BaseAgent):
    """
    Analyzes user requests and extracts structured requirements.

    Responsibilities:
    1. Understand business intent and objectives
    2. Extract input/output data requirements
    3. Identify business logic and rules
    4. Detect integration needs
    5. Assess requirement completeness
    """

    SYSTEM_PROMPT = """You are a requirements analysis expert for Dify workflow automation.

Your task is to analyze user requests and extract structured requirements for Dify DSL generation.

**Dify Node Types** you should be aware of:
- start: Entry point with input variables
- llm: LLM processing (OpenAI, Anthropic, etc.)
- knowledge-retrieval: RAG/knowledge base search
- tool: External tool integration (search, API calls)
- code: Python/JavaScript code execution
- template-transform: Template-based text transformation
- http-request: HTTP API calls
- variable-assigner/variable-aggregator: Variable manipulation
- answer: Return response to user
- if-else: Conditional branching
- iteration: Loop over arrays/lists

**Common Workflow Patterns**:
1. Simple Q&A: start → llm → answer
2. RAG: start → knowledge-retrieval → llm → answer
3. Multi-step: start → llm → code → llm → answer
4. Tool use: start → llm → tool → llm → answer
5. Iteration: start → iteration-start → (nodes) → iteration-end → answer

Extract and structure the following information:
1. **Business Intent**: What is the user trying to achieve?
2. **Input Data**: What data will the workflow receive? Think in terms of Dify variables.
3. **Expected Output**: What should the workflow produce?
4. **Business Logic**: Processing steps mapped to Dify nodes (e.g., "retrieve docs" = knowledge-retrieval)
5. **Integrations**: Which Dify node types are needed? (llm, tool, knowledge-retrieval, etc.)
6. **Constraints**: Model requirements, API constraints, etc.

Rate your confidence (0.0-1.0) based on:
- Clarity of the request
- Availability of similar Dify patterns
- Completeness for DSL generation

IMPORTANT: Return ONLY valid JSON without markdown code blocks or explanations.

Return your analysis as valid JSON matching this schema:
{{
  "business_intent": "Clear description of what user wants to achieve",
  "input_data": {{
    "type": "string/array/object",
    "description": "Description of expected input",
    "validation": ["validation rules if any"]
  }},
  "expected_output": {{
    "type": "string/array/object",
    "description": "Description of expected output",
    "format": "format details"
  }},
  "business_logic": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "integrations": [
    "API/Service 1",
    "API/Service 2"
  ],
  "performance_requirements": {{
    "latency": "acceptable response time",
    "throughput": "requests per minute",
    "reliability": "uptime requirement"
  }},
  "constraints": [
    "Security constraint",
    "Budget constraint"
  ],
  "confidence_score": 0.85
}}"""

    def __init__(self):
        super().__init__(name="Requirements Agent")

    async def execute(self, state: WorkflowGenerationState) -> Dict[str, Any]:
        """
        Analyze user request and extract structured requirements.

        Args:
            state: Current workflow generation state

        Returns:
            Dictionary with 'requirements' key containing ClarifiedRequirements
        """
        logger.info(f"📋 {self.name} analyzing request: {state['user_request'][:100]}...")

        try:
            # Retrieve similar patterns for context
            similar_patterns = await self.retrieve_context(
                query=state["user_request"],
                n_results=3
            )

            # Ensure LLM is ready
            llm = await self.ensure_llm()

            # Create prompt with context
            prompt = ChatPromptTemplate.from_messages([
                ("system", self.SYSTEM_PROMPT),
                ("user", """User Request: {user_request}

Similar Successful Workflows:
{patterns}

User Preferences: {preferences}

Analyze this request and extract structured requirements in JSON format.""")
            ])

            # Create chain with JSON parser
            parser = JsonOutputParser()
            chain = prompt | llm | parser

            # Execute
            result = await chain.ainvoke({
                "user_request": state["user_request"],
                "patterns": self.format_patterns(similar_patterns),
                "preferences": json.dumps(state.get("preferences", {}), indent=2)
            })

            # Validate and create requirements object
            requirements = ClarifiedRequirements(**result)

            logger.info(
                f"✅ {self.name} completed\n"
                f"   Intent: {requirements.business_intent[:80]}...\n"
                f"   Confidence: {requirements.confidence_score:.2f}\n"
                f"   Logic Steps: {len(requirements.business_logic)}"
            )

            return {
                "requirements": requirements,
                "retrieved_patterns": similar_patterns,
                "current_agent": self.name
            }

        except Exception as e:
            logger.error(f"❌ {self.name} failed: {e}")
            # Return error state with fallback
            return {
                "requirements": self._create_fallback_requirements(state),
                "error_history": state.get("error_history", []) + [f"Requirements: {str(e)}"],
                "current_agent": self.name
            }

    def _create_fallback_requirements(self, state: WorkflowGenerationState) -> ClarifiedRequirements:
        """Create basic requirements when analysis fails."""
        return ClarifiedRequirements(
            business_intent=state["user_request"],
            input_data={
                "type": "string",
                "description": "User input",
                "validation": []
            },
            expected_output={
                "type": "string",
                "description": "Processed result",
                "format": "text"
            },
            business_logic=["Process user input", "Generate output"],
            integrations=[],
            performance_requirements=None,
            constraints=[],
            confidence_score=0.3  # Low confidence for fallback
        )