"""
Retry Logic with Exponential Backoff
Handles transient errors and API rate limits with intelligent retry strategies
"""

import asyncio
import logging
from typing import Callable, Any, Optional, Type, Tuple
from functools import wraps
import time
import random

logger = logging.getLogger(__name__)


class RetryableError(Exception):
    """Base exception for errors that should be retried."""
    pass


class RateLimitError(RetryableError):
    """Exception for API rate limit errors."""
    pass


class APIError(RetryableError):
    """Exception for temporary API errors."""
    pass


def retry_with_exponential_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: Tuple[Type[Exception], ...] = (RetryableError, TimeoutError, ConnectionError),
    fallback_model: Optional[str] = None,
):
    """
    Decorator for retrying functions with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts (default: 3)
        base_delay: Initial delay in seconds (default: 1.0)
        max_delay: Maximum delay between retries (default: 60.0)
        exponential_base: Base for exponential calculation (default: 2.0)
        jitter: Add random jitter to prevent thundering herd (default: True)
        retryable_exceptions: Tuple of exceptions to retry (default: RetryableError, TimeoutError, ConnectionError)
        fallback_model: Fallback model to use after max retries (default: None)

    Returns:
        Decorated function with retry logic

    Example:
        @retry_with_exponential_backoff(max_retries=3, base_delay=1.0)
        async def call_api():
            return await client.make_request()
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    # Execute function
                    result = await func(*args, **kwargs)

                    # Log successful retry
                    if attempt > 0:
                        logger.info(f"✅ Retry successful on attempt {attempt + 1}/{max_retries + 1}")

                    return result

                except retryable_exceptions as e:
                    last_exception = e

                    # Check if we've exhausted retries
                    if attempt >= max_retries:
                        logger.error(
                            f"❌ Max retries ({max_retries}) exceeded for {func.__name__}: {e}"
                        )

                        # Try fallback model if specified
                        if fallback_model and "model" in kwargs:
                            logger.info(f"🔄 Attempting fallback to model: {fallback_model}")
                            try:
                                kwargs["model"] = fallback_model
                                return await func(*args, **kwargs)
                            except Exception as fallback_error:
                                logger.error(f"❌ Fallback also failed: {fallback_error}")

                        raise last_exception

                    # Calculate delay with exponential backoff
                    delay = min(base_delay * (exponential_base ** attempt), max_delay)

                    # Add jitter to prevent thundering herd
                    if jitter:
                        delay = delay * (0.5 + random.random())

                    # Categorize error for logging
                    error_category = _categorize_error(e)

                    logger.warning(
                        f"⚠️ {error_category} error in {func.__name__} (attempt {attempt + 1}/{max_retries + 1}): {e}\n"
                        f"   Retrying in {delay:.2f}s..."
                    )

                    # Wait before retry
                    await asyncio.sleep(delay)

                except Exception as e:
                    # Non-retryable error - fail immediately
                    logger.error(
                        f"❌ Non-retryable error in {func.__name__}: {e}",
                        exc_info=True
                    )
                    raise

            # This should never be reached, but just in case
            if last_exception:
                raise last_exception

        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            """Synchronous wrapper for non-async functions."""
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    result = func(*args, **kwargs)

                    if attempt > 0:
                        logger.info(f"✅ Retry successful on attempt {attempt + 1}/{max_retries + 1}")

                    return result

                except retryable_exceptions as e:
                    last_exception = e

                    if attempt >= max_retries:
                        logger.error(
                            f"❌ Max retries ({max_retries}) exceeded for {func.__name__}: {e}"
                        )
                        raise last_exception

                    delay = min(base_delay * (exponential_base ** attempt), max_delay)
                    if jitter:
                        delay = delay * (0.5 + random.random())

                    error_category = _categorize_error(e)
                    logger.warning(
                        f"⚠️ {error_category} error in {func.__name__} (attempt {attempt + 1}/{max_retries + 1}): {e}\n"
                        f"   Retrying in {delay:.2f}s..."
                    )

                    time.sleep(delay)

                except Exception as e:
                    logger.error(
                        f"❌ Non-retryable error in {func.__name__}: {e}",
                        exc_info=True
                    )
                    raise

            if last_exception:
                raise last_exception

        # Return appropriate wrapper based on whether function is async
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def _categorize_error(error: Exception) -> str:
    """
    Categorize error for better logging.

    Args:
        error: Exception to categorize

    Returns:
        Error category string
    """
    error_str = str(error).lower()

    if isinstance(error, RateLimitError) or "rate limit" in error_str or "429" in error_str:
        return "Rate Limit"
    elif isinstance(error, TimeoutError) or "timeout" in error_str:
        return "Timeout"
    elif isinstance(error, ConnectionError) or "connection" in error_str:
        return "Connection"
    elif "503" in error_str or "service unavailable" in error_str:
        return "Service Unavailable"
    elif "500" in error_str or "internal server error" in error_str:
        return "Server Error"
    else:
        return "Transient"


class RetryConfig:
    """Configuration for retry behavior."""

    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True
    ):
        """
        Initialize retry configuration.

        Args:
            max_retries: Maximum retry attempts
            base_delay: Initial delay in seconds
            max_delay: Maximum delay in seconds
            exponential_base: Exponential growth factor
            jitter: Whether to add random jitter
        """
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter

    def to_decorator_kwargs(self) -> dict:
        """Convert to decorator keyword arguments."""
        return {
            "max_retries": self.max_retries,
            "base_delay": self.base_delay,
            "max_delay": self.max_delay,
            "exponential_base": self.exponential_base,
            "jitter": self.jitter
        }


# Predefined retry configurations for common scenarios

# Conservative retry for critical operations
CONSERVATIVE_RETRY = RetryConfig(
    max_retries=5,
    base_delay=2.0,
    max_delay=120.0,
    exponential_base=2.0,
    jitter=True
)

# Aggressive retry for non-critical operations
AGGRESSIVE_RETRY = RetryConfig(
    max_retries=10,
    base_delay=0.5,
    max_delay=30.0,
    exponential_base=1.5,
    jitter=True
)

# Quick retry for fast-failing operations
QUICK_RETRY = RetryConfig(
    max_retries=2,
    base_delay=0.5,
    max_delay=5.0,
    exponential_base=2.0,
    jitter=False
)
