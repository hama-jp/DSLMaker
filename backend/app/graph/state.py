"""
LangGraph State Definition for Workflow Generation
"""

from typing import TypedDict, Optional, List, Dict, Any
from pydantic import BaseModel


class ClarifiedRequirements(BaseModel):
    """Structured requirements from Requirements Agent."""
    business_intent: str
    input_data: Dict[str, Any]
    expected_output: Dict[str, Any]
    business_logic: List[str]
    integrations: List[str]
    performance_requirements: Optional[Dict[str, Any]] = None
    constraints: List[str]
    confidence_score: float  # 0-1


class WorkflowArchitecture(BaseModel):
    """Workflow architecture from Architecture Agent."""
    pattern_id: str
    pattern_name: str
    node_types: List[str]
    edge_structure: List[Dict[str, str]]
    complexity: str  # simple, moderate, complex
    estimated_nodes: int
    reasoning: str


class ConfiguredNode(BaseModel):
    """Fully configured Dify node."""
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, int]


class QualityIssue(BaseModel):
    """Individual quality issue."""
    severity: str  # high, medium, low
    node_id: Optional[str] = None  # None for general issues
    issue: str
    recommendation: str


class QualityAssessment(BaseModel):
    """Quality report from QA Agent."""
    overall_score: float  # 0-100
    completeness_score: float
    correctness_score: float
    best_practices_score: float
    issues: List[QualityIssue]
    recommendations: List[str]
    should_retry: bool


class WorkflowGenerationState(TypedDict):
    """
    State managed by LangGraph throughout the workflow generation process.

    This state is passed between agents and updated at each stage.
    """
    # Input
    user_request: str
    preferences: Optional[Dict[str, Any]]

    # Agent outputs
    requirements: Optional[ClarifiedRequirements]
    architecture: Optional[WorkflowArchitecture]
    configured_nodes: List[ConfiguredNode]
    configured_edges: List[Dict[str, Any]]
    quality_report: Optional[QualityAssessment]

    # Final output
    final_dsl: Optional[Dict[str, Any]]

    # Control flow
    iterations: int
    max_iterations: int
    current_agent: Optional[str]

    # Context
    retrieved_patterns: List[Dict[str, Any]]
    error_history: List[str]