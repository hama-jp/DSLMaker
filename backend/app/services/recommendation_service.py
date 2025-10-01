"""
Pattern Recommendation Service
Intelligent pattern selection and recommendation for workflow generation
"""

from typing import List, Dict, Any, Optional, Tuple
import logging
from collections import Counter

from app.services.vector_store import vector_store
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for recommending workflow patterns based on requirements."""

    def __init__(self):
        """Initialize recommendation service."""
        pass

    async def recommend_patterns(
        self,
        description: str,
        n_results: int = 3,
        complexity: Optional[str] = None,
        use_llm_analysis: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Recommend workflow patterns based on description.

        Args:
            description: User's workflow description
            n_results: Number of patterns to recommend
            complexity: Optional complexity filter
            use_llm_analysis: Whether to use LLM for requirement analysis

        Returns:
            List of recommended patterns with scores
        """
        logger.info(f"🔍 Recommending patterns for: '{description[:50]}...'")

        # Analyze requirements with LLM if enabled
        analyzed_requirements = description
        detected_complexity = complexity

        if use_llm_analysis and llm_service._initialized:
            logger.info("🤖 Analyzing requirements with LLM...")
            analyzed_requirements, detected_complexity = await self._analyze_requirements(
                description
            )

        # Build metadata filter
        filter_metadata = {}
        if detected_complexity or complexity:
            filter_metadata["complexity"] = detected_complexity or complexity

        # Search for similar patterns
        patterns = await vector_store.search_patterns(
            query=analyzed_requirements,
            n_results=n_results * 2,  # Get more candidates for reranking
            filter_metadata=filter_metadata if filter_metadata else None
        )

        # Score and rank patterns
        scored_patterns = await self._score_patterns(
            patterns=patterns,
            description=description,
            analyzed_requirements=analyzed_requirements
        )

        # Return top N patterns
        top_patterns = scored_patterns[:n_results]

        logger.info(f"✅ Recommended {len(top_patterns)} patterns")
        return top_patterns

    async def _analyze_requirements(
        self,
        description: str
    ) -> Tuple[str, Optional[str]]:
        """
        Analyze user requirements using LLM.

        Args:
            description: User's workflow description

        Returns:
            Tuple of (analyzed requirements text, detected complexity)
        """
        try:
            system_prompt = """You are a workflow requirements analyzer.
Analyze the user's workflow description and extract:
1. Key features and requirements
2. Workflow complexity (simple, moderate, or complex)

Respond in this format:
Requirements: [list key requirements]
Complexity: [simple|moderate|complex]
"""

            response = await llm_service.generate_text(
                prompt=f"Analyze this workflow description: {description}",
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=300
            )

            # Parse response
            lines = response.strip().split('\n')
            requirements = ""
            complexity = None

            for line in lines:
                if line.startswith("Requirements:"):
                    requirements = line.replace("Requirements:", "").strip()
                elif line.startswith("Complexity:"):
                    complexity_str = line.replace("Complexity:", "").strip().lower()
                    if complexity_str in ["simple", "moderate", "complex"]:
                        complexity = complexity_str

            # Fallback to original description if parsing fails
            if not requirements:
                requirements = description

            logger.info(f"📋 Detected complexity: {complexity or 'not specified'}")
            return requirements, complexity

        except Exception as e:
            logger.warning(f"⚠️ LLM analysis failed: {e}, using original description")
            return description, None

    async def _score_patterns(
        self,
        patterns: List[Dict[str, Any]],
        description: str,
        analyzed_requirements: str
    ) -> List[Dict[str, Any]]:
        """
        Score and rank patterns based on multiple factors.

        Args:
            patterns: List of retrieved patterns
            description: Original description
            analyzed_requirements: Analyzed requirements

        Returns:
            Sorted list of patterns with scores
        """
        scored = []

        for pattern in patterns:
            score = 0.0
            metadata = pattern.get("metadata", {})
            distance = pattern.get("distance", 1.0)

            # 1. Semantic similarity score (from vector search)
            # Lower distance = higher similarity
            similarity_score = max(0, 1.0 - distance) * 100
            score += similarity_score * 0.6  # 60% weight

            # 2. Complexity match score
            if metadata.get("complexity"):
                # Give bonus for complexity match in description
                complexity_keywords = {
                    "simple": ["simple", "basic", "straightforward", "easy"],
                    "moderate": ["moderate", "standard", "typical"],
                    "complex": ["complex", "advanced", "sophisticated", "multi-step"]
                }

                pattern_complexity = metadata["complexity"]
                keywords = complexity_keywords.get(pattern_complexity, [])

                desc_lower = description.lower()
                keyword_matches = sum(1 for kw in keywords if kw in desc_lower)

                complexity_score = (keyword_matches / max(len(keywords), 1)) * 100
                score += complexity_score * 0.2  # 20% weight

            # 3. Use case relevance score
            if metadata.get("use_cases"):
                use_cases = metadata["use_cases"].split(", ")
                desc_lower = description.lower()
                req_lower = analyzed_requirements.lower()

                # Check if any use case keywords appear in description
                relevance_matches = sum(
                    1 for uc in use_cases
                    if any(word in desc_lower or word in req_lower for word in uc.lower().split())
                )

                use_case_score = (relevance_matches / max(len(use_cases), 1)) * 100
                score += use_case_score * 0.2  # 20% weight

            # Add score to pattern
            pattern["recommendation_score"] = round(score, 2)
            scored.append(pattern)

        # Sort by score (descending)
        scored.sort(key=lambda x: x["recommendation_score"], reverse=True)

        return scored

    async def get_pattern_statistics(self) -> Dict[str, Any]:
        """Get statistics about available patterns."""
        if not vector_store._initialized:
            return {"error": "Vector store not initialized"}

        stats = vector_store.get_collection_stats()
        total = stats.get("total_patterns", 0)

        if total == 0:
            return {
                "total_patterns": 0,
                "by_complexity": {},
                "by_tags": {}
            }

        # Note: ChromaDB doesn't provide easy aggregation
        # In a production system, we'd maintain a separate index
        return {
            "total_patterns": total,
            "collection_name": stats.get("collection_name"),
            "note": "Detailed statistics require pattern enumeration"
        }


# Global recommendation service instance
recommendation_service = RecommendationService()