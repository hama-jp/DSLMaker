"""
Node Configuration Agent
Configures individual nodes with proper data and connections
"""

import json
import logging
from typing import Dict, Any, List

from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.agents.base import BaseAgent
from app.graph.state import WorkflowGenerationState, ConfiguredNode

logger = logging.getLogger(__name__)


class ConfigurationAgent(BaseAgent):
    """
    Configures individual workflow nodes with proper settings.

    Responsibilities:
    1. Configure each node type with appropriate parameters
    2. Set up variable references and data flow
    3. Define prompts for LLM nodes
    4. Configure conditional logic for if-else nodes
    5. Set up iteration parameters
    6. Ensure data compatibility between connected nodes
    """

    SYSTEM_PROMPT = """You are a Dify DSL workflow configuration expert.

Configure nodes using EXACT Dify DSL structure with these templates:

**Start Node**: id=start, data must have title/type/desc/selected/variables, position={{x:80,y:282}}
**LLM Node**: id=llm_xxx, data has model(provider/name/mode/completion_params), prompt_template array, memory/context/vision objects
**Answer Node**: id=answer, data has answer field with variable reference like {{{{#llm.text#}}}}
**Knowledge Node**: query_variable_selector, dataset_ids, retrieval_mode, multiple_retrieval_config
**Code Node**: code_language=python3, code string, variables array, outputs object
**Tool Node**: provider_id/name, tool_name, tool_parameters with query

**CRITICAL Rules**:
1. ALL nodes MUST have: id (string), type (string), data (object), position ({{x,y}})
2. data object MUST include: title, type, desc, selected (always false)
3. Variable references use format: {{{{#node_id.field#}}}}
4. Position strategy: start at x=80 y=282, space 300px horizontally
5. LLM nodes need complete model config: provider, name, mode, completion_params
6. LLM prompt_template is array of {{role, text}} objects
7. Answer nodes reference LLM output as: {{{{#llm_id.text#}}}}

Return JSON with nodes and edges arrays. NO markdown blocks.

Return configuration as valid JSON with 'nodes' and 'edges' keys:
{{
  "nodes": [
    {{
      "id": "start_1",
      "type": "start",
      "data": {{
        "title": "User Input",
        "variables": [...]
      }},
      "position": {{"x": 100, "y": 200}}
    }},
    ...
  ],
  "edges": [
    {{
      "id": "edge_1",
      "source": "start_1",
      "target": "llm_1"
    }},
    ...
  ]
}}

IMPORTANT Edge Rules:
- Do NOT include "sourceHandle" or "targetHandle" in normal edges
- ONLY for if-else nodes, use:
  - sourceHandle: "true" for true branch
  - sourceHandle: "false" for false branch
- All other edges should only have: id, source, target"""

    def __init__(self):
        super().__init__(name="Configuration Agent")

    async def execute(self, state: WorkflowGenerationState) -> Dict[str, Any]:
        """
        Configure all workflow nodes based on architecture.

        Args:
            state: Current workflow generation state

        Returns:
            Dictionary with 'configured_nodes' and 'configured_edges'
        """
        requirements = state.get("requirements")
        architecture = state.get("architecture")

        if not requirements or not architecture:
            raise ValueError("Requirements and architecture must be completed before configuration")

        logger.info(
            f"⚙️ {self.name} configuring {architecture.estimated_nodes} nodes..."
        )

        try:
            # Retrieve the selected pattern for reference
            pattern_context = await self.retrieve_context(
                query=architecture.pattern_id,
                n_results=1
            )

            # Ensure LLM is ready
            llm = await self.ensure_llm()

            # Create prompt with full context
            prompt = ChatPromptTemplate.from_messages([
                ("system", self.SYSTEM_PROMPT),
                ("user", """Business Intent: {business_intent}

Architecture Design:
- Pattern: {pattern_name}
- Node Types: {node_types}
- Edge Structure: {edge_structure}
- Complexity: {complexity}

Business Logic Steps:
{business_logic}

Input Data: {input_data}
Expected Output: {expected_output}
Integrations: {integrations}

Reference Pattern (if available):
{pattern_reference}

Configure all nodes with proper settings. Return JSON with 'nodes' and 'edges' arrays.""")
            ])

            # Create chain with JSON parser
            parser = JsonOutputParser()
            chain = prompt | llm | parser

            # Execute
            result = await chain.ainvoke({
                "business_intent": requirements.business_intent,
                "pattern_name": architecture.pattern_name,
                "node_types": ", ".join(architecture.node_types),
                "edge_structure": json.dumps(architecture.edge_structure, indent=2),
                "complexity": architecture.complexity,
                "business_logic": "\n".join(f"{i+1}. {step}" for i, step in enumerate(requirements.business_logic)),
                "input_data": json.dumps(requirements.input_data, indent=2),
                "expected_output": json.dumps(requirements.expected_output, indent=2),
                "integrations": ", ".join(requirements.integrations) or "None",
                "pattern_reference": pattern_context[0].get("content", "N/A") if pattern_context else "N/A"
            })

            # Parse and validate nodes
            nodes_data = result.get("nodes", [])
            edges_data = result.get("edges", [])

            configured_nodes = [ConfiguredNode(**node) for node in nodes_data]

            logger.info(
                f"✅ {self.name} completed\n"
                f"   Nodes configured: {len(configured_nodes)}\n"
                f"   Edges defined: {len(edges_data)}\n"
                f"   Node types: {', '.join(set(n.type for n in configured_nodes))}"
            )

            return {
                "configured_nodes": configured_nodes,
                "configured_edges": edges_data,
                "current_agent": self.name
            }

        except Exception as e:
            logger.error(f"❌ {self.name} failed: {e}")
            return {
                "configured_nodes": self._create_fallback_nodes(state),
                "configured_edges": self._create_fallback_edges(),
                "error_history": state.get("error_history", []) + [f"Configuration: {str(e)}"],
                "current_agent": self.name
            }

    def _create_fallback_nodes(self, state: WorkflowGenerationState) -> List[ConfiguredNode]:
        """Create minimal working nodes when configuration fails."""
        requirements = state.get("requirements")

        return [
            ConfiguredNode(
                id="start_1",
                type="start",
                data={
                    "title": "User Input",
                    "variables": [{
                        "variable": "user_input",
                        "type": "string",
                        "label": "Input",
                        "required": True
                    }]
                },
                position={"x": 100, "y": 200}
            ),
            ConfiguredNode(
                id="llm_1",
                type="llm",
                data={
                    "title": "Process Request",
                    "model": {
                        "provider": "openai",
                        "name": "gpt-4",
                        "mode": "chat"
                    },
                    "prompt_template": [{
                        "role": "user",
                        "text": requirements.business_intent if requirements else "Process: {{#start.user_input#}}"
                    }]
                },
                position={"x": 400, "y": 200}
            ),
            ConfiguredNode(
                id="end_1",
                type="end",
                data={
                    "title": "Result",
                    "outputs": {
                        "result": "{{#llm.text#}}"
                    }
                },
                position={"x": 700, "y": 200}
            )
        ]

    def _create_fallback_edges(self) -> List[Dict[str, Any]]:
        """Create edges for fallback nodes."""
        return [
            {
                "id": "edge_1",
                "source": "start_1",
                "target": "llm_1"
            },
            {
                "id": "edge_2",
                "source": "llm_1",
                "target": "end_1"
            }
        ]