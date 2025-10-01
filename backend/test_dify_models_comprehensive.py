#!/usr/bin/env python3
"""
Comprehensive validation test for Dify models

Tests all real Dify sample files to ensure our models
can parse and validate 100% of real Dify exports.
"""
import yaml
import sys
from pathlib import Path
from typing import Dict, Any, List

sys.path.insert(0, '.')

from app.models.dify_models import DifyDSL


def load_dify_sample(filepath: Path) -> Dict[str, Any]:
    """Load a Dify YAML sample"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def validate_sample(filepath: Path) -> tuple[bool, str, Dict[str, Any]]:
    """
    Validate a single Dify sample

    Returns:
        (success, error_message, stats)
    """
    try:
        data = load_dify_sample(filepath)
        dsl = DifyDSL(**data)

        # Collect statistics
        stats = {
            'app_name': dsl.app.name,
            'mode': dsl.app.mode,
            'dependencies': len(dsl.dependencies),
        }

        # Handle workflow modes (workflow, advanced-chat)
        if dsl.workflow:
            stats['nodes'] = len(dsl.workflow.graph.nodes)
            stats['edges'] = len(dsl.workflow.graph.edges)
            stats['conversation_vars'] = len(dsl.workflow.conversation_variables)

            # Collect node types
            node_types = {}
            for node in dsl.workflow.graph.nodes:
                node_type = node.data.get('type', node.type)
                node_types[node_type] = node_types.get(node_type, 0) + 1

            stats['node_types'] = node_types

        # Handle chat modes (chat, agent-chat)
        elif dsl.model_configuration:
            stats['nodes'] = 0  # Chat modes don't have graph nodes
            stats['edges'] = 0
            stats['conversation_vars'] = 0
            stats['node_types'] = {}
            stats['has_model_config'] = True
            if dsl.model_configuration.agent_mode:
                stats['agent_enabled'] = dsl.model_configuration.agent_mode.get('enabled', False)

        else:
            stats['nodes'] = 0
            stats['edges'] = 0
            stats['conversation_vars'] = 0
            stats['node_types'] = {}

        return (True, "", stats)

    except Exception as e:
        return (False, str(e), {})


def run_comprehensive_test():
    """Run comprehensive validation on all Dify samples"""

    samples_dir = Path('knowledge_base/dify_samples_v2')

    if not samples_dir.exists():
        print(f"❌ Samples directory not found: {samples_dir}")
        sys.exit(1)

    # Find all YAML files
    yaml_files = list(samples_dir.glob('*.yaml'))

    print("=" * 80)
    print("COMPREHENSIVE DIFY MODELS VALIDATION TEST")
    print("=" * 80)
    print(f"\nFound {len(yaml_files)} Dify sample files\n")

    results = []
    passed = 0
    failed = 0

    # Test each sample
    for filepath in sorted(yaml_files):
        filename = filepath.name
        print(f"Testing: {filename}")

        success, error, stats = validate_sample(filepath)

        if success:
            print(f"  ✅ PASSED")
            print(f"     App: {stats['app_name']}")
            print(f"     Mode: {stats['mode']}")

            if stats.get('has_model_config'):
                print(f"     Chat/Agent mode - has model_config")
                if stats.get('agent_enabled'):
                    print(f"     Agent enabled: True")
            else:
                print(f"     Nodes: {stats['nodes']}, Edges: {stats['edges']}")
                if stats.get('conversation_vars'):
                    print(f"     Conversation vars: {stats['conversation_vars']}")
                if stats.get('node_types'):
                    print(f"     Node types: {', '.join([f'{k}({v})' for k, v in sorted(stats['node_types'].items())])}")

            if stats.get('dependencies'):
                print(f"     Dependencies: {stats['dependencies']}")

            passed += 1
        else:
            print(f"  ❌ FAILED")
            print(f"     Error: {error[:200]}")
            failed += 1

        print()

        results.append({
            'file': filename,
            'success': success,
            'error': error,
            'stats': stats
        })

    # Summary
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Total samples: {len(yaml_files)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success rate: {(passed/len(yaml_files)*100):.1f}%")

    # Aggregate statistics
    if passed > 0:
        print("\n" + "=" * 80)
        print("AGGREGATE STATISTICS")
        print("=" * 80)

        all_node_types = {}
        modes = {}
        total_nodes = 0
        total_edges = 0

        for result in results:
            if result['success']:
                stats = result['stats']
                mode = stats['mode']
                modes[mode] = modes.get(mode, 0) + 1
                total_nodes += stats['nodes']
                total_edges += stats['edges']

                for node_type, count in stats.get('node_types', {}).items():
                    all_node_types[node_type] = all_node_types.get(node_type, 0) + count

        print(f"\nApp modes covered:")
        for mode, count in sorted(modes.items()):
            print(f"  - {mode}: {count} samples")

        print(f"\nTotal nodes tested: {total_nodes}")
        print(f"Total edges tested: {total_edges}")

        print(f"\nNode types coverage ({len(all_node_types)} types):")
        for node_type, count in sorted(all_node_types.items(), key=lambda x: -x[1]):
            if node_type:
                print(f"  - {node_type}: {count} instances")

    # Exit code
    if failed > 0:
        print("\n⚠️  Some tests failed!")
        sys.exit(1)
    else:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)


if __name__ == '__main__':
    run_comprehensive_test()
