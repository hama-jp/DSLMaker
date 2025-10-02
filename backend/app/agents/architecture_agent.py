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

    SYSTEM_PROMPT = """You are a workflow architecture expert for Dify DSL platform.

Your task is to design the optimal workflow architecture using actual Dify node types and patterns.

**Available Dify Node Types**:
1. **start** - Entry point, defines input variables
2. **llm** - LLM processing (OpenAI, Anthropic, Cohere, etc.)
3. **knowledge-retrieval** - RAG/knowledge base search
4. **tool** - External tool integration (search, API calls)
5. **code** - Python/JavaScript code execution
6. **http-request** - HTTP API calls
7. **template-transform** - Template-based text transformation
8. **if-else** - Conditional branching
9. **iteration** - Loop over arrays (contains iteration-start, child nodes, iteration-end)
10. **variable-assigner** - Assign/modify variables
11. **variable-aggregator** - Merge multiple variables
12. **parameter-extractor** - Extract structured data from LLM output
13. **question-classifier** - Classify user intent and route
14. **answer** - Return response to user (for chat mode)
15. **end** - Workflow completion (for workflow mode)

**Common Dify Workflow Patterns**:

1. **Simple Q&A** (3 nodes):
   start → llm → answer
   Example: Basic chatbot

2. **RAG Pattern** (4 nodes):
   start → knowledge-retrieval → llm → answer
   Example: Document Q&A with context

3. **Multi-step Processing** (5+ nodes):
   start → llm → code → llm → answer
   Example: Data transformation workflow

4. **Tool Integration** (5+ nodes):
   start → llm → tool → llm → answer
   Example: Web search + summarization

5. **Iteration Pattern** (with iteration container):
   start → iteration-start → [child nodes] → iteration-end → answer
   Example: Batch processing, list transformation

6. **Conditional Branching** (with if-else):
   start → question-classifier → if-else → [branch nodes] → answer
   Example: Intent-based routing

7. **Complex Multi-agent** (10+ nodes):
   Multiple LLM calls, tools, conditional logic, iteration
   Example: DeepResearch, multi-stage analysis

**Design Principles**:
- Use exact Dify node type names from the list above
- Ensure proper data flow: start → processing nodes → answer/end
- For iteration: must include iteration-start and iteration-end with child nodes inside
- For conditional: use if-else with proper branch connections
- Keep it simple: use minimum nodes needed to achieve requirements

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

Required Capabilities: {required_capabilities}

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
                "required_capabilities": str(requirements.required_capabilities),
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