"""
Vector Store Service - ChromaDB Integration
Manages embeddings and semantic search for workflow patterns
"""

import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """ChromaDB-based vector store for workflow patterns."""

    def __init__(self):
        """Initialize ChromaDB client and collection."""
        self.client: Optional[chromadb.Client] = None
        self.collection: Optional[chromadb.Collection] = None
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize ChromaDB client and collection."""
        try:
            logger.info("🔌 Connecting to ChromaDB...")

            # Initialize ChromaDB client
            # For development: use persistent client with local storage
            self.client = chromadb.Client(
                Settings(
                    persist_directory="./chroma_db",
                    anonymized_telemetry=False
                )
            )

            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=settings.chromadb_collection,
                metadata={"description": "Dify workflow patterns for RAG"}
            )

            self._initialized = True
            logger.info(f"✅ ChromaDB initialized - Collection: {settings.chromadb_collection}")
            logger.info(f"📊 Collection size: {self.collection.count()} documents")

        except Exception as e:
            logger.error(f"❌ Failed to initialize ChromaDB: {e}")
            raise

    async def add_pattern(
        self,
        pattern_id: str,
        content: str,
        metadata: Dict[str, Any],
        embedding: Optional[List[float]] = None
    ) -> None:
        """
        Add a workflow pattern to the vector store.

        Args:
            pattern_id: Unique identifier for the pattern
            content: Text content to embed
            metadata: Pattern metadata (name, description, complexity, etc.)
            embedding: Pre-computed embedding (optional, will use ChromaDB's default if not provided)
        """
        if not self._initialized:
            await self.initialize()

        try:
            self.collection.add(
                ids=[pattern_id],
                documents=[content],
                metadatas=[metadata],
                embeddings=[embedding] if embedding else None
            )
            logger.info(f"✅ Added pattern: {pattern_id}")

        except Exception as e:
            logger.error(f"❌ Failed to add pattern {pattern_id}: {e}")
            raise

    async def search_patterns(
        self,
        query: str,
        n_results: int = 3,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar workflow patterns using semantic search.

        Args:
            query: Search query text
            n_results: Number of results to return
            filter_metadata: Optional metadata filters

        Returns:
            List of matching patterns with metadata and similarity scores
        """
        if not self._initialized:
            await self.initialize()

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=filter_metadata
            )

            # Format results
            patterns = []
            for i in range(len(results['ids'][0])):
                patterns.append({
                    'id': results['ids'][0][i],
                    'content': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'distance': results['distances'][0][i] if 'distances' in results else None
                })

            logger.info(f"🔍 Found {len(patterns)} patterns for query: '{query[:50]}...'")
            return patterns

        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            raise

    async def get_pattern(self, pattern_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific pattern by ID."""
        if not self._initialized:
            await self.initialize()

        try:
            result = self.collection.get(ids=[pattern_id])

            if not result['ids']:
                return None

            return {
                'id': result['ids'][0],
                'content': result['documents'][0],
                'metadata': result['metadatas'][0]
            }

        except Exception as e:
            logger.error(f"❌ Failed to get pattern {pattern_id}: {e}")
            raise

    async def delete_pattern(self, pattern_id: str) -> None:
        """Delete a pattern from the vector store."""
        if not self._initialized:
            await self.initialize()

        try:
            self.collection.delete(ids=[pattern_id])
            logger.info(f"🗑️ Deleted pattern: {pattern_id}")

        except Exception as e:
            logger.error(f"❌ Failed to delete pattern {pattern_id}: {e}")
            raise

    async def clear_collection(self) -> None:
        """Clear all patterns from the collection."""
        if not self._initialized:
            await self.initialize()

        try:
            # Delete and recreate collection
            self.client.delete_collection(name=settings.chromadb_collection)
            self.collection = self.client.create_collection(
                name=settings.chromadb_collection,
                metadata={"description": "Dify workflow patterns for RAG"}
            )
            logger.info("🗑️ Cleared all patterns from collection")

        except Exception as e:
            logger.error(f"❌ Failed to clear collection: {e}")
            raise

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection."""
        if not self._initialized:
            return {"error": "Not initialized"}

        return {
            "collection_name": settings.chromadb_collection,
            "total_patterns": self.collection.count(),
            "initialized": self._initialized
        }


# Global vector store instance
vector_store = VectorStoreService()