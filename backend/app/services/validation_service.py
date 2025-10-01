"""
DSL Validation Service
Validates Dify workflow DSL for correctness and compliance with Dify specification
"""

from typing import Dict, List, Any, Optional, Set
from pydantic import BaseModel
import logging
import re

logger = logging.getLogger(__name__)


class ValidationIssue(BaseModel):
    """Represents a validation issue."""
    severity: str  # "error", "warning", "info"
    message: str
    location: Optional[str] = None  # e.g., "node_123", "edge_456"
    suggestion: Optional[str] = None


class ValidationResult(BaseModel):
    """Result of DSL validation."""
    is_valid: bool
    issues: List[ValidationIssue] = []
    warnings_count: int = 0
    errors_count: int = 0

    def add_error(self, message: str, location: Optional[str] = None, suggestion: Optional[str] = None):
        """Add an error issue."""
        self.issues.append(ValidationIssue(
            severity="error",
            message=message,
            location=location,
            suggestion=suggestion
        ))
        self.errors_count += 1
        self.is_valid = False

    def add_warning(self, message: str, location: Optional[str] = None, suggestion: Optional[str] = None):
        """Add a warning issue."""
        self.issues.append(ValidationIssue(
            severity="warning",
            message=message,
            location=location,
            suggestion=suggestion
        ))
        self.warnings_count += 1

    def add_info(self, message: str, location: Optional[str] = None):
        """Add an informational issue."""
        self.issues.append(ValidationIssue(
            severity="info",
            message=message,
            location=location
        ))


class DSLValidationService:
    """Service for validating Dify workflow DSL."""

    # Valid node types according to Dify specification
    VALID_NODE_TYPES = {
        "start", "end", "llm", "knowledge-retrieval", "code", "http-request",
        "if-else", "iteration", "parameter-extractor", "question-classifier",
        "variable-aggregator", "template-transform", "assigner", "tool",
        "conversation-variable-assigner"
    }

    # Required fields for nodes
    REQUIRED_NODE_FIELDS = {"id", "data"}
    REQUIRED_NODE_DATA_FIELDS = {"type", "title"}

    # Required fields for edges
    REQUIRED_EDGE_FIELDS = {"source", "target"}

    # Variable reference pattern: {{#node_id.variable#}}
    VARIABLE_PATTERN = re.compile(r'\{\{#([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_\[\]]+)#\}\}')

    def validate_workflow(self, workflow: Dict[str, Any]) -> ValidationResult:
        """
        Validate complete workflow DSL.

        Args:
            workflow: Complete Dify workflow dictionary

        Returns:
            ValidationResult with all issues found
        """
        result = ValidationResult(is_valid=True)

        try:
            # 1. Validate top-level structure
            self._validate_structure(workflow, result)

            # 2. Extract app data
            app_data = workflow.get("app", {})

            # 3. Validate nodes
            nodes = app_data.get("nodes", [])
            self._validate_nodes(nodes, result)

            # 4. Validate edges
            edges = app_data.get("edges", [])
            node_ids = {node.get("id") for node in nodes}
            self._validate_edges(edges, node_ids, result)

            # 5. Validate start and end nodes
            self._validate_start_end_nodes(nodes, result)

            # 6. Validate variable references
            self._validate_variable_references(workflow, result)

            # 7. Validate workflow connectivity
            self._validate_connectivity(nodes, edges, result)

            # Log summary
            if result.is_valid:
                logger.info(
                    f"✅ DSL validation passed "
                    f"({len(nodes)} nodes, {len(edges)} edges, "
                    f"{result.warnings_count} warnings)"
                )
            else:
                logger.warning(
                    f"⚠️ DSL validation failed "
                    f"({result.errors_count} errors, {result.warnings_count} warnings)"
                )

        except Exception as e:
            result.add_error(
                message=f"Validation failed with exception: {str(e)}",
                suggestion="Check workflow structure and format"
            )
            logger.error(f"❌ DSL validation exception: {e}", exc_info=True)

        return result

    def _validate_structure(self, workflow: Dict, result: ValidationResult):
        """Validate top-level workflow structure."""
        if "app" not in workflow:
            result.add_error(
                message="Missing 'app' key in workflow",
                suggestion="Ensure workflow has top-level 'app' object"
            )
            return

        app = workflow["app"]

        # Check required app fields
        required_app_fields = {"name", "description", "nodes", "edges"}
        missing_fields = required_app_fields - set(app.keys())

        if missing_fields:
            result.add_error(
                message=f"Missing required app fields: {', '.join(missing_fields)}",
                location="app",
                suggestion="Add missing fields to app object"
            )

    def _validate_nodes(self, nodes: List[Dict], result: ValidationResult):
        """Validate all nodes."""
        if not nodes:
            result.add_error(
                message="Workflow has no nodes",
                suggestion="Add at least start and end nodes"
            )
            return

        node_ids: Set[str] = set()

        for i, node in enumerate(nodes):
            # Check required fields
            missing_fields = self.REQUIRED_NODE_FIELDS - set(node.keys())
            if missing_fields:
                result.add_error(
                    message=f"Node {i} missing required fields: {', '.join(missing_fields)}",
                    location=f"node_{i}",
                    suggestion="Add required fields to node"
                )
                continue

            node_id = node.get("id")
            node_data = node.get("data", {})

            # Check duplicate IDs
            if node_id in node_ids:
                result.add_error(
                    message=f"Duplicate node ID: {node_id}",
                    location=node_id,
                    suggestion="Ensure all node IDs are unique"
                )
            else:
                node_ids.add(node_id)

            # Validate node data
            self._validate_node_data(node_data, node_id, result)

    def _validate_node_data(self, node_data: Dict, node_id: str, result: ValidationResult):
        """Validate individual node data."""
        # Check required data fields
        missing_fields = self.REQUIRED_NODE_DATA_FIELDS - set(node_data.keys())
        if missing_fields:
            result.add_error(
                message=f"Node data missing required fields: {', '.join(missing_fields)}",
                location=node_id,
                suggestion="Add 'type' and 'title' to node data"
            )
            return

        node_type = node_data.get("type")

        # Validate node type
        if node_type not in self.VALID_NODE_TYPES:
            result.add_error(
                message=f"Invalid node type: '{node_type}'",
                location=node_id,
                suggestion=f"Use one of: {', '.join(sorted(self.VALID_NODE_TYPES))}"
            )

        # Type-specific validation
        self._validate_node_type_specific(node_type, node_data, node_id, result)

    def _validate_node_type_specific(
        self,
        node_type: str,
        node_data: Dict,
        node_id: str,
        result: ValidationResult
    ):
        """Validate node-type-specific requirements."""
        # LLM nodes
        if node_type == "llm":
            if "model" not in node_data:
                result.add_warning(
                    message="LLM node missing 'model' configuration",
                    location=node_id,
                    suggestion="Specify model (e.g., gpt-4, gpt-4o-mini)"
                )

        # Code nodes
        elif node_type == "code":
            if "code" not in node_data and "code_language" not in node_data:
                result.add_warning(
                    message="Code node missing 'code' or 'code_language'",
                    location=node_id
                )

        # HTTP request nodes
        elif node_type == "http-request":
            if "api" not in node_data or "api_url" not in node_data.get("api", {}):
                result.add_warning(
                    message="HTTP node missing API URL configuration",
                    location=node_id,
                    suggestion="Add 'api' with 'api_url' field"
                )

        # If-else nodes
        elif node_type == "if-else":
            if "conditions" not in node_data:
                result.add_warning(
                    message="If-else node missing 'conditions'",
                    location=node_id,
                    suggestion="Define conditions for branching logic"
                )

    def _validate_edges(self, edges: List[Dict], node_ids: Set[str], result: ValidationResult):
        """Validate all edges."""
        if not edges:
            result.add_warning(
                message="Workflow has no edges",
                suggestion="Connect nodes with edges to define flow"
            )
            return

        for i, edge in enumerate(edges):
            # Check required fields
            missing_fields = self.REQUIRED_EDGE_FIELDS - set(edge.keys())
            if missing_fields:
                result.add_error(
                    message=f"Edge {i} missing required fields: {', '.join(missing_fields)}",
                    location=f"edge_{i}",
                    suggestion="Add 'source' and 'target' to edge"
                )
                continue

            source = edge.get("source")
            target = edge.get("target")

            # Validate source exists
            if source not in node_ids:
                result.add_error(
                    message=f"Edge source node '{source}' does not exist",
                    location=f"edge_{i}",
                    suggestion="Ensure edge source matches an existing node ID"
                )

            # Validate target exists
            if target not in node_ids:
                result.add_error(
                    message=f"Edge target node '{target}' does not exist",
                    location=f"edge_{i}",
                    suggestion="Ensure edge target matches an existing node ID"
                )

    def _validate_start_end_nodes(self, nodes: List[Dict], result: ValidationResult):
        """Validate presence of start and end nodes."""
        node_types = [node.get("data", {}).get("type") for node in nodes]

        if "start" not in node_types:
            result.add_error(
                message="Workflow missing 'start' node",
                suggestion="Add a start node to define workflow entry point"
            )

        if "end" not in node_types:
            result.add_error(
                message="Workflow missing 'end' node",
                suggestion="Add an end node to define workflow exit point"
            )

        # Check for multiple start/end nodes
        if node_types.count("start") > 1:
            result.add_warning(
                message="Workflow has multiple 'start' nodes",
                suggestion="Typically only one start node is needed"
            )

        if node_types.count("end") > 1:
            result.add_info(
                message="Workflow has multiple 'end' nodes (may be intentional for branching)"
            )

    def _validate_variable_references(self, workflow: Dict, result: ValidationResult):
        """Validate variable references in workflow."""
        # Extract all node IDs
        nodes = workflow.get("app", {}).get("nodes", [])
        node_ids = {node.get("id") for node in nodes}

        # Find all variable references in the workflow
        workflow_str = str(workflow)
        matches = self.VARIABLE_PATTERN.findall(workflow_str)

        for node_id, variable in matches:
            if node_id not in node_ids:
                result.add_warning(
                    message=f"Variable reference to non-existent node: {{{{#{node_id}.{variable}#}}}}",
                    suggestion=f"Ensure node '{node_id}' exists or update variable reference"
                )

    def _validate_connectivity(self, nodes: List[Dict], edges: List[Dict], result: ValidationResult):
        """Validate workflow connectivity (all nodes reachable from start)."""
        if not nodes or not edges:
            return

        # Build adjacency list
        graph: Dict[str, List[str]] = {node["id"]: [] for node in nodes}
        for edge in edges:
            source = edge.get("source")
            target = edge.get("target")
            if source in graph:
                graph[source].append(target)

        # Find start node
        start_nodes = [
            node["id"] for node in nodes
            if node.get("data", {}).get("type") == "start"
        ]

        if not start_nodes:
            return  # Already reported as error

        # BFS from start to find reachable nodes
        start_id = start_nodes[0]
        reachable = set()
        queue = [start_id]

        while queue:
            current = queue.pop(0)
            if current in reachable:
                continue
            reachable.add(current)
            queue.extend(graph.get(current, []))

        # Find unreachable nodes (excluding start)
        all_node_ids = {node["id"] for node in nodes}
        unreachable = all_node_ids - reachable

        if unreachable:
            result.add_warning(
                message=f"Unreachable nodes detected: {', '.join(unreachable)}",
                suggestion="Ensure all nodes are connected to the workflow path"
            )

    def validate_node(self, node: Dict[str, Any]) -> ValidationResult:
        """
        Validate a single node.

        Args:
            node: Node dictionary

        Returns:
            ValidationResult
        """
        result = ValidationResult(is_valid=True)

        # Check structure
        missing_fields = self.REQUIRED_NODE_FIELDS - set(node.keys())
        if missing_fields:
            result.add_error(
                message=f"Node missing required fields: {', '.join(missing_fields)}"
            )
            return result

        # Validate node data
        node_id = node.get("id", "unknown")
        node_data = node.get("data", {})
        self._validate_node_data(node_data, node_id, result)

        return result

    def validate_edges(self, edges: List[Dict], node_ids: Set[str]) -> ValidationResult:
        """
        Validate edges.

        Args:
            edges: List of edge dictionaries
            node_ids: Set of valid node IDs

        Returns:
            ValidationResult
        """
        result = ValidationResult(is_valid=True)
        self._validate_edges(edges, node_ids, result)
        return result


# Global validation service instance
validation_service = DSLValidationService()
