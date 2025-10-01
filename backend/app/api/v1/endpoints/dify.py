"""
Dify DSL Endpoints
Validation, conversion, and import/export for Dify DSL format
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import logging
import time

from app.models.dify_models import DifyDSL
from app.utils.dify_converter_v2 import DifyConverterV2
from pydantic import ValidationError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/validate")
async def validate_dify_dsl(dsl: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate Dify DSL structure using Pydantic models.

    Returns validation result with errors if any.
    """
    try:
        # Validate with Pydantic
        validated_dsl = DifyDSL(**dsl)

        # Get statistics
        nodes = validated_dsl.workflow.graph.nodes if validated_dsl.workflow else []
        edges = validated_dsl.workflow.graph.edges if validated_dsl.workflow else []

        node_types = set()
        for node in nodes:
            node_type = node.data.get('type', '')
            if node_type:
                node_types.add(node_type)

        return {
            "valid": True,
            "errors": [],
            "warnings": [],
            "stats": {
                "node_count": len(nodes),
                "edge_count": len(edges),
                "node_types": list(node_types),
            }
        }

    except ValidationError as e:
        errors = []
        for error in e.errors():
            loc = " -> ".join(str(x) for x in error["loc"])
            errors.append(f"{loc}: {error['msg']}")

        return {
            "valid": False,
            "errors": errors,
            "warnings": [],
        }
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            "valid": False,
            "errors": [str(e)],
            "warnings": [],
        }


@router.post("/convert")
async def convert_to_dify(custom_dsl: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert custom DSL format to Dify DSL format.

    Uses the comprehensive DifyConverter V2.
    """
    start_time = time.time()

    try:
        converter = DifyConverterV2()

        # Convert to Dify format
        dify_dsl = converter.convert_to_dify(custom_dsl)

        # Validate the result
        validated_dsl = DifyDSL(**dify_dsl)

        conversion_time = time.time() - start_time

        return {
            "dsl": dify_dsl,
            "metadata": {
                "source_format": "custom",
                "conversion_time": conversion_time,
            },
            "warnings": [],
        }

    except ValidationError as e:
        errors = []
        for error in e.errors():
            loc = " -> ".join(str(x) for x in error["loc"])
            errors.append(f"{loc}: {error['msg']}")

        raise HTTPException(
            status_code=400,
            detail=f"Generated DSL validation failed: {', '.join(errors)}"
        )
    except Exception as e:
        logger.error(f"Conversion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import")
async def import_dify_dsl(dsl: Dict[str, Any]) -> Dict[str, Any]:
    """
    Import and validate Dify DSL.

    Returns validated DSL with metadata.
    """
    try:
        # Validate with Pydantic
        validated_dsl = DifyDSL(**dsl)

        # Get statistics
        nodes = validated_dsl.workflow.graph.nodes if validated_dsl.workflow else []
        edges = validated_dsl.workflow.graph.edges if validated_dsl.workflow else []

        node_types = {}
        for node in nodes:
            node_type = node.data.get('type', '')
            if node_type:
                node_types[node_type] = node_types.get(node_type, 0) + 1

        # Check for advanced features
        has_iteration = any(
            node.data.get('type') == 'iteration' for node in nodes
        )
        has_conversation_vars = (
            len(validated_dsl.workflow.conversation_variables) > 0
            if validated_dsl.workflow else False
        )
        has_dependencies = len(validated_dsl.dependencies) > 0

        return {
            "dsl": dsl,
            "metadata": {
                "app_name": validated_dsl.app.name,
                "app_mode": validated_dsl.app.mode,
                "version": validated_dsl.version,
                "node_count": len(nodes),
                "edge_count": len(edges),
                "node_types": node_types,
                "features": {
                    "has_iteration": has_iteration,
                    "has_conversation_variables": has_conversation_vars,
                    "has_dependencies": has_dependencies,
                }
            }
        }

    except ValidationError as e:
        errors = []
        for error in e.errors():
            loc = " -> ".join(str(x) for x in error["loc"])
            errors.append(f"{loc}: {error['msg']}")

        raise HTTPException(
            status_code=400,
            detail=f"Invalid Dify DSL: {', '.join(errors)}"
        )
    except Exception as e:
        logger.error(f"Import error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/node-types")
async def get_supported_node_types() -> Dict[str, Any]:
    """
    Get list of supported Dify node types with descriptions.
    """
    node_types = {
        "start": {
            "name": "Start",
            "description": "Workflow entry point with input variables",
            "icon": "▶️",
            "color": "#10B981"
        },
        "end": {
            "name": "End",
            "description": "Workflow exit point with output mappings",
            "icon": "⏹️",
            "color": "#EF4444"
        },
        "llm": {
            "name": "LLM",
            "description": "Large Language Model inference",
            "icon": "🤖",
            "color": "#8B5CF6"
        },
        "if-else": {
            "name": "If/Else",
            "description": "Conditional branching",
            "icon": "🔀",
            "color": "#F59E0B"
        },
        "code": {
            "name": "Code",
            "description": "Python code execution",
            "icon": "💻",
            "color": "#3B82F6"
        },
        "iteration": {
            "name": "Iteration",
            "description": "Loop over array items",
            "icon": "🔄",
            "color": "#EC4899"
        },
        "template-transform": {
            "name": "Template Transform",
            "description": "Jinja2 template processing",
            "icon": "📝",
            "color": "#06B6D4"
        },
        "tool": {
            "name": "Tool",
            "description": "External tool integration",
            "icon": "🛠️",
            "color": "#14B8A6"
        },
        "answer": {
            "name": "Answer",
            "description": "Streaming answer output",
            "icon": "💬",
            "color": "#10B981"
        },
        "assigner": {
            "name": "Variable Assigner",
            "description": "Assign conversation variables",
            "icon": "📌",
            "color": "#6366F1"
        },
        "variable-aggregator": {
            "name": "Variable Aggregator",
            "description": "Aggregate multiple variables",
            "icon": "📊",
            "color": "#8B5CF6"
        },
        "document-extractor": {
            "name": "Document Extractor",
            "description": "Extract content from files",
            "icon": "📄",
            "color": "#F59E0B"
        },
        "http-request": {
            "name": "HTTP Request",
            "description": "Make HTTP API calls",
            "icon": "🌐",
            "color": "#3B82F6"
        },
        "question-classifier": {
            "name": "Question Classifier",
            "description": "Classify user questions",
            "icon": "🎯",
            "color": "#EC4899"
        },
    }

    return {
        "node_types": node_types,
        "total": len(node_types),
        "version": "0.4.0"
    }
