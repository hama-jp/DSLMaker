"""
Dify DSL Converter (LEGACY)

⚠️ DEPRECATED: This is the legacy converter with limited functionality.

For full Dify DSL support, use dify_converter_v2.py which supports:
- All 15 node types
- Iteration with nested nodes
- Conversation variables
- All 4 app modes (workflow, advanced-chat, agent-chat, chat)
- 100% compatibility with real Dify exports

This file is kept for backward compatibility only.
"""
from typing import Dict, Any, List
import uuid
from datetime import datetime


def generate_node_id() -> str:
    """Generate a unique node ID in Dify format (timestamp-based)"""
    return str(int(datetime.now().timestamp() * 1000))


def convert_to_dify_format(pattern: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert DSLMaker pattern format to Dify-compatible DSL format

    Args:
        pattern: Pattern in DSLMaker format with 'metadata' and 'workflow'

    Returns:
        Dify-compatible DSL dictionary
    """
    metadata = pattern.get("metadata", {})
    workflow = pattern.get("workflow", {})
    graph = workflow.get("graph", {})

    # Generate node IDs
    node_id_map = {}
    for node in graph.get("nodes", []):
        old_id = node["id"]
        node_id_map[old_id] = generate_node_id()

    # Convert nodes
    dify_nodes = []
    for node in graph.get("nodes", []):
        dify_node = convert_node_to_dify(node, node_id_map)
        dify_nodes.append(dify_node)

    # Convert edges
    dify_edges = []
    for edge in graph.get("edges", []):
        dify_edge = convert_edge_to_dify(edge, node_id_map)
        dify_edges.append(dify_edge)

    # Build Dify DSL structure
    dify_dsl = {
        "app": {
            "name": metadata.get("name", "Untitled Workflow"),
            "description": metadata.get("description", ""),
            "icon": "🤖",
            "icon_background": "#FFEAD5",
            "mode": "workflow",
            "use_icon_as_answer_icon": False
        },
        "kind": "app",
        "version": "0.4.0",
        "workflow": {
            "conversation_variables": [],
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
                "nodes": dify_nodes,
                "edges": dify_edges,
                "viewport": {
                    "x": 100,
                    "y": 100,
                    "zoom": 1.0
                }
            },
            "rag_pipeline_variables": []
        }
    }

    return dify_dsl


def convert_node_to_dify(node: Dict[str, Any], node_id_map: Dict[str, str]) -> Dict[str, Any]:
    """Convert a single node from DSLMaker format to Dify format"""
    node_id = node_id_map[node["id"]]
    node_type = node["type"]
    node_data = node.get("data", {})
    position = node.get("position", {"x": 100, "y": 100})

    dify_node = {
        "id": node_id,
        "type": "custom",
        "position": position,
        "positionAbsolute": position,
        "selected": False,
        "sourcePosition": "right",
        "targetPosition": "left",
        "width": 244,
        "height": 97,
        "data": {
            "type": node_type,
            "title": node_data.get("title", node_type.upper()),
            "desc": node_data.get("desc", ""),
            "selected": False
        }
    }

    # Convert node-specific data
    if node_type == "start":
        dify_node["data"]["variables"] = convert_start_variables(node_data.get("variables", []))
        dify_node["height"] = 141
    elif node_type == "llm":
        dify_node["data"].update(convert_llm_data(node_data))
    elif node_type == "end":
        dify_node["data"]["outputs"] = convert_end_outputs(node_data.get("outputs", {}), node_id_map)
        dify_node["height"] = 89
    elif node_type == "if-else":
        dify_node["data"]["conditions"] = convert_conditions(node_data.get("conditions", []), node_id_map)
        dify_node["data"]["logical_operator"] = node_data.get("logical_operator", "and")
        dify_node["height"] = 125

    return dify_node


def convert_start_variables(variables: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert start node variables to Dify format"""
    dify_variables = []
    for var in variables:
        dify_var = {
            "variable": var.get("variable", ""),
            "label": var.get("label", var.get("variable", "")),
            "type": map_variable_type(var.get("type", "string")),
            "required": var.get("required", True),
            "max_length": 48,
            "options": var.get("options", [])
        }
        dify_variables.append(dify_var)
    return dify_variables


def map_variable_type(var_type: str) -> str:
    """Map DSLMaker variable types to Dify types"""
    type_mapping = {
        "string": "text-input",
        "number": "number-input",
        "boolean": "select"
    }
    return type_mapping.get(var_type, "text-input")


def convert_llm_data(node_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert LLM node data to Dify format"""
    model_config = node_data.get("model", {})
    prompt_template = node_data.get("prompt_template", [])

    dify_prompts = []
    for i, prompt in enumerate(prompt_template):
        dify_prompt = {
            "id": str(uuid.uuid4()),
            "role": prompt.get("role", "user"),
            "text": prompt.get("text", "")
        }
        dify_prompts.append(dify_prompt)

    return {
        "model": {
            "provider": model_config.get("provider", "openai"),
            "name": model_config.get("name", "gpt-3.5-turbo"),
            "mode": model_config.get("mode", "chat"),
            "completion_params": model_config.get("completion_params", {
                "temperature": 0.7,
                "max_tokens": 512,
                "top_p": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0
            })
        },
        "prompt_template": dify_prompts,
        "context": {
            "enabled": node_data.get("context", {}).get("enabled", False),
            "variable_selector": []
        },
        "variables": [],
        "vision": {
            "enabled": False
        }
    }


def convert_end_outputs(outputs: Dict[str, Any], node_id_map: Dict[str, str]) -> List[Dict[str, Any]]:
    """Convert end node outputs to Dify format"""
    dify_outputs = []
    for key, value in outputs.items():
        # Parse variable references like {{#llm.text#}}
        if isinstance(value, str) and value.startswith("{{#") and value.endswith("#}}"):
            ref = value[3:-3]  # Remove {{# and #}}
            parts = ref.split(".")
            if len(parts) >= 2:
                node_ref = parts[0]
                field = parts[1]
                # Map old node ID to new Dify node ID
                dify_node_id = node_id_map.get(node_ref, node_ref)
                dify_outputs.append({
                    "variable": key,
                    "value_selector": [dify_node_id, field]
                })
    return dify_outputs


def convert_conditions(conditions: List[Dict[str, Any]], node_id_map: Dict[str, str]) -> List[Dict[str, Any]]:
    """Convert if-else conditions to Dify format"""
    dify_conditions = []
    for condition in conditions:
        variable_selector = condition.get("variable_selector", [])
        # Map node references
        if variable_selector:
            mapped_selector = [
                node_id_map.get(variable_selector[0], variable_selector[0]),
                *variable_selector[1:]
            ]
        else:
            mapped_selector = []

        dify_condition = {
            "id": generate_node_id(),
            "variable_selector": mapped_selector,
            "comparison_operator": condition.get("comparison_operator", "is"),
            "value": condition.get("value", "")
        }
        dify_conditions.append(dify_condition)
    return dify_conditions


def convert_edge_to_dify(edge: Dict[str, Any], node_id_map: Dict[str, str]) -> Dict[str, Any]:
    """Convert an edge from DSLMaker format to Dify format"""
    source_id = node_id_map[edge["source"]]
    target_id = node_id_map[edge["target"]]

    # Determine source and target types (would need node type lookup in real implementation)
    # For now, use generic values
    dify_edge = {
        "id": f"{source_id}-{target_id}",
        "source": source_id,
        "target": target_id,
        "sourceHandle": edge.get("sourceHandle", "source"),
        "targetHandle": edge.get("targetHandle", "target"),
        "type": "custom",
        "data": {
            "sourceType": "start",  # Would need actual node type
            "targetType": "end"     # Would need actual node type
        }
    }

    return dify_edge
