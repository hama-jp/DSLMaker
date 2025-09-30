"""
Script to load workflow patterns into ChromaDB
"""

import asyncio
import yaml
from pathlib import Path
import sys

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.vector_store import vector_store
from app.services.llm_service import llm_service


async def load_pattern_file(file_path: Path):
    """Load a single pattern file and add to vector store."""
    print(f"📄 Loading pattern: {file_path.name}")

    try:
        with open(file_path, 'r') as f:
            pattern_data = yaml.safe_load(f)

        metadata = pattern_data['metadata']
        workflow = pattern_data['workflow']

        # Create content for embedding
        content = f"""
Pattern: {metadata['name']}
Description: {metadata['description']}
Complexity: {metadata['complexity']}
Use Cases: {', '.join(metadata['use_cases'])}
Node Count: {metadata['node_count']}
Tags: {', '.join(metadata['tags'])}

Workflow Structure:
- Nodes: {len(workflow['graph']['nodes'])}
- Edges: {len(workflow['graph']['edges'])}

Node Types: {', '.join([node['type'] for node in workflow['graph']['nodes']])}
"""

        # Generate embedding
        embedding = await llm_service.get_embedding(content)

        # Flatten metadata for ChromaDB (convert lists to strings)
        flat_metadata = {
            'pattern_id': metadata['pattern_id'],
            'name': metadata['name'],
            'description': metadata['description'],
            'complexity': metadata['complexity'],
            'node_count': metadata['node_count'],
            'use_cases': ', '.join(metadata['use_cases']),  # Convert list to string
            'tags': ', '.join(metadata['tags'])  # Convert list to string
        }

        # Add to vector store
        await vector_store.add_pattern(
            pattern_id=metadata['pattern_id'],
            content=content,
            metadata=flat_metadata,
            embedding=embedding
        )

        print(f"✅ Loaded: {metadata['name']} ({metadata['pattern_id']})")

    except Exception as e:
        print(f"❌ Failed to load {file_path.name}: {e}")


async def main():
    """Main function to load all patterns."""
    print("🚀 Starting pattern loading...\n")

    # Initialize services
    print("📦 Initializing services...")
    await vector_store.initialize()
    await llm_service.initialize()
    print("✅ Services initialized\n")

    # Find all pattern files
    patterns_dir = Path(__file__).parent.parent / "knowledge_base" / "patterns"
    pattern_files = list(patterns_dir.glob("*.yaml"))

    if not pattern_files:
        print("⚠️ No pattern files found!")
        return

    print(f"📚 Found {len(pattern_files)} pattern(s)\n")

    # Load each pattern
    for pattern_file in pattern_files:
        await load_pattern_file(pattern_file)

    # Show final stats
    print("\n📊 Final Statistics:")
    stats = vector_store.get_collection_stats()
    print(f"   Collection: {stats['collection_name']}")
    print(f"   Total Patterns: {stats['total_patterns']}")

    print("\n✅ Pattern loading completed!")


if __name__ == "__main__":
    asyncio.run(main())