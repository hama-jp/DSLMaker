"""
Architecture Design Agent
Designs workflow architecture based on requirements and patterns
"""

import json
import logging
from typing import Dict, Any

from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.agents.base import BaseAgent
from app.graph.state import WorkflowGenerationState, WorkflowArchitecture
from app.services.recommendation_service import recommendation_service

logger = logging.getLogger(__name__)


class ArchitectureAgent(BaseAgent):
    """
    Designs workflow architecture by selecting and adapting patterns.

    Responsibilities:
    1. Analyze requirements and match to appropriate patterns
    2. Design node structure and connections
    3. Determine workflow complexity
    4. Plan data flow between nodes
    5. Optimize for performance and maintainability
    """

    SYSTEM_PROMPT = """You are a workflow architecture expert for Dify platform.

Your task is to design the optimal workflow architecture based on requirements and available patterns.

Design Principles:
1. **Pattern Selection**: Choose the most appropriate pattern(s) from the library
2. **Simplicity**: Use the simplest architecture that meets requirements
3. **Modularity**: Design clear separation of concerns
4. **Data Flow**: Ensure clean data flow between nodes
5. **Error Handling**: Plan for failure scenarios
6. **Scalability**: Consider future extensibility

Available Node Types in Dify:
- start: Workflow entry point with input variables
- llm: LLM processing (text generation, analysis)
- knowledge-retrieval: Search knowledge base
- if-else: Conditional branching
- iteration: Loop over array items
- code: Custom Python/NodeJS code execution
- http-request: External API calls
- parameter-extractor: Extract structured data from text
- question-classifier: Classify and route by intent
- variable-aggregator: Merge multiple inputs
- template-transform: Format output with templates
- end: Workflow completion with outputs

IMPORTANT: Return ONLY valid JSON without markdown code blocks or explanations.

Return your architecture design as valid JSON:
{{
  "pattern_id": "pattern_xxx_001",
  "pattern_name": "Name of selected pattern",
  "node_types": ["start", "llm", "knowledge-retrieval", "end"],
  "edge_structure": [
    {{"from": "start", "to": "llm"}},
    {{"from": "llm", "to": "end"}}
  ],
  "complexity": "simple|moderate|complex",
  "estimated_nodes": 5,
  "reasoning": "Detailed explanation of why this architecture was chosen and how it meets requirements"
}}"""

    def __init__(self):
        super().__init__(name="Architecture Agent")

    async def execute(self, state: WorkflowGenerationState) -> Dict[str, Any]:
        """
        Design workflow architecture based on requirements.

        Args:
            state: Current workflow generation state

        Returns:
            Dictionary with 'architecture' key containing WorkflowArchitecture
        """
        requirements = state.get("requirements")
        if not requirements:
            raise ValueError("Requirements must be analyzed before architecture design")

        logger.info(f"🏗️ {self.name} designing architecture...")

        try:
            # Get intelligent pattern recommendations
            recommended_patterns = await recommendation_service.recommend_patterns(
                description=requirements.business_intent,
                n_results=3,
                use_llm_analysis=False
            )

            # Ensure LLM is ready
            llm = await self.ensure_llm()

            # Create prompt with requirements and patterns
            prompt = ChatPromptTemplate.from_messages([
                ("system", self.SYSTEM_PROMPT),
                ("user", """Business Intent: {business_intent}

Input Data: {input_data}

Expected Output: {expected_output}

Business Logic:
{business_logic}

Integrations: {integrations}

Recommended Patterns:
{patterns}

Design the optimal workflow architecture in JSON format.""")
            ])

            # Create chain with JSON parser
            parser = JsonOutputParser()
            chain = prompt | llm | parser

            # Execute
            result = await chain.ainvoke({
                "business_intent": requirements.business_intent,
                "input_data": json.dumps(requirements.input_data, indent=2),
                "expected_output": json.dumps(requirements.expected_output, indent=2),
                "business_logic": "\n".join(f"- {step}" for step in requirements.business_logic),
                "integrations": ", ".join(requirements.integrations) or "None",
                "patterns": self._format_recommendations(recommended_patterns)
            })

            # Validate and create architecture object
            architecture = WorkflowArchitecture(**result)

            logger.info(
                f"✅ {self.name} completed\n"
                f"   Pattern: {architecture.pattern_name}\n"
                f"   Complexity: {architecture.complexity}\n"
                f"   Nodes: {architecture.estimated_nodes}\n"
                f"   Types: {', '.join(architecture.node_types[:5])}"
            )

            return {
                "architecture": architecture,
                "current_agent": self.name
            }

        except Exception as e:
            logger.error(f"❌ {self.name} failed: {e}")
            return {
                "architecture": self._create_fallback_architecture(state),
                "error_history": state.get("error_history", []) + [f"Architecture: {str(e)}"],
                "current_agent": self.name
            }

    def _format_recommendations(self, recommendations: list[Dict[str, Any]]) -> str:
        """Format pattern recommendations for prompt."""
        if not recommendations:
            return "No specific patterns recommended - design from scratch."

        formatted = []
        for i, rec in enumerate(recommendations[:3], 1):
            metadata = rec.get("metadata", {})
            score = rec.get("recommendation_score", 0)
            formatted.append(
                f"{i}. {metadata.get('name', 'Unknown')} (Score: {score:.1f})\n"
                f"   Pattern ID: {metadata.get('pattern_id', 'N/A')}\n"
                f"   Complexity: {metadata.get('complexity', 'N/A')}\n"
                f"   Description: {metadata.get('description', 'N/A')}"
            )

        return "\n\n".join(formatted)

    def _create_fallback_architecture(self, state: WorkflowGenerationState) -> WorkflowArchitecture:
        """Create basic linear architecture when design fails."""
        return WorkflowArchitecture(
            pattern_id="pattern_linear_001",
            pattern_name="Linear Processing",
            node_types=["start", "llm", "end"],
            edge_structure=[
                {"from": "start", "to": "llm"},
                {"from": "llm", "to": "end"}
            ],
            complexity="simple",
            estimated_nodes=3,
            reasoning="Fallback to simple linear workflow due to architecture design failure"
        )