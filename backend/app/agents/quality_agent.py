"""
Quality Assurance Agent
Validates and scores workflow quality
"""

import json
import logging
from typing import Dict, Any

from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.agents.base import BaseAgent
from app.graph.state import WorkflowGenerationState, QualityAssessment
from app.services.validation_service import validation_service

logger = logging.getLogger(__name__)


class QualityAgent(BaseAgent):
    """
    Assesses workflow quality and provides improvement recommendations.

    Responsibilities:
    1. Validate workflow structure and completeness
    2. Check node configurations for correctness
    3. Verify data flow and variable references
    4. Assess adherence to best practices
    5. Identify potential issues and risks
    6. Provide actionable improvement recommendations
    7. Decide if iteration is needed
    """

    SYSTEM_PROMPT = """You are a Dify workflow quality assurance expert.

Your task is to thoroughly assess the generated workflow for quality, correctness, and best practices.

Quality Assessment Criteria:

**1. Completeness (0-100)**
- All required nodes are present
- Start node has proper input variables
- End node has proper output mappings
- No dangling or disconnected nodes
- All business logic steps are implemented

**2. Correctness (0-100)**
- Variable references are valid ({{#node_id.variable#}})
- Node types match their purpose
- Conditional logic is properly structured
- Data types are compatible
- No circular dependencies
- Edge connections are valid

**3. Best Practices (0-100)**
- Clear node titles and descriptions
- Appropriate LLM temperatures
- Proper error handling
- Efficient data flow
- Modular design
- Reasonable token limits
- Security considerations

**Common Issues to Check:**
- Missing variable references
- Invalid node connections
- Unreachable nodes
- Overly complex flows
- Missing error handling
- Poor prompt engineering
- Incorrect data types
- Missing required parameters

IMPORTANT: Return ONLY valid JSON without markdown code blocks or explanations.

Return assessment as valid JSON:
{{
  "overall_score": 85.5,
  "completeness_score": 90.0,
  "correctness_score": 85.0,
  "best_practices_score": 80.0,
  "issues": [
    {{
      "severity": "high|medium|low",
      "node_id": "llm_1",
      "issue": "Description of issue",
      "recommendation": "How to fix"
    }}
  ],
  "recommendations": [
    "General improvement suggestion 1",
    "General improvement suggestion 2"
  ],
  "should_retry": false
}}

Set should_retry to true only if there are critical issues (overall_score < 70) that can be fixed by reconfiguration."""

    def __init__(self):
        super().__init__(name="Quality Assurance Agent")

    async def execute(self, state: WorkflowGenerationState) -> Dict[str, Any]:
        """
        Assess workflow quality and provide recommendations.

        Args:
            state: Current workflow generation state

        Returns:
            Dictionary with 'quality_report' and decision on whether to retry
        """
        requirements = state.get("requirements")
        architecture = state.get("architecture")
        configured_nodes = state.get("configured_nodes", [])
        configured_edges = state.get("configured_edges", [])

        if not all([requirements, architecture, configured_nodes]):
            raise ValueError("Complete workflow must be generated before quality assessment")

        logger.info(
            f"🔍 {self.name} assessing {len(configured_nodes)} nodes..."
        )

        try:
            # Ensure LLM is ready
            llm = await self.ensure_llm()

            # Prepare workflow representation
            workflow_json = {
                "nodes": [node.model_dump() for node in configured_nodes],
                "edges": configured_edges
            }

            # Create prompt with full workflow
            prompt = ChatPromptTemplate.from_messages([
                ("system", self.SYSTEM_PROMPT),
                ("user", """Original Requirements:
{requirements}

Architecture Design:
{architecture}

Generated Workflow:
{workflow}

Current Iteration: {iteration}
Max Iterations: {max_iterations}

Perform comprehensive quality assessment. Return JSON with scores, issues, and recommendations.""")
            ])

            # Create chain with JSON parser
            parser = JsonOutputParser()
            chain = prompt | llm | parser

            # Execute DSL validation first
            logger.info("🔍 Running DSL validation...")
            dsl_validation = validation_service.validate_workflow(workflow_json)

            # Add validation issues to context
            validation_context = ""
            if not dsl_validation.is_valid:
                validation_context = f"\nDSL Validation Issues ({dsl_validation.errors_count} errors, {dsl_validation.warnings_count} warnings):\n"
                for issue in dsl_validation.issues[:10]:  # Top 10 issues
                    validation_context += f"- [{issue.severity.upper()}] {issue.message}"
                    if issue.location:
                        validation_context += f" (at {issue.location})"
                    validation_context += "\n"

            # Execute LLM quality assessment
            result = await chain.ainvoke({
                "requirements": json.dumps({
                    "business_intent": requirements.business_intent,
                    "input_data": requirements.input_data,
                    "expected_output": requirements.expected_output,
                    "business_logic": requirements.business_logic
                }, indent=2),
                "architecture": json.dumps({
                    "pattern": architecture.pattern_name,
                    "complexity": architecture.complexity,
                    "node_types": architecture.node_types
                }, indent=2),
                "workflow": json.dumps(workflow_json, indent=2) + validation_context,
                "iteration": state.get("iterations", 0),
                "max_iterations": state.get("max_iterations", 3)
            })

            # Validate and create quality assessment
            quality_report = QualityAssessment(**result)

            # Reduce score if DSL validation failed
            if not dsl_validation.is_valid:
                penalty = min(20, dsl_validation.errors_count * 5)  # Max 20 point penalty
                quality_report.overall_score = max(0, quality_report.overall_score - penalty)
                quality_report.correctness_score = max(0, quality_report.correctness_score - penalty)
                logger.warning(f"⚠️ Applied {penalty} point penalty for DSL validation errors")

            # Log assessment results
            logger.info(
                f"✅ {self.name} completed\n"
                f"   Overall Score: {quality_report.overall_score:.1f}/100\n"
                f"   Completeness: {quality_report.completeness_score:.1f}\n"
                f"   Correctness: {quality_report.correctness_score:.1f}\n"
                f"   Best Practices: {quality_report.best_practices_score:.1f}\n"
                f"   Issues Found: {len(quality_report.issues)}\n"
                f"   Should Retry: {quality_report.should_retry}"
            )

            # Log issues if any
            if quality_report.issues:
                logger.warning(f"⚠️ Quality Issues Detected:")
                for issue in quality_report.issues[:5]:  # Log top 5
                    logger.warning(
                        f"   [{issue['severity'].upper()}] {issue.get('node_id', 'General')}: "
                        f"{issue['issue']}"
                    )

            return {
                "quality_report": quality_report,
                "current_agent": self.name
            }

        except Exception as e:
            logger.error(f"❌ {self.name} failed: {e}")
            # Create pessimistic quality report on failure
            return {
                "quality_report": QualityAssessment(
                    overall_score=50.0,
                    completeness_score=50.0,
                    correctness_score=50.0,
                    best_practices_score=50.0,
                    issues=[{
                        "severity": "high",
                        "node_id": "quality_agent",
                        "issue": "Quality assessment failed",
                        "recommendation": "Manual review recommended"
                    }],
                    recommendations=[
                        "Quality assessment encountered errors",
                        "Manual workflow review is recommended"
                    ],
                    should_retry=False  # Don't retry if QA itself failed
                ),
                "error_history": state.get("error_history", []) + [f"Quality: {str(e)}"],
                "current_agent": self.name
            }