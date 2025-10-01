"""
LLM Service - OpenAI Integration
Manages interactions with OpenAI's GPT models for workflow generation
"""

from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion
from openai import APIError, RateLimitError as OpenAIRateLimitError, APITimeoutError

from app.config import settings
from app.utils.retry import retry_with_exponential_backoff, RetryableError, RateLimitError

logger = logging.getLogger(__name__)


class TokenUsageStats:
    """Track token usage statistics."""

    def __init__(self):
        self.total_requests = 0
        self.total_prompt_tokens = 0
        self.total_completion_tokens = 0
        self.total_tokens = 0
        self.total_cost = 0.0
        self.requests_by_model: Dict[str, int] = {}
        self.last_reset = datetime.now()

    def record_usage(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int
    ):
        """Record token usage from a completion."""
        self.total_requests += 1
        self.total_prompt_tokens += prompt_tokens
        self.total_completion_tokens += completion_tokens
        self.total_tokens += total_tokens

        # Track by model
        self.requests_by_model[model] = self.requests_by_model.get(model, 0) + 1

        # Estimate cost (approximate OpenAI pricing)
        self.total_cost += self._estimate_cost(model, prompt_tokens, completion_tokens)

    def _estimate_cost(self, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """Estimate cost based on OpenAI pricing (as of 2025)."""
        # Pricing per 1M tokens (approximate)
        pricing = {
            "gpt-4o": {"input": 2.50, "output": 10.00},
            "gpt-4o-mini": {"input": 0.15, "output": 0.60},
            "gpt-4": {"input": 30.00, "output": 60.00},
            "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
        }

        # Find matching pricing tier
        model_pricing = None
        for key in pricing:
            if key in model:
                model_pricing = pricing[key]
                break

        if not model_pricing:
            # Default to gpt-4o-mini pricing
            model_pricing = pricing["gpt-4o-mini"]

        input_cost = (prompt_tokens / 1_000_000) * model_pricing["input"]
        output_cost = (completion_tokens / 1_000_000) * model_pricing["output"]

        return input_cost + output_cost

    def get_stats(self) -> Dict[str, Any]:
        """Get usage statistics."""
        return {
            "total_requests": self.total_requests,
            "total_tokens": self.total_tokens,
            "total_prompt_tokens": self.total_prompt_tokens,
            "total_completion_tokens": self.total_completion_tokens,
            "estimated_cost_usd": round(self.total_cost, 4),
            "avg_tokens_per_request": round(self.total_tokens / max(1, self.total_requests), 2),
            "requests_by_model": self.requests_by_model,
            "tracking_since": self.last_reset.isoformat(),
        }

    def reset(self):
        """Reset statistics."""
        self.__init__()


class LLMService:
    """Service for interacting with OpenAI's GPT models."""

    def __init__(self):
        """Initialize OpenAI client."""
        self.client: Optional[AsyncOpenAI] = None
        self._initialized = False
        self.usage_stats = TokenUsageStats()

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

    @retry_with_exponential_backoff(
        max_retries=3,
        base_delay=1.0,
        max_delay=30.0,
        retryable_exceptions=(
            RetryableError,
            OpenAIRateLimitError,
            APITimeoutError,
            ConnectionError,
            TimeoutError
        ),
        fallback_model="gpt-4o-mini"
    )
    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        response_format: Optional[Dict[str, str]] = None,
        model: Optional[str] = None  # Allow model override for fallback
    ) -> ChatCompletion:
        """
        Generate a chat completion using OpenAI's API with automatic retry logic.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            response_format: Optional response format specification
            model: Override model (used for fallback)

        Returns:
            ChatCompletion object from OpenAI

        Raises:
            RetryableError: For transient errors that should be retried
            APIError: For API errors
        """
        if not self._initialized:
            await self.initialize()

        try:
            logger.debug(f"🤖 Generating completion with {len(messages)} messages")

            # Use provided model or default
            selected_model = model or settings.openai_model

            kwargs = {
                "model": selected_model,
                "messages": messages,
                "temperature": temperature,
            }

            if max_tokens:
                kwargs["max_tokens"] = max_tokens

            if response_format:
                kwargs["response_format"] = response_format

            response = await self.client.chat.completions.create(**kwargs)

            # Record token usage
            if response.usage:
                self.usage_stats.record_usage(
                    model=selected_model,
                    prompt_tokens=response.usage.prompt_tokens,
                    completion_tokens=response.usage.completion_tokens,
                    total_tokens=response.usage.total_tokens
                )
                logger.info(
                    f"✅ Generated completion: {response.usage.total_tokens} tokens "
                    f"(prompt: {response.usage.prompt_tokens}, "
                    f"completion: {response.usage.completion_tokens}) "
                    f"[{selected_model}]"
                )

            return response

        except OpenAIRateLimitError as e:
            logger.warning(f"⚠️ Rate limit hit: {e}")
            raise RateLimitError(str(e)) from e
        except APITimeoutError as e:
            logger.warning(f"⚠️ API timeout: {e}")
            raise RetryableError(str(e)) from e
        except APIError as e:
            # Categorize API errors (5xx are retryable, 4xx are not)
            error_str = str(e)
            if "500" in error_str or "503" in error_str or "502" in error_str:
                logger.warning(f"⚠️ Server error (retryable): {e}")
                raise RetryableError(str(e)) from e
            else:
                logger.error(f"❌ API error (not retryable): {e}")
                raise
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
            "usage_stats": self.usage_stats.get_stats(),
        }

    def get_usage_stats(self) -> Dict[str, Any]:
        """Get detailed token usage statistics."""
        return self.usage_stats.get_stats()

    def reset_usage_stats(self) -> None:
        """Reset token usage statistics."""
        logger.info("🔄 Resetting token usage statistics")
        self.usage_stats.reset()


# Global LLM service instance
llm_service = LLMService()