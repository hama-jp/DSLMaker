"""
LLM Service - OpenAI Integration
Manages interactions with OpenAI's GPT models for workflow generation
"""

from typing import List, Dict, Any, Optional
import logging
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion

from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with OpenAI's GPT models."""

    def __init__(self):
        """Initialize OpenAI client."""
        self.client: Optional[AsyncOpenAI] = None
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the OpenAI client."""
        try:
            logger.info("🔌 Initializing OpenAI client...")
            self.client = AsyncOpenAI(api_key=settings.openai_api_key)
            self._initialized = True
            logger.info(f"✅ OpenAI client initialized - Model: {settings.openai_model}")
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenAI client: {e}")
            raise

    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        response_format: Optional[Dict[str, str]] = None
    ) -> ChatCompletion:
        """
        Generate a chat completion using OpenAI's API.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            response_format: Optional response format specification

        Returns:
            ChatCompletion object from OpenAI
        """
        if not self._initialized:
            await self.initialize()

        try:
            logger.debug(f"🤖 Generating completion with {len(messages)} messages")

            kwargs = {
                "model": settings.openai_model,
                "messages": messages,
                "temperature": temperature,
            }

            if max_tokens:
                kwargs["max_tokens"] = max_tokens

            if response_format:
                kwargs["response_format"] = response_format

            response = await self.client.chat.completions.create(**kwargs)

            logger.info(f"✅ Generated completion: {response.usage.total_tokens} tokens used")
            return response

        except Exception as e:
            logger.error(f"❌ Failed to generate completion: {e}")
            raise

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate text from a simple prompt.

        Args:
            prompt: User prompt text
            system_prompt: Optional system prompt
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response

        Returns:
            Generated text content
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        response = await self.generate_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )

        return response.choices[0].message.content

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate JSON-formatted response.

        Args:
            prompt: User prompt text
            system_prompt: Optional system prompt
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response

        Returns:
            JSON string content
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        response = await self.generate_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"}
        )

        return response.choices[0].message.content

    async def generate_with_context(
        self,
        prompt: str,
        context_documents: List[str],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate text with RAG context from retrieved documents.

        Args:
            prompt: User prompt text
            context_documents: List of retrieved document contents
            system_prompt: Optional system prompt
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response

        Returns:
            Generated text content
        """
        # Build context section
        context_section = "\n\n".join([
            f"## Reference Pattern {i+1}\n{doc}"
            for i, doc in enumerate(context_documents)
        ])

        # Construct enhanced prompt with context
        enhanced_prompt = f"""# Context Information

{context_section}

# User Request

{prompt}

Please generate a workflow based on the above reference patterns and user request."""

        return await self.generate_text(
            prompt=enhanced_prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )

    async def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for text using OpenAI's embedding model.

        Args:
            text: Text to embed

        Returns:
            Embedding vector (list of floats)
        """
        if not self._initialized:
            await self.initialize()

        try:
            response = await self.client.embeddings.create(
                model=settings.openai_embedding_model,
                input=text
            )
            return response.data[0].embedding

        except Exception as e:
            logger.error(f"❌ Failed to generate embedding: {e}")
            raise

    def get_status(self) -> Dict[str, Any]:
        """Get service status."""
        return {
            "initialized": self._initialized,
            "model": settings.openai_model if self._initialized else None,
            "embedding_model": settings.openai_embedding_model if self._initialized else None,
        }


# Global LLM service instance
llm_service = LLMService()