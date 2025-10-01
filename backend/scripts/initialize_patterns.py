#!/usr/bin/env python3
"""
Pattern Initialization Script
Loads workflow patterns from YAML files into ChromaDB vector store
"""

import asyncio
import logging
import sys
from pathlib import Path
from typing import List, Dict, Any
import yaml

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.vector_store import vector_store
from app.services.llm_service import llm_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

PATTERNS_DIR = Path(__file__).parent.parent / "knowledge_base" / "patterns"


class PatternLoader:
    """Load workflow patterns from YAML files into vector store."""

    def __init__(self, patterns_dir: Path):
        """
        Initialize pattern loader.

        Args:
            patterns_dir: Directory containing pattern YAML files
        """
        self.patterns_dir = patterns_dir
        self.loaded_count = 0
        self.failed_count = 0
        self.errors: List[Dict[str, str]] = []

    def load_yaml_file(self, file_path: Path) -> Dict[str, Any]:
        """
        Load and parse a YAML file.

        Args:
            file_path: Path to YAML file

        Returns:
            Parsed YAML content as dictionary
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
                logger.debug(f"✅ Loaded YAML: {file_path.name}")
                return content
        except Exception as e:
            logger.error(f"❌ Failed to load {file_path.name}: {e}")
            raise

    def extract_pattern_metadata(self, pattern_data: Dict, file_name: str) -> Dict[str, Any]:
        """
        Extract metadata from pattern data.

        Args:
            pattern_data: Parsed YAML pattern data
            file_name: Name of the YAML file

        Returns:
            Metadata dictionary
        """
        # Extract pattern ID from filename (remove .yaml extension)
        pattern_id = file_name.replace('.yaml', '')

        # Extract metadata from pattern structure
        metadata = {
            "pattern_id": pattern_id,
            "name": pattern_data.get("app", {}).get("name", pattern_id),
            "description": pattern_data.get("app", {}).get("description", ""),
            "complexity": "moderate",  # Default
            "use_cases": [],
            "node_types": [],
            "estimated_nodes": 0
        }

        # Extract nodes to determine complexity and types
        nodes = pattern_data.get("app", {}).get("nodes", [])
        if nodes:
            metadata["estimated_nodes"] = len(nodes)

            # Extract unique node types
            node_types = set(node.get("data", {}).get("type", "") for node in nodes)
            metadata["node_types"] = sorted(list(node_types))

            # Estimate complexity based on node count
            if len(nodes) <= 4:
                metadata["complexity"] = "simple"
            elif len(nodes) <= 8:
                metadata["complexity"] = "moderate"
            else:
                metadata["complexity"] = "complex"

        return metadata

    def create_pattern_document(self, pattern_data: Dict, metadata: Dict) -> str:
        """
        Create a searchable document from pattern data.

        Args:
            pattern_data: Pattern data
            metadata: Pattern metadata

        Returns:
            Formatted document string for embedding
        """
        # Build comprehensive document for semantic search
        doc_parts = [
            f"Pattern: {metadata['name']}",
            f"ID: {metadata['pattern_id']}",
            f"Description: {metadata['description']}",
            f"Complexity: {metadata['complexity']}",
            f"Node Types: {', '.join(metadata['node_types'])}",
            f"Estimated Nodes: {metadata['estimated_nodes']}",
        ]

        # Add node details for better context
        nodes = pattern_data.get("app", {}).get("nodes", [])
        if nodes:
            doc_parts.append("\nWorkflow Structure:")
            for node in nodes[:10]:  # Limit to first 10 nodes
                node_data = node.get("data", {})
                node_title = node_data.get("title", "Untitled")
                node_type = node_data.get("type", "unknown")
                doc_parts.append(f"- {node_title} ({node_type})")

        return "\n".join(doc_parts)

    async def load_single_pattern(self, file_path: Path) -> bool:
        """
        Load a single pattern file into vector store.

        Args:
            file_path: Path to pattern YAML file

        Returns:
            True if successful, False otherwise
        """
        try:
            # Load YAML
            pattern_data = self.load_yaml_file(file_path)

            # Extract metadata
            metadata = self.extract_pattern_metadata(pattern_data, file_path.name)

            # Create searchable document
            document = self.create_pattern_document(pattern_data, metadata)

            # Store pattern content (full YAML as JSON)
            pattern_content = yaml.dump(pattern_data, default_flow_style=False)

            # Add to vector store
            await vector_store.add_pattern(
                pattern_id=metadata["pattern_id"],
                content=pattern_content,
                metadata=metadata
            )

            logger.info(
                f"✅ Loaded pattern: {metadata['name']} "
                f"({metadata['complexity']}, {metadata['estimated_nodes']} nodes)"
            )

            self.loaded_count += 1
            return True

        except Exception as e:
            logger.error(f"❌ Failed to load pattern {file_path.name}: {e}")
            self.failed_count += 1
            self.errors.append({
                "file": file_path.name,
                "error": str(e)
            })
            return False

    async def load_all_patterns(self) -> Dict[str, Any]:
        """
        Load all patterns from directory into vector store.

        Returns:
            Summary statistics
        """
        logger.info(f"📚 Loading patterns from {self.patterns_dir}")

        # Check if directory exists
        if not self.patterns_dir.exists():
            raise FileNotFoundError(f"Patterns directory not found: {self.patterns_dir}")

        # Find all YAML files
        pattern_files = sorted(self.patterns_dir.glob("*.yaml"))

        if not pattern_files:
            logger.warning(f"⚠️ No YAML files found in {self.patterns_dir}")
            return {
                "total_found": 0,
                "loaded": 0,
                "failed": 0,
                "errors": []
            }

        logger.info(f"📁 Found {len(pattern_files)} pattern files")

        # Load each pattern
        for file_path in pattern_files:
            await self.load_single_pattern(file_path)

        # Summary
        summary = {
            "total_found": len(pattern_files),
            "loaded": self.loaded_count,
            "failed": self.failed_count,
            "errors": self.errors
        }

        logger.info(
            f"📊 Pattern loading complete: "
            f"{self.loaded_count} loaded, {self.failed_count} failed"
        )

        return summary


async def initialize_patterns(force_reload: bool = False) -> Dict[str, Any]:
    """
    Initialize patterns in vector store.

    Args:
        force_reload: If True, reload even if patterns already exist

    Returns:
        Summary statistics
    """
    try:
        # Initialize services
        logger.info("🔌 Initializing services...")
        await llm_service.initialize()
        await vector_store.initialize()

        # Check if patterns already exist
        stats = vector_store.get_collection_stats()
        existing_patterns = stats.get("total_patterns", 0)

        if existing_patterns > 0 and not force_reload:
            logger.info(
                f"✅ Vector store already contains {existing_patterns} patterns. "
                f"Use --force to reload."
            )
            return {
                "status": "skipped",
                "reason": "patterns_already_exist",
                "existing_patterns": existing_patterns
            }

        if force_reload and existing_patterns > 0:
            logger.info(f"🔄 Force reload: Clearing {existing_patterns} existing patterns")
            # Note: ChromaDB doesn't have a clear method, so we'll just overwrite

        # Load patterns
        loader = PatternLoader(PATTERNS_DIR)
        summary = await loader.load_all_patterns()

        # Verify loading
        new_stats = vector_store.get_collection_stats()
        final_count = new_stats.get("total_patterns", 0)

        logger.info(f"✅ Pattern initialization complete: {final_count} patterns in vector store")

        return {
            "status": "success",
            **summary,
            "final_pattern_count": final_count
        }

    except Exception as e:
        logger.error(f"❌ Pattern initialization failed: {e}", exc_info=True)
        return {
            "status": "error",
            "error": str(e)
        }


async def main():
    """Main entry point for CLI usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Initialize workflow patterns in vector store")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force reload even if patterns already exist"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info("🚀 Starting pattern initialization...")

    result = await initialize_patterns(force_reload=args.force)

    if result["status"] == "success":
        logger.info(f"✅ Success: {result['loaded']} patterns loaded")
        if result.get("failed", 0) > 0:
            logger.warning(f"⚠️ {result['failed']} patterns failed to load")
            for error in result.get("errors", []):
                logger.warning(f"  - {error['file']}: {error['error']}")
        sys.exit(0)
    elif result["status"] == "skipped":
        logger.info(f"ℹ️ Skipped: {result['existing_patterns']} patterns already exist")
        sys.exit(0)
    else:
        logger.error(f"❌ Failed: {result.get('error', 'Unknown error')}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
