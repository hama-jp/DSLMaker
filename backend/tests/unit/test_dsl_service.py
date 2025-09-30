"""
Tests for DSL Service
"""

import pytest
from app.services.dsl_service import dsl_service
from app.models.workflow import WorkflowMetadata


def test_generate_node_id():
    """Test node ID generation."""
    # Reset counter
    dsl_service._node_counter = 0

    node_id_1 = dsl_service.generate_node_id("start")
    assert node_id_1 == "start_1"

    node_id_2 = dsl_service.generate_node_id("llm")
    assert node_id_2 == "llm_2"


def test_create_start_node():
    """Test start node creation."""
    node = dsl_service.create_start_node()

    assert node.type == "start"
    assert "title" in node.data
    assert node.data["title"] == "Start"
    assert "variables" in node.data
    assert "position" in node.model_dump()


def test_create_llm_node():
    """Test LLM node creation."""
    node = dsl_service.create_llm_node(
        title="Test LLM",
        prompt="Test prompt"
    )

    assert node.type == "llm"
    assert node.data["title"] == "Test LLM"
    assert "model" in node.data
    assert "prompt_template" in node.data


def test_create_end_node():
    """Test end node creation."""
    node = dsl_service.create_end_node()

    assert node.type == "end"
    assert node.data["title"] == "End"
    assert "outputs" in node.data


def test_create_edge():
    """Test edge creation."""
    edge = dsl_service.create_edge("node1", "node2")

    assert edge.source == "node1"
    assert edge.target == "node2"
    assert edge.id == "node1-node2"


def test_generate_simple_workflow():
    """Test simple workflow generation."""
    metadata = WorkflowMetadata(
        name="Test Workflow",
        description="Test description",
        complexity="simple"
    )

    workflow = dsl_service.generate_simple_workflow(
        description="Test workflow",
        metadata=metadata
    )

    assert "version" in workflow
    assert "metadata" in workflow
    assert "graph" in workflow
    assert "nodes" in workflow["graph"]
    assert "edges" in workflow["graph"]

    # Check for start, llm, and end nodes
    nodes = workflow["graph"]["nodes"]
    assert len(nodes) == 3
    node_types = [node["type"] for node in nodes]
    assert "start" in node_types
    assert "llm" in node_types
    assert "end" in node_types


def test_validate_workflow_valid():
    """Test workflow validation with valid workflow."""
    metadata = WorkflowMetadata(
        name="Test Workflow",
        description="Test description",
        complexity="simple"
    )

    workflow = dsl_service.generate_simple_workflow(
        description="Test workflow",
        metadata=metadata
    )

    is_valid, errors = dsl_service.validate_workflow(workflow)

    assert is_valid is True
    assert len(errors) == 0


def test_validate_workflow_missing_keys():
    """Test workflow validation with missing keys."""
    workflow = {
        "version": "0.1"
        # Missing metadata and graph
    }

    is_valid, errors = dsl_service.validate_workflow(workflow)

    assert is_valid is False
    assert len(errors) > 0
    assert any("metadata" in error for error in errors)


def test_validate_workflow_missing_start_node():
    """Test workflow validation with missing start node."""
    workflow = {
        "version": "0.1",
        "metadata": {},
        "graph": {
            "nodes": [
                {"id": "end_1", "type": "end", "data": {}}
            ],
            "edges": []
        }
    }

    is_valid, errors = dsl_service.validate_workflow(workflow)

    assert is_valid is False
    assert any("start" in error.lower() for error in errors)


def test_workflow_to_yaml():
    """Test workflow to YAML conversion."""
    metadata = WorkflowMetadata(
        name="Test Workflow",
        description="Test description",
        complexity="simple"
    )

    workflow = dsl_service.generate_simple_workflow(
        description="Test workflow",
        metadata=metadata
    )

    yaml_str = dsl_service.workflow_to_yaml(workflow)

    assert isinstance(yaml_str, str)
    assert "version" in yaml_str
    assert "metadata" in yaml_str


def test_workflow_to_json():
    """Test workflow to JSON conversion."""
    metadata = WorkflowMetadata(
        name="Test Workflow",
        description="Test description",
        complexity="simple"
    )

    workflow = dsl_service.generate_simple_workflow(
        description="Test workflow",
        metadata=metadata
    )

    json_str = dsl_service.workflow_to_json(workflow)

    assert isinstance(json_str, str)
    assert '"version"' in json_str
    assert '"metadata"' in json_str