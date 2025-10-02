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

    SYSTEM_PROMPT = """You are a Dify DSL workflow quality assurance expert.

Validate the workflow against EXACT Dify DSL requirements and best practices.

**Dify DSL Structure Requirements**:

1. **Node Structure** - Every node MUST have:
   - id (string, unique)
   - type (valid Dify type: start, llm, answer, etc.)
   - data (object with title, type, desc, selected fields)
   - position (object with x, y coordinates)

2. **Data Object Requirements**:
   - title (string, user-friendly name)
   - type (string, must match node type)
   - desc (string, can be empty)
   - selected (boolean, usually false)

3. **Start Node Validation**:
   - id must be "start"
   - variables array (can be empty or have proper variable definitions)
   - Each variable needs: variable/type/label/required fields

4. **LLM Node Validation**:
   - model object with provider/name/mode/completion_params
   - prompt_template array with role/text objects
   - memory, context, vision objects present
   - Variable references in prompts use {{{{#node_id.field#}}}} format

5. **Answer/End Node Validation**:
   - answer field with proper variable reference
   - Must reference output from previous node

6. **Edge Validation**:
   - Each edge has id, source, target
   - source and target must reference existing node ids
   - No self-loops (source != target)
   - All nodes except start should have incoming edge
   - All nodes except answer/end should have outgoing edge

7. **Variable Reference Validation**:
   - Format: {{{{#node_id.output_field#}}}}
   - node_id must exist in workflow
   - Common outputs: llm.text, code.result, start.variable_name

**Quality Scoring**:

**Completeness (0-100)**:
- All required Dify DSL fields present (30pts)
- No missing node connections (30pts)
- Business logic fully implemented (40pts)

**Correctness (0-100)**:
- Valid Dify node types (25pts)
- Proper variable references (25pts)
- Valid edge connections (25pts)
- No structural errors (25pts)

**Best Practices (0-100)**:
- Descriptive titles (20pts)
- Proper LLM configuration (20pts)
- Clean data flow (20pts)
- Error handling (20pts)
- Security (20pts)

**Critical Issues** (require retry if present):
- Missing required DSL fields (title, type, desc, selected)
- Invalid variable reference format
- Disconnected nodes
- Invalid node type
- Missing model configuration in LLM nodes
- Circular dependencies

IMPORTANT: Return ONLY valid JSON without markdown code blocks.

Return assessment as valid JSON:
{{
  "overall_score": 85.5,
  "completeness_score": 90.0,
  "correctness_score": 85.0,
  "best_practices_score": 80.0,
  "issues": [
    {{
      "severity": "high",
      "node_id": "llm_1",
      "issue": "Description of issue",
      "recommendation": "How to fix"
    }},
    {{
      "severity": "medium",
      "node_id": null,
      "issue": "General issue not specific to a node",
      "recommendation": "General fix"
    }}
  ],
  "recommendations": [
    "General improvement suggestion 1",
    "General improvement suggestion 2"
  ],
  "should_retry": false
}}

**IMPORTANT**:
- node_id can be null for general issues not tied to specific node
- node_id must be a valid node id (string) when specified
- severity must be: "high", "medium", or "low"
- Set should_retry=true only if overall_score < 70 and issues can be fixed by reconfiguration"""

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
                logger.warning("⚠️ Quality Issues Detected:")
                for issue in quality_report.issues[:5]:  # Log top 5
                    node_info = issue.node_id if issue.node_id else "General"
                    logger.warning(
                        f"   [{issue.severity.upper()}] {node_info}: "
                        f"{issue.issue}"
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