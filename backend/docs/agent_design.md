# AI Agent Architecture for Dify DSL Generation

## Overview
Design and implement a multi-agent system that generates accurate Dify DSL workflows based on user requirements.

## Current Architecture (Existing)

```
User Input
    ↓
RequirementsAgent → Parse user intent and extract requirements
    ↓
ArchitectureAgent → Design workflow structure and node types
    ↓
ConfigurationAgent → Configure individual nodes with details
    ↓
QualityAgent → Validate and score the generated workflow
    ↓
FinalizeNode → Build final Dify DSL structure
```

## Problem Analysis

### Current Issues
1. **Generic Prompts**: Agents don't have detailed knowledge of Dify DSL structure
2. **No Examples**: Prompts lack concrete examples from real Dify workflows
3. **Validation Gap**: No schema validation against actual Dify requirements
4. **Node Details**: Missing proper node configuration (providers, models, parameters)
5. **Edge Cases**: Doesn't handle complex scenarios (iteration, conditional branches)

### What We Need
1. **DSL-Aware Prompts**: Agents must understand exact Dify DSL schema
2. **Example-Based Learning**: Use real Dify workflows as references
3. **Schema Validation**: Validate against Dify's Pydantic models
4. **Node Templates**: Proper configuration for each node type
5. **Test Coverage**: Unit tests for each agent with expected inputs/outputs

## Improved Agent Design

### 1. Requirements Agent
**Responsibility**: Parse user intent and extract structured requirements

**Input**: Natural language user request
**Output**: Structured requirements object

**Improvements Needed**:
- Add DSL-specific requirement extraction (node types, data flow)
- Include examples of common workflow patterns
- Extract explicit node configurations from user input

**Test Cases**:
```python
# Test 1: Simple LLM workflow
input: "Create a chatbot that answers questions using GPT-4"
expected: RequirementsAnalysis(
    business_intent="Q&A Chatbot",
    required_capabilities=["llm", "text_input", "text_output"],
    constraints=["use GPT-4"],
    ...
)

# Test 2: RAG workflow
input: "Build a document search system with knowledge base"
expected: RequirementsAnalysis(
    required_capabilities=["knowledge-retrieval", "llm", "document_input"],
    ...
)
```

### 2. Architecture Agent
**Responsibility**: Design workflow structure (nodes + edges)

**Input**: Requirements + Pattern library
**Output**: Workflow architecture (node types, connections, complexity)

**Improvements Needed**:
- Use actual Dify workflow patterns from knowledge base
- Include node positioning logic
- Handle complex patterns (iteration, conditional branches)
- Specify exact node type names from Dify

**Enhanced Prompt Structure**:
```
SYSTEM:
You are a Dify workflow architect. Design workflows using these exact node types:

**Available Dify Node Types** (with real examples):
1. start - Entry point
   Example: {"type": "start", "data": {"variables": [...]}}

2. llm - LLM processing
   Example: {"type": "llm", "data": {"model": {"provider": "openai", "name": "gpt-4"}, ...}}

3. tool - External tool integration
   Example: {"type": "tool", "data": {"provider_name": "tavily", "tool_name": "search", ...}}

[... etc for all 15+ node types with examples]

USER:
Requirements: {requirements}
Similar Patterns: {retrieved_patterns}

Design a workflow architecture that:
1. Uses appropriate Dify node types
2. Creates proper data flow
3. Includes all necessary configurations
```

**Test Cases**:
```python
# Test 1: Simple flow
input: RequirementsAnalysis(intent="Q&A bot", capabilities=["llm"])
expected: WorkflowArchitecture(
    node_types=["start", "llm", "end"],
    edges=[{"from": "start", "to": "llm"}, {"from": "llm", "to": "end"}],
    complexity="simple"
)

# Test 2: Iteration flow
input: RequirementsAnalysis(intent="Process list of items", capabilities=["iteration", "llm"])
expected: WorkflowArchitecture(
    node_types=["start", "iteration", "llm", "end"],
    has_iteration=True,
    ...
)
```

### 3. Configuration Agent
**Responsibility**: Configure each node with proper Dify parameters

**Input**: Architecture + Node templates
**Output**: Fully configured nodes with all required fields

**Improvements Needed**:
- Use actual Dify Pydantic models for validation
- Include proper provider configurations (openai, anthropic, etc.)
- Handle node-specific parameters (temperature, max_tokens, etc.)
- Set correct data types and variable references

**Enhanced Prompt with Node Templates**:
```
SYSTEM:
Configure Dify workflow nodes following these exact schemas:

**LLM Node Template**:
{
  "id": "llm_<uuid>",
  "type": "llm",
  "data": {
    "title": "LLM",
    "type": "llm",
    "model": {
      "provider": "openai",  // or "anthropic", "azure_openai"
      "name": "gpt-4",
      "mode": "chat",
      "completion_params": {
        "temperature": 0.7,
        "max_tokens": 1000
      }
    },
    "prompt_template": [
      {
        "role": "system",
        "text": "You are a helpful assistant."
      },
      {
        "role": "user",
        "text": "{{start.query}}"  // Variable reference
      }
    ]
  },
  "position": {"x": 300, "y": 200}
}

**Tool Node Template** (for Tavily, HTTP, etc):
{
  "id": "tool_<uuid>",
  "type": "tool",
  "data": {
    "title": "Tavily Search",
    "type": "tool",
    "provider_name": "tavily",
    "provider_type": "builtin",
    "tool_name": "tavily_search",
    "tool_parameters": {
      "query": "{{start.search_query}}"
    }
  },
  "position": {"x": 500, "y": 200}
}

[... etc for all node types]

USER:
Architecture: {architecture}
Configure each node following the templates above.
```

**Test Cases**:
```python
# Test 1: LLM node configuration
input: NodeSpec(type="llm", purpose="answer questions")
expected: ConfiguredNode(
    type="llm",
    data={
        "model": {"provider": "openai", "name": "gpt-4"},
        "prompt_template": [...],
        ...
    }
)

# Test 2: Tool node configuration
input: NodeSpec(type="tool", tool_name="tavily_search")
expected: ConfiguredNode(
    type="tool",
    data={
        "provider_name": "tavily",
        "tool_parameters": {...}
    }
)
```

### 4. Quality Agent
**Responsibility**: Validate and score generated workflow

**Input**: Configured workflow DSL
**Output**: Quality report with validation results

**Improvements Needed**:
- Validate against Dify Pydantic schemas
- Check variable references are valid
- Verify edge connections are correct
- Test node configurations completeness

**Enhanced Validation**:
```python
def validate_workflow(dsl: Dict) -> QualityReport:
    checks = []

    # 1. Schema validation
    try:
        DifyWorkflow(**dsl)
        checks.append(("schema", True, "Valid Dify schema"))
    except ValidationError as e:
        checks.append(("schema", False, f"Schema error: {e}"))

    # 2. Variable references
    variables = extract_all_variables(dsl)
    undefined = find_undefined_references(dsl, variables)
    checks.append(("variables", len(undefined)==0, f"Undefined: {undefined}"))

    # 3. Edge connectivity
    orphan_nodes = find_orphan_nodes(dsl)
    checks.append(("connectivity", len(orphan_nodes)==0, f"Orphans: {orphan_nodes}"))

    # 4. Node configurations
    for node in dsl['workflow']['graph']['nodes']:
        valid = validate_node_config(node)
        checks.append((f"node_{node['id']}", valid, "..."))

    return QualityReport(checks=checks, score=calculate_score(checks))
```

## Implementation Plan

### Phase 1: Enhanced Prompts (Week 1)
- [ ] Update RequirementsAgent with DSL-specific prompts
- [ ] Update ArchitectureAgent with node type examples
- [ ] Update ConfigurationAgent with detailed templates
- [ ] Update QualityAgent with schema validation

### Phase 2: Unit Tests (Week 1)
- [ ] Create test fixtures (real Dify workflows)
- [ ] Write unit tests for each agent
- [ ] Implement test runner and coverage
- [ ] Set up CI/CD for agent testing

### Phase 3: Integration & Tuning (Week 2)
- [ ] Test full pipeline with various inputs
- [ ] Collect failure cases and improve prompts
- [ ] Add retry logic for agent failures
- [ ] Performance optimization

### Phase 4: Knowledge Base (Week 2)
- [ ] Build pattern library from real Dify workflows
- [ ] Implement RAG for pattern retrieval
- [ ] Add node configuration examples database
- [ ] Create prompt template library

## Testing Strategy

### Unit Tests
Each agent should have:
1. **Simple cases**: Basic workflows (3-5 nodes)
2. **Complex cases**: Iteration, conditionals, multiple branches
3. **Edge cases**: Empty inputs, invalid configs, missing data
4. **Real cases**: Actual user requests from production

### Test Structure
```python
# backend/tests/agents/test_architecture_agent.py
import pytest
from app.agents.architecture_agent import ArchitectureAgent
from app.graph.state import RequirementsAnalysis

@pytest.fixture
def agent():
    return ArchitectureAgent()

class TestArchitectureAgent:
    async def test_simple_qa_workflow(self, agent):
        """Test: Simple Q&A workflow generation"""
        requirements = RequirementsAnalysis(
            business_intent="Q&A chatbot",
            required_capabilities=["llm"],
            constraints=["use GPT-4"]
        )

        result = await agent.execute({"requirements": requirements})

        assert result["architecture"].node_types == ["start", "llm", "end"]
        assert result["architecture"].complexity == "simple"
        assert len(result["architecture"].edge_structure) == 2

    async def test_rag_workflow(self, agent):
        """Test: RAG workflow with knowledge retrieval"""
        requirements = RequirementsAnalysis(
            business_intent="Document Q&A",
            required_capabilities=["knowledge-retrieval", "llm"]
        )

        result = await agent.execute({"requirements": requirements})

        assert "knowledge-retrieval" in result["architecture"].node_types
        assert "llm" in result["architecture"].node_types

    async def test_iteration_workflow(self, agent):
        """Test: Workflow with iteration"""
        requirements = RequirementsAnalysis(
            business_intent="Process list of items",
            required_capabilities=["iteration", "llm"]
        )

        result = await agent.execute({"requirements": requirements})

        assert "iteration" in result["architecture"].node_types
        assert result["architecture"].has_iteration == True
```

## Performance Metrics

Track these metrics for each agent:
1. **Success Rate**: % of valid outputs
2. **Schema Compliance**: % passing Pydantic validation
3. **Quality Score**: Average quality score from QualityAgent
4. **Latency**: Time to generate (p50, p95, p99)
5. **Token Usage**: LLM tokens consumed per request

## Next Steps

1. **Immediate (Today)**:
   - Create test framework structure
   - Write first unit test for RequirementsAgent
   - Extract real Dify examples for prompts

2. **Short-term (This Week)**:
   - Update all agent prompts with examples
   - Implement unit tests for all agents
   - Add schema validation to QualityAgent

3. **Medium-term (Next Week)**:
   - Build knowledge base of Dify patterns
   - Implement RAG for pattern retrieval
   - Performance tuning and optimization

## Success Criteria

- ✅ All agents pass unit tests (>95% coverage)
- ✅ Generated workflows validate against Dify schema
- ✅ Quality score >80 for common use cases
- ✅ Latency <5s for simple workflows
- ✅ Zero "Unknown Node" errors in frontend
