# Known Issues

This document outlines known issues in the current codebase as of 2025-10-01.

## Agent and Integration Test Suite Failures

A significant portion of the test suite, specifically for the agent-based workflow generation, is currently failing. This includes most tests in `tests/agents/` and `tests/integration/`.

### Root Cause Analysis

The primary cause of these failures is a complex and persistent issue with correctly mocking the LangChain components used by the multi-agent system. The core problem lies in the interaction between the mocked LLM in `conftest.py` and the internal data structures that LangChain's components (like `JsonOutputParser` and the agent executors) expect.

Despite multiple attempts to refine the mocking strategy, a subtle mismatch remains. This causes the mock to provide data in a format that the LangChain framework does not correctly parse, leading to the following symptoms:

1.  **Agent Fallback:** The agents' internal error handling is triggered, causing them to revert to simple, fallback data (e.g., a basic linear workflow) instead of generating the complex, context-specific output the tests expect.
2.  **Assertion Failures:** Consequently, the test assertions, which check for specific capabilities or node types (e.g., "iteration", "knowledge-retrieval"), fail because the agents' responses do not contain them.
3.  **Secondary Errors:** The `ZeroDivisionError` in the consistency test is a direct result of the mock failing to produce any "required capabilities" for the agent to process.

### Impact

- The correctness of the multi-agent workflow generation system cannot be automatically verified by the existing test suite.
- While the new Dify MCP execution endpoint (`/api/v1/dify/execute`) is functional and tested in isolation, the end-to-end generation tests that should produce the DSL for this endpoint are unreliable.

### Recommendation

A dedicated effort is required to refactor the agent-related test suite. This is not a trivial fix and likely involves:
- A deeper investigation into the specific version of LangChain used in this project.
- Potentially using LangChain's own testing utilities or developing a more sophisticated mocking harness that can accurately replicate the expected data flow and object structures within the agent chains.
- This should be treated as a separate, dedicated task to improve code quality and test reliability.