"""
Dify DSL Converter V2

Complete rewrite based on real Dify 0.4.0 format.
Converts DSLMaker format to authentic Dify-compatible DSL.
"""
from typing import Dict, Any, List
import re

from app.utils.dify_builder import (
    generate_timestamp_id,
    generate_uuid,
    build_start_node,
    build_end_node,
    build_llm_node,
    build_if_else_node,
    build_code_node,
    build_answer_node,
    build_edge,
    build_workflow_dsl,
    make_variable_reference,
)


class DifyConverterV2:
    """
    Convert DSLMaker workflows to Dify DSL format

    This converter creates REAL Dify-compatible DSL based on actual
    Dify 0.4.0 exports, not theoretical documentation.
    """

    def __init__(self):
        self.node_id_map: Dict[str, str] = {}  # Old ID -> New Dify ID
        self.node_type_map: Dict[str, str] = {}  # Node ID -> Node Type

    def convert(self, dslmaker_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert DSLMaker format to Dify DSL

        Args:
            dslmaker_data: DSLMaker workflow data

        Returns:
            Complete Dify DSL dictionary
        """
        metadata = dslmaker_data.get("metadata", {})
        workflow = dslmaker_data.get("workflow", {})
        graph = workflow.get("graph", {})

        # Reset state
        self.node_id_map = {}
        self.node_type_map = {}

        # Generate node ID mappings
        self._generate_node_id_mappings(graph.get("nodes", []))

        # Convert nodes
        dify_nodes = self._convert_nodes(graph.get("nodes", []))

        # Convert edges
        dify_edges = self._convert_edges(graph.get("edges", []))

        # Detect dependencies
        dependencies = self._detect_dependencies(dify_nodes)

        # Build complete DSL
        return build_workflow_dsl(
            app_name=metadata.get("name", "Untitled Workflow"),
            app_description=metadata.get("description", ""),
            nodes=dify_nodes,
            edges=dify_edges,
            app_icon=metadata.get("icon", "🤖"),
            icon_background=metadata.get("icon_background", "#FFEAD5"),
            dependencies=dependencies,
            mode="workflow"
        )

    def _generate_node_id_mappings(self, nodes: List[Dict[str, Any]]) -> None:
        """Generate Dify-style timestamp IDs for all nodes"""
        for node in nodes:
            old_id = node["id"]
            node_type = node.get("type") or node.get("data", {}).get("type")

            # Generate Dify-style ID
            new_id = generate_timestamp_id()

            self.node_id_map[old_id] = new_id
            self.node_type_map[new_id] = node_type

    def _convert_nodes(self, nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert all nodes to Dify format"""
        dify_nodes = []

        for node in nodes:
            old_id = node["id"]
            new_id = self.node_id_map[old_id]
            node_type = node.get("type") or node.get("data", {}).get("type")
            position = node.get("position", {"x": 100, "y": 100})
            x, y = position["x"], position["y"]
            data = node.get("data", {})

            # Convert based on node type
            if node_type == "start":
                dify_node = self._convert_start_node(new_id, x, y, data)
            elif node_type == "end":
                dify_node = self._convert_end_node(new_id, x, y, data)
            elif node_type == "llm":
                dify_node = self._convert_llm_node(new_id, x, y, data)
            elif node_type == "if-else":
                dify_node = self._convert_if_else_node(new_id, x, y, data)
            elif node_type == "code":
                dify_node = self._convert_code_node(new_id, x, y, data)
            elif node_type == "answer":
                dify_node = self._convert_answer_node(new_id, x, y, data)
            else:
                # Unsupported node type - create a generic node
                dify_node = self._create_generic_node(new_id, x, y, node_type, data)

            if dify_node:
                dify_nodes.append(dify_node)

        return dify_nodes

    def _convert_start_node(
        self,
        node_id: str,
        x: float,
        y: float,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert start node"""
        variables = data.get("variables", [])
        title = data.get("title", "Start")

        # Convert variables to Dify format
        dify_variables = []
        for var in variables:
            dify_var = {
                "variable": var.get("variable", var.get("name", "")),
                "label": var.get("label", var.get("variable", var.get("name", ""))),
                "type": self._map_variable_type(var.get("type", "string")),
                "required": var.get("required", True),
                "max_length": var.get("max_length", 48),
                "options": var.get("options", [])
            }
            dify_variables.append(dify_var)

        return build_start_node(node_id, x, y, dify_variables, title)

    def _convert_end_node(
        self,
        node_id: str,
        x: float,
        y: float,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert end node"""
        outputs = data.get("outputs", [])
        title = data.get("title", "End")

        # Convert outputs to Dify format
        dify_outputs = []
        for output in outputs:
            if isinstance(output, dict):
                # Already in correct format
                variable = output.get("variable", "result")
                value_selector = output.get("value_selector", [])
            else:
                # Old format: {"result": "{{#llm.text#}}"}
                variable = str(output)
                value_selector = []

            # Map old node IDs to new ones in value_selector
            if value_selector and len(value_selector) >= 2:
                old_node_id = value_selector[0]
                field = value_selector[1]
                new_node_id = self.node_id_map.get(old_node_id, old_node_id)
                value_selector = [new_node_id, field]

            dify_outputs.append({
                "variable": variable,
                "value_selector": value_selector
            })

        return build_end_node(node_id, x, y, dify_outputs, title)

    def _convert_llm_node(
        self,
        node_id: str,
        x: float,
        y: float,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert LLM node"""
        title = data.get("title", "LLM")
        model = data.get("model", {})
        prompt_template = data.get("prompt_template", [])

        # Ensure model config has required fields
        model_config = {
            "provider": model.get("provider", "openai"),
            "name": model.get("name", "gpt-4"),
            "mode": model.get("mode", "chat"),
            "completion_params": model.get("completion_params", {
                "temperature": 0.7,
                "max_tokens": 512
            })
        }

        # Convert prompt template and update variable references
        dify_prompts = []
        for prompt in prompt_template:
            prompt_text = prompt.get("text", "")
            # Update variable references to use new node IDs
            updated_text = self._update_variable_references(prompt_text)

            dify_prompts.append({
                "id": prompt.get("id", generate_uuid()),
                "role": prompt.get("role", "user"),
                "text": updated_text
            })

        vision_enabled = data.get("vision", {}).get("enabled", False)

        return build_llm_node(
            node_id, x, y, model_config, dify_prompts, title, vision_enabled
        )

    def _convert_if_else_node(
        self,
        node_id: str,
        x: float,
        y: float,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert if-else node"""
        title = data.get("title", "IF/ELSE")
        conditions = data.get("conditions", [])
        logical_operator = data.get("logical_operator", "and")

        # Convert conditions and update variable selectors
        dify_conditions = []
        for cond in conditions:
            variable_selector = cond.get("variable_selector", [])

            # Map old node IDs to new ones
            if variable_selector and len(variable_selector) >= 2:
                old_node_id = variable_selector[0]
                field = variable_selector[1]
                new_node_id = self.node_id_map.get(old_node_id, old_node_id)
                variable_selector = [new_node_id, field]

            dify_conditions.append({
                "id": cond.get("id", generate_timestamp_id()),
                "variable_selector": variable_selector,
                "comparison_operator": cond.get("comparison_operator", "is"),
                "value": cond.get("value", "")
            })

        return build_if_else_node(node_id, x, y, dify_conditions, logical_operator, title)

    def _convert_code_node(
        self,
        node_id: str,
        x: float,
        y: float,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert code node"""
        title = data.get("title", "Code")
        code = data.get("code", "def main():\n    return {}")
        variables = data.get("variables", [])
        outputs = data.get("outputs", {})

        # Convert variables and update selectors
        dify_variables = []
        for var in variables:
            value_selector = var.get("value_selector", [])

            # Map old node IDs
            if value_selector and len(value_selector) >= 2:
                old_node_id = value_selector[0]
                field = value_selector[1]
                new_node_id = self.node_id_map.get(old_node_id, old_node_id)
                value_selector = [new_node_id, field]

            dify_variables.append({
                "variable": var.get("variable", "arg1"),
                "value_selector": value_selector
            })

        return build_code_node(node_id, x, y, code, dify_variables, outputs, title)

    def _convert_answer_node(
        self,
        node_id: str,
        x: float,
        y: float,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert answer node"""
        title = data.get("title", "回答")
        answer = data.get("answer", "")

        # Update variable references
        updated_answer = self._update_variable_references(answer)

        return build_answer_node(node_id, x, y, updated_answer, title)

    def _create_generic_node(
        self,
        node_id: str,
        x: float,
        y: float,
        node_type: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a generic node for unsupported types"""
        return {
            "id": node_id,
            "type": "custom",
            "position": {"x": x, "y": y},
            "positionAbsolute": {"x": x, "y": y},
            "selected": False,
            "sourcePosition": "right",
            "targetPosition": "left",
            "height": 97,
            "width": 244,
            "data": {
                "type": node_type,
                "title": data.get("title", node_type.upper()),
                "desc": data.get("desc", ""),
                "selected": False,
                **data  # Include all original data
            }
        }

    def _convert_edges(self, edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert all edges to Dify format"""
        dify_edges = []

        for edge in edges:
            old_source = edge["source"]
            old_target = edge["target"]

            new_source = self.node_id_map.get(old_source, old_source)
            new_target = self.node_id_map.get(old_target, old_target)

            source_type = self.node_type_map.get(new_source, "start")
            target_type = self.node_type_map.get(new_target, "end")

            source_handle = edge.get("sourceHandle", "source")

            dify_edge = build_edge(
                new_source, new_target, source_type, target_type, source_handle
            )

            dify_edges.append(dify_edge)

        return dify_edges

    def _update_variable_references(self, text: str) -> str:
        """
        Update variable references in text from old node IDs to new Dify IDs

        Converts: {{#old_node_id.field#}} -> {{#new_timestamp_id.field#}}
        """
        # Pattern: {{#node_id.field#}}
        pattern = r'\{\{#([^.]+)\.([^#]+)#\}\}'

        def replace_ref(match):
            old_node_id = match.group(1)
            field = match.group(2)

            # Map to new ID
            new_node_id = self.node_id_map.get(old_node_id, old_node_id)

            return make_variable_reference(new_node_id, field)

        return re.sub(pattern, replace_ref, text)

    def _map_variable_type(self, var_type: str) -> str:
        """Map DSLMaker variable types to Dify types"""
        type_mapping = {
            "string": "text-input",
            "text": "text-input",
            "number": "number-input",
            "boolean": "select",
            "select": "select",
            "file": "file",
            "paragraph": "paragraph"
        }
        return type_mapping.get(var_type.lower(), "text-input")

    def _detect_dependencies(self, nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detect required dependencies based on nodes

        Returns list of dependency objects
        """
        dependencies = []
        required_plugins = set()

        for node in nodes:
            node_type = node.get("data", {}).get("type")

            # Check if node requires specific plugins
            if node_type == "llm":
                provider = node.get("data", {}).get("model", {}).get("provider", "")
                if provider == "openai":
                    required_plugins.add("langgenius/openai:0.2.6")

            elif node_type == "tool":
                provider_id = node.get("data", {}).get("provider_id", "")
                if provider_id == "tavily":
                    required_plugins.add("langgenius/tavily:0.1.2")
                elif provider_id == "jina":
                    required_plugins.add("langgenius/jina_tool:0.0.7")

        # Convert to dependency format
        for plugin_id in required_plugins:
            dependencies.append({
                "current_identifier": None,
                "type": "marketplace",
                "value": {
                    "marketplace_plugin_unique_identifier": f"{plugin_id}@{self._generate_plugin_hash()}"
                }
            })

        return dependencies

    def _generate_plugin_hash(self) -> str:
        """Generate a placeholder plugin hash"""
        # In real implementation, this would be the actual plugin hash
        return "e2665624a156f52160927bceac9e169bd7e5ae6b936ae82575e14c90af390e6e"


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def convert_dslmaker_to_dify(dslmaker_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert DSLMaker format to Dify DSL

    Args:
        dslmaker_data: Complete DSLMaker workflow data

    Returns:
        Complete Dify DSL dictionary ready for export
    """
    converter = DifyConverterV2()
    return converter.convert(dslmaker_data)
