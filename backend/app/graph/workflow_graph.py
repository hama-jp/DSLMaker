"""
LangGraph Workflow Graph
Multi-agent workflow generation orchestration
"""

import logging
from typing import Dict, Any, Literal

from langgraph.graph import StateGraph, END

from app.graph.state import WorkflowGenerationState
from app.agents import (
    RequirementsAgent,
    ArchitectureAgent,
    ConfigurationAgent,
    QualityAgent
)

logger = logging.getLogger(__name__)


# Initialize agents
requirements_agent = RequirementsAgent()
architecture_agent = ArchitectureAgent()
configuration_agent = ConfigurationAgent()
quality_agent = QualityAgent()


async def requirements_node(state: WorkflowGenerationState) -> Dict[str, Any]:
    """Requirements analysis stage."""
    logger.info("🚀 Starting Requirements Analysis...")
    return await requirements_agent.execute(state)


async def architecture_node(state: WorkflowGenerationState) -> Dict[str, Any]:
    """Architecture design stage."""
    logger.info("🏗️ Starting Architecture Design...")
    return await architecture_agent.execute(state)


async def configuration_node(state: WorkflowGenerationState) -> Dict[str, Any]:
    """Node configuration stage."""
    logger.info("⚙️ Starting Node Configuration...")
    return await configuration_agent.execute(state)


async def quality_node(state: WorkflowGenerationState) -> Dict[str, Any]:
    """Quality assurance stage."""
    logger.info("🔍 Starting Quality Assessment...")
    return await quality_agent.execute(state)


async def finalize_node(state: WorkflowGenerationState) -> Dict[str, Any]:
    """Finalize workflow and generate DSL."""
    logger.info("📦 Finalizing Workflow...")

    try:
        # Build final DSL structure
        final_dsl = {
            "app": {
                "name": "AI-Generated Workflow",
                "description": state["requirements"].business_intent if state.get("requirements") else "Generated workflow",
                "mode": "workflow",
                "icon": "🤖",
                "icon_background": "#EFF1F5"
            },
            "kind": "app",
            "version": "0.1.5",
            "workflow": {
                "environment_variables": [],
                "features": {},
                "graph": {
                    "nodes": [node.model_dump() for node in state.get("configured_nodes", [])],
                    "edges": state.get("configured_edges", []),
                    "viewport": {"x": 0, "y": 0, "zoom": 1}
                }
            }
        }

        logger.info(
            f"✅ Workflow finalized\n"
            f"   Nodes: {len(state.get('configured_nodes', []))}\n"
            f"   Edges: {len(state.get('configured_edges', []))}\n"
            f"   Quality: {state['quality_report'].overall_score:.1f}/100"
        )

        return {
            "final_dsl": final_dsl,
            "current_agent": "Finalize"
        }

    except Exception as e:
        logger.error(f"❌ Finalization failed: {e}")
        return {
            "error_history": state.get("error_history", []) + [f"Finalize: {str(e)}"]
        }


def should_iterate(state: WorkflowGenerationState) -> Literal["iterate", "finalize"]:
    """
    Decide whether to iterate (retry configuration) or finalize workflow.

    Iteration happens when:
    1. Quality score is below threshold (< 70)
    2. QA agent recommends retry
    3. Haven't exceeded max iterations
    """
    quality_report = state.get("quality_report")
    iterations = state.get("iterations", 0)
    max_iterations = state.get("max_iterations", 3)

    if not quality_report:
        logger.warning("⚠️ No quality report - proceeding to finalize")
        return "finalize"

    should_retry = (
        quality_report.should_retry
        and quality_report.overall_score < 70
        and iterations < max_iterations
    )

    if should_retry:
        logger.info(
            f"🔄 Iteration {iterations + 1}/{max_iterations} triggered\n"
            f"   Quality Score: {quality_report.overall_score:.1f}\n"
            f"   Reason: {quality_report.issues[0]['issue'] if quality_report.issues else 'Low score'}"
        )
        return "iterate"
    else:
        logger.info(f"✅ Quality acceptable ({quality_report.overall_score:.1f}) - finalizing")
        return "finalize"


def create_workflow_graph() -> StateGraph:
    """
    Create and configure the LangGraph workflow.

    Flow:
    1. Requirements → 2. Architecture → 3. Configuration → 4. Quality
                                                              ↓
                                                        (if retry)
                                                              ↓
                                                       3. Configuration (retry)
                                                              ↓
                                                        5. Finalize → END
    """
    # Create graph
    workflow = StateGraph(WorkflowGenerationState)

    # Add nodes
    workflow.add_node("requirements", requirements_node)
    workflow.add_node("architecture", architecture_node)
    workflow.add_node("configuration", configuration_node)
    workflow.add_node("quality", quality_node)
    workflow.add_node("finalize", finalize_node)

    # Define linear flow
    workflow.set_entry_point("requirements")
    workflow.add_edge("requirements", "architecture")
    workflow.add_edge("architecture", "configuration")
    workflow.add_edge("configuration", "quality")

    # Conditional edge from quality
    workflow.add_conditional_edges(
        "quality",
        should_iterate,
        {
            "iterate": "configuration",  # Retry configuration with feedback
            "finalize": "finalize"       # Proceed to finalization
        }
    )

    # End after finalization
    workflow.add_edge("finalize", END)

    logger.info("✅ Workflow graph created with 5 nodes and conditional iteration")

    return workflow.compile()


# Create compiled graph instance
workflow_graph = create_workflow_graph()