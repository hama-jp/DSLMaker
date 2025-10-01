#!/usr/bin/env python3
"""
Complete Example: Building a Dify-Compatible Workflow

This example demonstrates how to build a complete Dify workflow
using the builder API, including:
- Basic nodes (start, llm, end)
- Iteration with nested nodes
- Variable references
- Dependencies
"""
import sys
import yaml
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.utils.dify_builder import *
from app.models.dify_models import DifyDSL


def main():
    print("=" * 70)
    print("BUILDING COMPLETE DIFY WORKFLOW EXAMPLE")
    print("=" * 70)
    print()

    # Generate unique IDs
    start_id = generate_timestamp_id()
    search_tool_id = generate_timestamp_id()
    extract_code_id = generate_timestamp_id()
    iter_id = generate_timestamp_id()
    reader_tool_id = generate_timestamp_id()
    summarize_llm_id = generate_timestamp_id()
    combine_template_id = generate_timestamp_id()
    final_code_id = generate_timestamp_id()
    end_id = generate_timestamp_id()

    print("Step 1: Creating nodes...")
    nodes = []

    # 1. Start node
    nodes.append(build_start_node(
        start_id, 30, 100,
        variables=[{
            "variable": "query",
            "label": "Search Query",
            "type": "text-input",
            "required": True
        }],
        title="Start"
    ))

    # 2. Tavily Search tool
    nodes.append(build_tool_node(
        search_tool_id, 300, 100,
        provider_id="tavily",
        tool_name="tavily_search",
        tool_parameters={
            "query": {
                "type": "mixed",
                "value": make_variable_reference(start_id, "query")
            }
        },
        tool_configurations={
            "search_depth": "basic",
            "max_results": 5
        },
        title="Web Search"
    ))

    # 3. Code node to extract URLs
    nodes.append(build_code_node(
        extract_code_id, 600, 100,
        code="""import re
def main(search_results):
    urls = re.findall(r'http[s]?://[^\\s)]+', str(search_results))
    return {"result": urls[:3]}  # Top 3 URLs
""",
        variables=[{
            "variable": "search_results",
            "value_selector": [search_tool_id, "text"]
        }],
        outputs={
            "result": {"type": "array[string]", "children": None}
        },
        title="Extract URLs"
    ))

    # 4. Iteration node (container)
    nodes.append(build_iteration_node(
        iter_id, 900, 100,
        iterator_selector=[extract_code_id, "result"],
        output_selector=[combine_template_id, "output"],
        output_type="array[string]",
        start_node_type="tool",
        width=800,
        height=250,
        title="Process Each URL"
    ))

    # 5. Iteration-start node
    nodes.append(build_iteration_start_node(iter_id, 24, 60))

    # 6. Jina Reader tool (inside iteration)
    reader_node = build_tool_node(
        reader_tool_id, 100, 60,
        provider_id="jina",
        tool_name="jina_reader",
        tool_parameters={
            "url": {
                "type": "mixed",
                "value": make_variable_reference(iter_id, "item")
            }
        },
        tool_configurations={},
        title="Read Content"
    )
    # Make it a child of iteration
    reader_node["parentId"] = iter_id
    reader_node["extent"] = "parent"
    reader_node["zIndex"] = 1001
    reader_node["data"]["isInIteration"] = True
    reader_node["data"]["iteration_id"] = iter_id
    nodes.append(reader_node)

    # 7. LLM node (inside iteration)
    llm_node = build_llm_node(
        summarize_llm_id, 400, 60,
        model_config={
            "provider": "openai",
            "name": "gpt-4",
            "mode": "chat",
            "completion_params": {"temperature": 0.7}
        },
        prompt_template=[
            {
                "role": "system",
                "text": f"Summarize this content in 2-3 sentences:\\n{make_variable_reference(reader_tool_id, 'text')}"
            }
        ],
        title="Summarize",
        in_iteration=True,
        iteration_id=iter_id
    )
    nodes.append(llm_node)

    # 8. Template transform (inside iteration)
    template_node = build_template_transform_node(
        combine_template_id, 650, 60,
        template="URL: {{ url }}\\nSummary: {{ summary }}",
        variables=[
            {"variable": "url", "value_selector": [iter_id, "item"]},
            {"variable": "summary", "value_selector": [summarize_llm_id, "text"]}
        ],
        title="Format Result",
        in_iteration=True,
        iteration_id=iter_id
    )
    nodes.append(template_node)

    # 9. Code node to join results
    nodes.append(build_code_node(
        final_code_id, 1750, 100,
        code="""def main(summaries):
    return {"result": "\\n\\n".join(summaries)}
""",
        variables=[{
            "variable": "summaries",
            "value_selector": [iter_id, "output"]
        }],
        outputs={
            "result": {"type": "string", "children": None}
        },
        title="Combine Results"
    ))

    # 10. End node
    nodes.append(build_end_node(
        end_id, 2050, 100,
        outputs=[{
            "variable": "final_result",
            "value_selector": [final_code_id, "result"]
        }],
        title="End"
    ))

    print(f"   Created {len(nodes)} nodes")

    print("\nStep 2: Creating edges...")
    edges = []

    # Main flow edges
    edges.append(build_edge(start_id, search_tool_id, "start", "tool"))
    edges.append(build_edge(search_tool_id, extract_code_id, "tool", "code"))
    edges.append(build_edge(extract_code_id, iter_id, "code", "iteration"))
    edges.append(build_edge(iter_id, final_code_id, "iteration", "code"))
    edges.append(build_edge(final_code_id, end_id, "code", "end"))

    # Iteration internal edges
    edges.append(build_edge(
        f"{iter_id}start0", reader_tool_id,
        "iteration-start", "tool",
        in_iteration=True, iteration_id=iter_id
    ))
    edges.append(build_edge(
        reader_tool_id, summarize_llm_id,
        "tool", "llm",
        in_iteration=True, iteration_id=iter_id
    ))
    edges.append(build_edge(
        summarize_llm_id, combine_template_id,
        "llm", "template-transform",
        in_iteration=True, iteration_id=iter_id
    ))

    print(f"   Created {len(edges)} edges")

    print("\nStep 3: Adding dependencies...")
    dependencies = [
        {
            "current_identifier": None,
            "type": "marketplace",
            "value": {
                "marketplace_plugin_unique_identifier": "langgenius/tavily:0.1.2@aa7a8744b2ccf3a7aec818da6c504997a6319b29040e541bfc73b4fbaa9e98d9"
            }
        },
        {
            "current_identifier": None,
            "type": "marketplace",
            "value": {
                "marketplace_plugin_unique_identifier": "langgenius/openai:0.2.6@e2665624a156f52160927bceac9e169bd7e5ae6b936ae82575e14c90af390e6e"
            }
        },
        {
            "current_identifier": None,
            "type": "marketplace",
            "value": {
                "marketplace_plugin_unique_identifier": "langgenius/jina_tool:0.0.7@08d5935b56b9ddaa633204874c0fd796c14971489b6379fad1a430b5ec99b569"
            }
        }
    ]
    print(f"   Added {len(dependencies)} dependencies")

    print("\nStep 4: Building complete DSL...")
    dsl = build_workflow_dsl(
        app_name="Web Research Assistant",
        app_description="Search the web, extract content, and summarize results",
        nodes=nodes,
        edges=edges,
        app_icon="🔍",
        icon_background="#FFEAD5",
        dependencies=dependencies,
        mode="workflow"
    )

    print("\nStep 5: Validating with Pydantic...")
    try:
        validated_dsl = DifyDSL(**dsl)
        print("   ✅ Validation passed!")
        print(f"   - App: {validated_dsl.app.name}")
        print(f"   - Mode: {validated_dsl.app.mode}")
        print(f"   - Nodes: {len(validated_dsl.workflow.graph.nodes)}")
        print(f"   - Edges: {len(validated_dsl.workflow.graph.edges)}")
        print(f"   - Dependencies: {len(validated_dsl.dependencies)}")
    except Exception as e:
        print(f"   ❌ Validation failed: {e}")
        return 1

    print("\nStep 6: Saving to file...")
    output_path = Path(__file__).parent / "example_workflow.yaml"
    with open(output_path, 'w', encoding='utf-8') as f:
        yaml.dump(dsl, f, allow_unicode=True, sort_keys=False)

    print(f"   ✅ Saved to: {output_path}")
    print(f"   File size: {output_path.stat().st_size:,} bytes")

    print("\n" + "=" * 70)
    print("🎉 WORKFLOW BUILD COMPLETE!")
    print("=" * 70)
    print("\nThis workflow can be imported directly into Dify!")
    print(f"\nNext steps:")
    print(f"1. Open Dify")
    print(f"2. Go to Studio → Import DSL")
    print(f"3. Upload: {output_path}")
    print()

    return 0


if __name__ == '__main__':
    sys.exit(main())
