"""
Extract node examples from real Dify workflows for agent prompts
"""

import yaml
import json
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Any

def extract_node_examples(samples_dir: str) -> Dict[str, List[Dict]]:
    """Extract examples of each node type from Dify samples"""
    node_examples = defaultdict(list)

    samples_path = Path(samples_dir)
    for yaml_file in samples_path.glob("*.yaml"):
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)

            nodes = data.get('workflow', {}).get('graph', {}).get('nodes', [])
            for node in nodes:
                node_type = node.get('data', {}).get('type', 'unknown')
                if node_type and node_type != 'unknown':
                    # Store a clean example
                    example = {
                        'id': node.get('id', ''),
                        'type': node_type,
                        'data': node.get('data', {}),
                        'position': node.get('position', {}),
                        'source_file': yaml_file.name
                    }
                    node_examples[node_type].append(example)
        except Exception as e:
            print(f"Error processing {yaml_file}: {e}")

    return dict(node_examples)

def generate_prompt_templates(node_examples: Dict[str, List[Dict]]) -> str:
    """Generate prompt templates with real examples"""

    template = """# Dify DSL Node Templates (from real workflows)

## Available Node Types

"""

    for node_type, examples in sorted(node_examples.items()):
        template += f"\n### {node_type.upper()} Node\n\n"

        # Take first 2 examples
        for i, example in enumerate(examples[:2], 1):
            template += f"**Example {i}** (from {example['source_file']}):\n```json\n"
            template += json.dumps({
                'id': example['id'],
                'type': example['type'],
                'data': example['data'],
                'position': example['position']
            }, indent=2, ensure_ascii=False)
            template += "\n```\n\n"

        template += "---\n"

    return template

def extract_common_patterns(samples_dir: str) -> List[Dict]:
    """Extract common workflow patterns"""
    patterns = []

    samples_path = Path(samples_dir)
    for yaml_file in samples_path.glob("*.yaml"):
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)

            workflow_name = data.get('app', {}).get('name', 'Unknown')
            workflow_desc = data.get('app', {}).get('description', '')
            nodes = data.get('workflow', {}).get('graph', {}).get('nodes', [])
            edges = data.get('workflow', {}).get('graph', {}).get('edges', [])

            # Extract node types sequence
            node_types = [n.get('data', {}).get('type', '') for n in nodes if n.get('data', {}).get('type')]

            # Determine pattern type
            pattern_type = "unknown"
            if "iteration" in node_types:
                pattern_type = "iteration"
            elif "knowledge-retrieval" in node_types or "document-extractor" in node_types:
                pattern_type = "rag"
            elif "if-else" in node_types:
                pattern_type = "conditional"
            elif "tool" in node_types:
                pattern_type = "tool_integration"
            elif len(node_types) <= 5:
                pattern_type = "simple_chain"
            else:
                pattern_type = "complex"

            pattern = {
                'name': workflow_name,
                'description': workflow_desc,
                'type': pattern_type,
                'node_count': len(nodes),
                'edge_count': len(edges),
                'node_types': list(set(node_types)),
                'node_sequence': node_types,
                'source_file': yaml_file.name
            }
            patterns.append(pattern)

        except Exception as e:
            print(f"Error extracting pattern from {yaml_file}: {e}")

    return patterns

def main():
    # Extract from both v1 and v2 samples
    all_examples = {}
    all_patterns = []

    for samples_dir in ['backend/knowledge_base/dify_samples', 'backend/knowledge_base/dify_samples_v2']:
        print(f"\n📂 Processing {samples_dir}...")
        examples = extract_node_examples(samples_dir)
        patterns = extract_common_patterns(samples_dir)

        # Merge examples
        for node_type, examples_list in examples.items():
            if node_type not in all_examples:
                all_examples[node_type] = []
            all_examples[node_type].extend(examples_list)

        all_patterns.extend(patterns)

    # Print summary
    print("\n" + "="*60)
    print("📊 EXTRACTION SUMMARY")
    print("="*60)
    print(f"\nNode Types Found: {len(all_examples)}")
    for node_type, examples in sorted(all_examples.items()):
        print(f"  - {node_type}: {len(examples)} examples")

    print(f"\nWorkflow Patterns Found: {len(all_patterns)}")
    pattern_counts = defaultdict(int)
    for p in all_patterns:
        pattern_counts[p['type']] += 1
    for ptype, count in sorted(pattern_counts.items()):
        print(f"  - {ptype}: {count} workflows")

    # Generate prompt template
    prompt_template = generate_prompt_templates(all_examples)

    # Save outputs
    output_dir = Path('backend/prompts')
    output_dir.mkdir(exist_ok=True)

    with open(output_dir / 'node_examples.json', 'w', encoding='utf-8') as f:
        json.dump(all_examples, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Saved node examples to {output_dir / 'node_examples.json'}")

    with open(output_dir / 'node_templates.md', 'w', encoding='utf-8') as f:
        f.write(prompt_template)
    print(f"✅ Saved prompt templates to {output_dir / 'node_templates.md'}")

    with open(output_dir / 'workflow_patterns.json', 'w', encoding='utf-8') as f:
        json.dump(all_patterns, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved workflow patterns to {output_dir / 'workflow_patterns.json'}")

    print("\n" + "="*60)
    print("✅ EXTRACTION COMPLETE")
    print("="*60)

if __name__ == '__main__':
    main()
