"""
Dify DSL Builder Utilities

Helper functions to create Dify-compatible nodes and structures.
Based on real Dify 0.4.0 format.
"""
from typing import Dict, Any, List, Optional, Union
import uuid
from datetime import datetime

from app.models.dify_models import (
    DifyPosition, DifyNodeBase, DifyEdge, DifyEdgeData,
    DifyStartVariable, DifyStartNodeData,
    DifyEndOutput, DifyEndNodeData,
    DifyLLMPrompt, DifyLLMModel, DifyLLMContext, DifyLLMVision, DifyLLMNodeData,
    DifyIfElseCondition, DifyIfElseNodeData,
    DifyCodeVariable, DifyCodeOutput, DifyCodeNodeData,
    DifyTemplateVariable, DifyTemplateTransformNodeData,
    DifyToolParameter, DifyToolNodeData,
    DifyAnswerNodeData,
    DifyIterationNodeData, DifyIterationStartNodeData,
    DifyAssignerItem, DifyAssignerNodeData,
    DifyVariableAggregatorNodeData,
    DifyDocumentExtractorNodeData,
)


def generate_timestamp_id() -> str:
    """Generate Dify-style timestamp ID"""
    return str(int(datetime.now().timestamp() * 1000))


def generate_uuid() -> str:
    """Generate UUID for prompt IDs etc."""
    return str(uuid.uuid4())


def create_position(x: float, y: float) -> DifyPosition:
    """Create a position object"""
    return DifyPosition(x=x, y=y)


# =============================================================================
# NODE BUILDERS
# =============================================================================

def build_start_node(
    node_id: str,
    x: float,
    y: float,
    variables: List[Dict[str, Any]],
    title: str = "Start"
) -> Dict[str, Any]:
    """
    Build a start node

    Args:
        node_id: Node ID (timestamp format)
        x, y: Position coordinates
        variables: List of variable definitions
        title: Node title

    Returns:
        Complete node dictionary
    """
    dify_variables = []
    for var in variables:
        dify_variables.append({
            "variable": var.get("variable", var.get("name", "")),
            "label": var.get("label", var.get("variable", var.get("name", ""))),
            "type": var.get("type", "text-input"),
            "required": var.get("required", True),
            "max_length": var.get("max_length", 48),
            "options": var.get("options", [])
        })

    return {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 89,
        "width": 244,
        "data": {
            "type": "start",
            "title": title,
            "desc": "",
            "selected": False,
            "variables": dify_variables
        }
    }


def build_end_node(
    node_id: str,
    x: float,
    y: float,
    outputs: List[Dict[str, Any]],
    title: str = "End"
) -> Dict[str, Any]:
    """
    Build an end node

    Args:
        node_id: Node ID
        x, y: Position
        outputs: List of output definitions with 'variable' and 'value_selector'
        title: Node title

    Returns:
        Complete node dictionary
    """
    dify_outputs = []
    for output in outputs:
        dify_outputs.append({
            "variable": output["variable"],
            "value_selector": output["value_selector"]  # [node_id, field]
        })

    return {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 89,
        "width": 244,
        "data": {
            "type": "end",
            "title": title,
            "desc": "",
            "selected": False,
            "outputs": dify_outputs
        }
    }


def build_llm_node(
    node_id: str,
    x: float,
    y: float,
    model_config: Dict[str, Any],
    prompt_template: List[Dict[str, str]],
    title: str = "LLM",
    vision_enabled: bool = False,
    in_iteration: bool = False,
    iteration_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Build an LLM node

    Args:
        node_id: Node ID
        x, y: Position
        model_config: Model configuration (provider, name, mode, completion_params)
        prompt_template: List of prompts with 'role' and 'text'
        title: Node title
        vision_enabled: Enable vision features
        in_iteration: Whether node is inside iteration
        iteration_id: Parent iteration ID

    Returns:
        Complete node dictionary
    """
    # Add UUIDs to prompts if not present
    dify_prompts = []
    for prompt in prompt_template:
        dify_prompts.append({
            "id": prompt.get("id", generate_uuid()),
            "role": prompt.get("role", "user"),
            "text": prompt.get("text", "")
        })

    node_data = {
        "type": "llm",
        "title": title,
        "desc": "",
        "selected": False,
        "model": model_config,
        "prompt_template": dify_prompts,
        "variables": [],
        "context": {
            "enabled": False,
            "variable_selector": []
        },
        "vision": {
            "enabled": vision_enabled,
            "configs": {"detail": "high"} if vision_enabled else None
        }
    }

    if in_iteration:
        node_data["isInIteration"] = True
        node_data["iteration_id"] = iteration_id

    node = {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 97,
        "width": 244,
        "data": node_data
    }

    if in_iteration:
        node["parentId"] = iteration_id
        node["extent"] = "parent"
        node["zIndex"] = 1002

    return node


def build_if_else_node(
    node_id: str,
    x: float,
    y: float,
    conditions: List[Dict[str, Any]],
    logical_operator: str = "and",
    title: str = "IF/ELSE"
) -> Dict[str, Any]:
    """
    Build an if-else node

    Args:
        node_id: Node ID
        x, y: Position
        conditions: List of condition dicts with variable_selector, comparison_operator, value
        logical_operator: "and" or "or"
        title: Node title

    Returns:
        Complete node dictionary
    """
    dify_conditions = []
    for cond in conditions:
        dify_conditions.append({
            "id": cond.get("id", generate_timestamp_id()),
            "variable_selector": cond["variable_selector"],  # [node_id, field]
            "comparison_operator": cond.get("comparison_operator", "is"),
            "value": cond.get("value", "")
        })

    return {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 125,
        "width": 244,
        "data": {
            "type": "if-else",
            "title": title,
            "desc": "",
            "selected": False,
            "logical_operator": logical_operator,
            "conditions": dify_conditions
        }
    }


def build_code_node(
    node_id: str,
    x: float,
    y: float,
    code: str,
    variables: List[Dict[str, Any]],
    outputs: Dict[str, Dict[str, Any]],
    title: str = "Code",
    code_language: str = "python3"
) -> Dict[str, Any]:
    """
    Build a code execution node

    Args:
        node_id: Node ID
        x, y: Position
        code: Python code to execute
        variables: Input variables with 'variable' and 'value_selector'
        outputs: Output definitions with type info
        title: Node title
        code_language: Code language (python3)

    Returns:
        Complete node dictionary
    """
    dify_variables = []
    for var in variables:
        dify_variables.append({
            "variable": var["variable"],
            "value_selector": var["value_selector"]
        })

    dify_outputs = {}
    for name, output_def in outputs.items():
        dify_outputs[name] = {
            "type": output_def.get("type", "string"),
            "children": output_def.get("children", None)
        }

    return {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 53,
        "width": 244,
        "data": {
            "type": "code",
            "title": title,
            "desc": "",
            "selected": False,
            "code": code,
            "code_language": code_language,
            "variables": dify_variables,
            "outputs": dify_outputs
        }
    }


def build_tool_node(
    node_id: str,
    x: float,
    y: float,
    provider_id: str,
    tool_name: str,
    tool_parameters: Dict[str, Any],
    tool_configurations: Dict[str, Any],
    title: str,
    provider_type: str = "builtin"
) -> Dict[str, Any]:
    """
    Build a tool node

    Args:
        node_id: Node ID
        x, y: Position
        provider_id: Provider ID (e.g., "tavily", "jina")
        tool_name: Tool name (e.g., "tavily_search")
        tool_parameters: Tool parameters
        tool_configurations: Tool configurations
        title: Node title
        provider_type: "builtin" or "api"

    Returns:
        Complete node dictionary
    """
    return {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 245,
        "width": 244,
        "data": {
            "type": "tool",
            "title": title,
            "desc": "",
            "selected": False,
            "provider_id": provider_id,
            "provider_name": provider_id,
            "provider_type": provider_type,
            "tool_name": tool_name,
            "tool_label": title,
            "tool_parameters": tool_parameters,
            "tool_configurations": tool_configurations
        }
    }


def build_answer_node(
    node_id: str,
    x: float,
    y: float,
    answer_reference: str,
    title: str = "回答"
) -> Dict[str, Any]:
    """
    Build an answer node (for advanced-chat mode)

    Args:
        node_id: Node ID
        x, y: Position
        answer_reference: Variable reference like "{{#llm.text#}}"
        title: Node title

    Returns:
        Complete node dictionary
    """
    return {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 103,
        "width": 244,
        "data": {
            "type": "answer",
            "title": title,
            "desc": "",
            "selected": False,
            "answer": answer_reference,
            "variables": []
        }
    }


def build_iteration_node(
    node_id: str,
    x: float,
    y: float,
    iterator_selector: List[str],
    output_selector: List[str],
    output_type: str,
    start_node_type: str,
    width: int = 985,
    height: int = 377,
    title: str = "Iteration"
) -> Dict[str, Any]:
    """
    Build an iteration node

    Args:
        node_id: Node ID
        x, y: Position
        iterator_selector: [node_id, field] - array to iterate over
        output_selector: [node_id, field] - output from last node in iteration
        output_type: Type of output (array[string], array[object], etc.)
        start_node_type: Type of first node inside iteration (tool, llm, etc.)
        width, height: Size of iteration container
        title: Node title

    Returns:
        Complete iteration node dictionary
    """
    start_node_id = f"{node_id}start0"

    return {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": height,
        "width": width,
        "zIndex": 1,
        "data": {
            "type": "iteration",
            "title": title,
            "desc": "",
            "selected": False,
            "iterator_selector": iterator_selector,
            "output_selector": output_selector,
            "output_type": output_type,
            "startNodeType": start_node_type,
            "start_node_id": start_node_id,
            "width": width,
            "height": height
        }
    }


def build_iteration_start_node(
    iteration_id: str,
    x: float = 24,
    y: float = 68
) -> Dict[str, Any]:
    """
    Build an iteration-start node (special node inside iteration)

    Args:
        iteration_id: Parent iteration node ID
        x, y: Position relative to iteration container

    Returns:
        Complete iteration-start node dictionary
    """
    start_node_id = f"{iteration_id}start0"

    return {
        "id": start_node_id,
        "type": "custom-iteration-start",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},  # Will be calculated
        "parentId": iteration_id,
        "selected": False,
        "draggable": False,
        "selectable": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 44,
        "width": 44,
        "zIndex": 1002,
        "data": {
            "type": "iteration-start",
            "title": "",
            "desc": "",
            "isInIteration": True
        }
    }


def build_template_transform_node(
    node_id: str,
    x: float,
    y: float,
    template: str,
    variables: List[Dict[str, Any]],
    title: str = "Template Transform",
    in_iteration: bool = False,
    iteration_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Build a template transform node

    Args:
        node_id: Node ID
        x, y: Position
        template: Jinja2-like template string
        variables: Input variables with 'variable' and 'value_selector'
        title: Node title
        in_iteration: Whether node is inside iteration
        iteration_id: Parent iteration ID

    Returns:
        Complete node dictionary
    """
    dify_variables = []
    for var in variables:
        dify_variables.append({
            "variable": var["variable"],
            "value_selector": var["value_selector"]
        })

    node_data = {
        "type": "template-transform",
        "title": title,
        "desc": "",
        "selected": False,
        "template": template,
        "variables": dify_variables
    }

    if in_iteration:
        node_data["isInIteration"] = True
        node_data["iteration_id"] = iteration_id

    node = {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 53,
        "width": 244,
        "data": node_data
    }

    if in_iteration:
        node["parentId"] = iteration_id
        node["extent"] = "parent"
        node["zIndex"] = 1002

    return node


def build_variable_assigner_node(
    node_id: str,
    x: float,
    y: float,
    items: List[Dict[str, Any]],
    title: str = "変数代入",
    in_iteration: bool = False,
    iteration_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Build a variable assigner node (for conversation variables)

    Args:
        node_id: Node ID
        x, y: Position
        items: Assignment items with variable_selector, value, operation
        title: Node title
        in_iteration: Whether node is inside iteration
        iteration_id: Parent iteration ID

    Returns:
        Complete node dictionary
    """
    dify_items = []
    for item in items:
        dify_items.append({
            "variable_selector": item["variable_selector"],  # [conversation, var_name]
            "input_type": item.get("input_type", "variable"),  # variable or constant
            "value": item["value"],  # Can be selector or literal
            "operation": item.get("operation", "over-write"),  # over-write, append, clear
            "write_mode": "over-write"
        })

    node_data = {
        "type": "assigner",
        "title": title,
        "desc": "",
        "selected": False,
        "version": "2",
        "items": dify_items
    }

    if in_iteration:
        node_data["isInIteration"] = True
        node_data["iteration_id"] = iteration_id

    node = {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 136,
        "width": 242,
        "data": node_data
    }

    if in_iteration:
        node["parentId"] = iteration_id
        node["extent"] = "parent"
        node["zIndex"] = 1002

    return node


def build_variable_aggregator_node(
    node_id: str,
    x: float,
    y: float,
    variables: List[List[str]],
    output_type: str = "string",
    title: str = "変数集約器",
    in_iteration: bool = False,
    iteration_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Build a variable aggregator node

    Args:
        node_id: Node ID
        x, y: Position
        variables: List of [node_id, field] selectors
        output_type: Output type (string, array[string], etc.)
        title: Node title
        in_iteration: Whether node is inside iteration
        iteration_id: Parent iteration ID

    Returns:
        Complete node dictionary
    """
    node_data = {
        "type": "variable-aggregator",
        "title": title,
        "desc": "",
        "selected": False,
        "output_type": output_type,
        "variables": variables
    }

    if in_iteration:
        node_data["isInIteration"] = True
        node_data["iteration_id"] = iteration_id

    node = {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 134,
        "width": 242,
        "data": node_data
    }

    if in_iteration:
        node["parentId"] = iteration_id
        node["extent"] = "parent"
        node["zIndex"] = 1002

    return node


def build_document_extractor_node(
    node_id: str,
    x: float,
    y: float,
    variable_selector: List[str],
    is_array_file: bool = False,
    title: str = "テキスト抽出"
) -> Dict[str, Any]:
    """
    Build a document extractor node

    Args:
        node_id: Node ID
        x, y: Position
        variable_selector: [node_id, field] - file input
        is_array_file: Whether input is array of files
        title: Node title

    Returns:
        Complete node dictionary
    """
    return {
        "id": node_id,
        "type": "custom",
        "position": {"x": x, "y": y},
        "positionAbsolute": {"x": x, "y": y},
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "height": 94,
        "width": 244,
        "data": {
            "type": "document-extractor",
            "title": title,
            "desc": "",
            "selected": False,
            "variable_selector": variable_selector,
            "is_array_file": is_array_file
        }
    }


# =============================================================================
# EDGE BUILDERS
# =============================================================================

def build_edge(
    source_id: str,
    target_id: str,
    source_type: str,
    target_type: str,
    source_handle: str = "source",
    in_iteration: bool = False,
    iteration_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Build an edge

    Args:
        source_id: Source node ID
        target_id: Target node ID
        source_type: Source node type (start, llm, if-else, etc.)
        target_type: Target node type
        source_handle: "source", "true", or "false" (for if-else)
        in_iteration: Whether edge is inside iteration
        iteration_id: Parent iteration ID

    Returns:
        Complete edge dictionary
    """
    edge = {
        "id": f"{source_id}-{target_id}",
        "source": source_id,
        "target": target_id,
        "sourceHandle": source_handle,
        "targetHandle": "target",
        "type": "custom",
        "selected": False,
        "data": {
            "sourceType": source_type,
            "targetType": target_type,
            "isInIteration": in_iteration
        }
    }

    if in_iteration:
        edge["data"]["iteration_id"] = iteration_id
        edge["zIndex"] = 1002

    return edge


# =============================================================================
# VARIABLE REFERENCE HELPERS
# =============================================================================

def make_variable_reference(node_id: str, field: str) -> str:
    """
    Create a Dify variable reference

    Args:
        node_id: Node ID
        field: Field name

    Returns:
        Variable reference string like "{{#node_id.field#}}"
    """
    return f"{{{{#{node_id}.{field}#}}}}"


def make_conversation_variable_reference(var_name: str) -> str:
    """
    Create a conversation variable reference

    Args:
        var_name: Variable name

    Returns:
        Variable reference string like "{{#conversation.var_name#}}"
    """
    return f"{{{{#conversation.{var_name}#}}}}"


def parse_variable_reference(ref: str) -> Optional[tuple[str, str]]:
    """
    Parse a Dify variable reference

    Args:
        ref: Variable reference like "{{#node_id.field#}}"

    Returns:
        Tuple of (node_id, field) or None if invalid
    """
    if not (ref.startswith("{{#") and ref.endswith("#}}")):
        return None

    content = ref[3:-3]  # Remove {{# and #}}
    parts = content.split(".", 1)

    if len(parts) == 2:
        return (parts[0], parts[1])

    return None


def create_conversation_variable(
    var_id: str,
    name: str,
    value_type: str,
    default_value: Any,
    description: str = ""
) -> Dict[str, Any]:
    """
    Create a conversation variable definition (for advanced-chat mode)

    Args:
        var_id: Variable ID (UUID or timestamp)
        name: Variable name
        value_type: Type (string, number, array[string], array[object], etc.)
        default_value: Default value
        description: Variable description

    Returns:
        Conversation variable dictionary
    """
    return {
        "id": var_id,
        "name": name,
        "value_type": value_type,
        "value": default_value,
        "description": description,
        "selector": ["conversation", name]
    }


# =============================================================================
# COMPLETE DSL BUILDERS
# =============================================================================

def build_workflow_dsl(
    app_name: str,
    app_description: str,
    nodes: List[Dict[str, Any]],
    edges: List[Dict[str, Any]],
    app_icon: str = "🤖",
    icon_background: str = "#FFEAD5",
    dependencies: Optional[List[Dict[str, Any]]] = None,
    conversation_variables: Optional[List[Dict[str, Any]]] = None,
    mode: str = "workflow"
) -> Dict[str, Any]:
    """
    Build a complete Dify workflow DSL

    Args:
        app_name: Application name
        app_description: Application description
        nodes: List of node dictionaries
        edges: List of edge dictionaries
        app_icon: App icon emoji
        icon_background: Icon background color
        dependencies: List of dependencies
        conversation_variables: List of conversation variables (for advanced-chat)
        mode: App mode (workflow, advanced-chat, agent-chat, chat)

    Returns:
        Complete Dify DSL dictionary
    """
    return {
        "app": {
            "name": app_name,
            "description": app_description,
            "icon": app_icon,
            "icon_background": icon_background,
            "mode": mode,
            "use_icon_as_answer_icon": False
        },
        "kind": "app",
        "version": "0.4.0",
        "dependencies": dependencies or [],
        "workflow": {
            "conversation_variables": conversation_variables or [],
            "environment_variables": [],
            "features": {
                "file_upload": {
                    "image": {
                        "enabled": False,
                        "number_limits": 3,
                        "transfer_methods": ["local_file", "remote_url"]
                    }
                },
                "opening_statement": "",
                "retriever_resource": {
                    "enabled": False
                },
                "sensitive_word_avoidance": {
                    "enabled": False
                },
                "speech_to_text": {
                    "enabled": False
                },
                "suggested_questions": [],
                "suggested_questions_after_answer": {
                    "enabled": False
                },
                "text_to_speech": {
                    "enabled": False,
                    "language": "",
                    "voice": ""
                }
            },
            "graph": {
                "nodes": nodes,
                "edges": edges,
                "viewport": {
                    "x": 100,
                    "y": 100,
                    "zoom": 1.0
                }
            },
            "rag_pipeline_variables": []
        }
    }
