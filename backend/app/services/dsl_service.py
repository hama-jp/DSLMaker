"""
DSL Generation Service
Generates Dify workflow DSL from structured requirements
"""

from typing import Dict, Any, List, Optional
import logging
import yaml
import json

from app.models.workflow import WorkflowMetadata, NodeBase, EdgeBase

logger = logging.getLogger(__name__)


class DSLService:
    """Service for generating and validating Dify workflow DSL."""

    def __init__(self):
        """Initialize DSL service."""
        self._node_counter = 0

    def generate_node_id(self, node_type: str) -> str:
        """Generate unique node ID."""
        self._node_counter += 1
        return f"{node_type}_{self._node_counter}"

    def create_start_node(
        self,
        variables: Optional[List[Dict[str, Any]]] = None
    ) -> NodeBase:
        """
        Create a start node.

        Args:
            variables: Input variables for the workflow

        Returns:
            Start node
        """
        return NodeBase(
            id=self.generate_node_id("start"),
            type="start",
            data={
                "title": "Start",
                "variables": variables or [],
                "desc": "Workflow entry point"
            },
            position={"x": 100, "y": 100}
        )

    def create_llm_node(
        self,
        title: str,
        prompt: str,
        model: str = "gpt-4",
        temperature: float = 0.7,
        position: Optional[Dict[str, float]] = None
    ) -> NodeBase:
        """
        Create an LLM node.

        Args:
            title: Node title
            prompt: Prompt template
            model: Model name
            temperature: Sampling temperature
            position: Node position

        Returns:
            LLM node
        """
        return NodeBase(
            id=self.generate_node_id("llm"),
            type="llm",
            data={
                "title": title,
                "model": {
                    "provider": "openai",
                    "name": model,
                    "mode": "chat",
                    "completion_params": {
                        "temperature": temperature
                    }
                },
                "prompt_template": [{
                    "role": "user",
                    "text": prompt
                }],
                "context": {
                    "enabled": False
                }
            },
            position=position or {"x": 300, "y": 100}
        )

    def create_end_node(
        self,
        outputs: Optional[Dict[str, str]] = None,
        position: Optional[Dict[str, float]] = None
    ) -> NodeBase:
        """
        Create an end node.

        Args:
            outputs: Output variable mappings
            position: Node position

        Returns:
            End node
        """
        return NodeBase(
            id=self.generate_node_id("end"),
            type="end",
            data={
                "title": "End",
                "outputs": outputs or {},
                "desc": "Workflow completion"
            },
            position=position or {"x": 500, "y": 100}
        )

    def create_edge(
        self,
        source_id: str,
        target_id: str,
        source_handle: Optional[str] = None,
        target_handle: Optional[str] = None
    ) -> EdgeBase:
        """
        Create an edge connecting two nodes.

        Args:
            source_id: Source node ID
            target_id: Target node ID
            source_handle: Source handle name
            target_handle: Target handle name

        Returns:
            Edge
        """
        return EdgeBase(
            id=f"{source_id}-{target_id}",
            source=source_id,
            target=target_id,
            sourceHandle=source_handle,
            targetHandle=target_handle
        )

    def generate_simple_workflow(
        self,
        description: str,
        metadata: WorkflowMetadata
    ) -> Dict[str, Any]:
        """
        Generate a simple linear workflow (Start -> LLM -> End).

        Args:
            description: Workflow description
            metadata: Workflow metadata

        Returns:
            Complete workflow DSL
        """
        logger.info(f"📝 Generating simple workflow: {metadata.name}")

        # Reset node counter
        self._node_counter = 0

        # Create nodes
        start_node = self.create_start_node(
            variables=[
                {
                    "variable": "user_input",
                    "type": "string",
                    "label": "User Input",
                    "required": True
                }
            ]
        )

        llm_node = self.create_llm_node(
            title="Process Request",
            prompt="Process the following user request:\n\n{{#start.user_input#}}",
            position={"x": 300, "y": 100}
        )

        end_node = self.create_end_node(
            outputs={
                "result": "{{#llm.text#}}"
            },
            position={"x": 500, "y": 100}
        )

        # Create edges
        edges = [
            self.create_edge(start_node.id, llm_node.id),
            self.create_edge(llm_node.id, end_node.id)
        ]

        # Build workflow
        workflow = {
            "version": "0.1",
            "metadata": {
                "name": metadata.name,
                "description": metadata.description,
                "created_at": metadata.created_at.isoformat(),
                "version": metadata.version,
                "tags": metadata.tags,
                "complexity": metadata.complexity
            },
            "graph": {
                "nodes": [
                    node.model_dump() for node in [start_node, llm_node, end_node]
                ],
                "edges": [
                    edge.model_dump() for edge in edges
                ]
            },
            "environment_variables": [],
            "conversation_variables": []
        }

        logger.info(f"✅ Generated workflow with {len(workflow['graph']['nodes'])} nodes")
        return workflow

    def workflow_to_yaml(self, workflow: Dict[str, Any]) -> str:
        """
        Convert workflow dict to YAML string.

        Args:
            workflow: Workflow dictionary

        Returns:
            YAML string
        """
        return yaml.dump(workflow, default_flow_style=False, sort_keys=False)

    def workflow_to_json(self, workflow: Dict[str, Any]) -> str:
        """
        Convert workflow dict to JSON string.

        Args:
            workflow: Workflow dictionary

        Returns:
            JSON string
        """
        return json.dumps(workflow, indent=2)

    def validate_workflow(self, workflow: Dict[str, Any]) -> tuple[bool, List[str]]:
        """
        Validate workflow structure.

        Args:
            workflow: Workflow dictionary

        Returns:
            Tuple of (is_valid, list of error messages)
        """
        errors = []

        # Check required top-level keys
        required_keys = ["version", "metadata", "graph"]
        for key in required_keys:
            if key not in workflow:
                errors.append(f"Missing required key: {key}")

        if "graph" in workflow:
            graph = workflow["graph"]

            # Check for nodes and edges
            if "nodes" not in graph:
                errors.append("Missing 'nodes' in graph")
            if "edges" not in graph:
                errors.append("Missing 'edges' in graph")

            if "nodes" in graph and "edges" in graph:
                nodes = graph["nodes"]
                edges = graph["edges"]

                # Check for start and end nodes
                node_types = [node.get("type") for node in nodes]
                if "start" not in node_types:
                    errors.append("Missing start node")
                if "end" not in node_types:
                    errors.append("Missing end node")

                # Validate edge connections
                node_ids = {node.get("id") for node in nodes}
                for edge in edges:
                    source = edge.get("source")
                    target = edge.get("target")
                    if source not in node_ids:
                        errors.append(f"Edge source '{source}' not found in nodes")
                    if target not in node_ids:
                        errors.append(f"Edge target '{target}' not found in nodes")

        return len(errors) == 0, errors


# Global DSL service instance
dsl_service = DSLService()