"""
Workflow Models - Pydantic models for Dify workflow structures
"""

from typing import Dict, List, Any, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class NodeBase(BaseModel):
    """Base node model."""
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})


class EdgeBase(BaseModel):
    """Base edge model."""
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class WorkflowMetadata(BaseModel):
    """Workflow metadata."""
    name: str
    description: str
    created_at: datetime = Field(default_factory=datetime.now)
    version: str = "1.0.0"
    tags: List[str] = Field(default_factory=list)
    complexity: Literal["simple", "moderate", "complex"] = "moderate"
    node_count: int = Field(default=0, description="Number of nodes in the workflow")
    edge_count: int = Field(default=0, description="Number of edges in the workflow")
    iteration_count: int = Field(default=0, description="Number of refinement iterations performed")


class WorkflowRequest(BaseModel):
    """Request model for workflow generation."""
    description: str = Field(..., description="Natural language description of the workflow")
    preferences: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="User preferences for generation"
    )
    use_rag: bool = Field(
        default=True,
        description="Whether to use RAG for pattern retrieval"
    )


class WorkflowResponse(BaseModel):
    """Response model for workflow generation."""
    workflow: Dict[str, Any] = Field(..., description="Generated workflow DSL")
    metadata: WorkflowMetadata
    quality_score: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Quality assessment score (0-100)"
    )
    suggestions: List[str] = Field(
        default_factory=list,
        description="Suggestions for improvement"
    )
    generation_time: float = Field(..., description="Time taken to generate (seconds)")


class PatternMetadata(BaseModel):
    """Metadata for workflow patterns."""
    pattern_id: str
    name: str
    description: str
    complexity: Literal["simple", "moderate", "complex"]
    node_count: int
    use_cases: List[str]
    tags: List[str] = Field(default_factory=list)


class WorkflowPattern(BaseModel):
    """Workflow pattern for knowledge base."""
    metadata: PatternMetadata
    workflow: Dict[str, Any]
    content: str = Field(..., description="Text representation for embedding")


class GenerationRequest(BaseModel):
    """Internal request for multi-agent generation."""
    description: str
    preferences: Dict[str, Any]
    retrieved_patterns: List[Dict[str, Any]] = Field(default_factory=list)
    stage: Literal["requirements", "architecture", "configuration", "quality"] = "requirements"


class DifyExecutionRequest(BaseModel):
    """Request model for executing a DSL workflow via MCP."""
    dify_server_command: List[str] = Field(..., description="The command and arguments to run the Dify MCP server.")
    dsl_content: str = Field(..., description="The DSL content to be executed.")


class DifyExecutionResponse(BaseModel):
    """Response model for a DSL workflow execution."""
    status: Literal["success", "error"] = Field(..., description="The execution status.")
    result: str = Field(..., description="The output from the workflow execution or an error message.")