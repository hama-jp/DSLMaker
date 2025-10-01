"""
Rate Limiting Middleware
Simple in-memory rate limiter for API endpoints
"""

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Simple in-memory rate limiter using sliding window."""

    def __init__(self, requests: int = 100, period: int = 60):
        """
        Initialize rate limiter.

        Args:
            requests: Maximum number of requests allowed
            period: Time period in seconds
        """
        self.requests = requests
        self.period = period
        self.clients: Dict[str, list[datetime]] = {}

    def is_allowed(self, client_id: str) -> Tuple[bool, int]:
        """
        Check if request is allowed for client.

        Args:
            client_id: Client identifier (usually IP address)

        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.period)

        # Initialize client if not exists
        if client_id not in self.clients:
            self.clients[client_id] = []

        # Remove old requests outside the window
        self.clients[client_id] = [
            timestamp for timestamp in self.clients[client_id]
            if timestamp > cutoff
        ]

        # Check if under limit
        current_requests = len(self.clients[client_id])

        if current_requests < self.requests:
            # Allow request and record timestamp
            self.clients[client_id].append(now)
            return True, self.requests - current_requests - 1
        else:
            # Rate limit exceeded
            return False, 0

    def cleanup_old_clients(self) -> None:
        """Remove clients with no recent requests to prevent memory leak."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.period * 2)

        clients_to_remove = []
        for client_id, timestamps in self.clients.items():
            if not timestamps or max(timestamps) < cutoff:
                clients_to_remove.append(client_id)

        for client_id in clients_to_remove:
            del self.clients[client_id]

        if clients_to_remove:
            logger.debug(f"Cleaned up {len(clients_to_remove)} inactive clients")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware for FastAPI.

    Limits requests per client IP address.
    """

    def __init__(
        self,
        app,
        requests: int = 100,
        period: int = 60,
        enabled: bool = True
    ):
        """
        Initialize middleware.

        Args:
            app: FastAPI application
            requests: Max requests per period (default: 100)
            period: Time period in seconds (default: 60)
            enabled: Whether rate limiting is enabled (default: True)
        """
        super().__init__(app)
        self.enabled = enabled
        self.limiter = RateLimiter(requests=requests, period=period)
        self.cleanup_counter = 0
        logger.info(
            f"🚦 Rate limiting {'enabled' if enabled else 'disabled'}: "
            f"{requests} requests per {period}s"
        )

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with rate limiting."""

        # Skip if disabled
        if not self.enabled:
            return await call_next(request)

        # Skip rate limiting for health checks and docs
        if request.url.path in ["/", "/health", "/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)

        # Get client identifier (IP address)
        client_ip = self._get_client_ip(request)

        # Check rate limit
        is_allowed, remaining = self.limiter.is_allowed(client_ip)

        if not is_allowed:
            logger.warning(f"⚠️ Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Please try again later.",
                    "retry_after": self.limiter.period
                },
                headers={
                    "Retry-After": str(self.limiter.period),
                    "X-RateLimit-Limit": str(self.limiter.requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(self.limiter.period)
                }
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(self.limiter.requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(self.limiter.period)

        # Periodic cleanup
        self.cleanup_counter += 1
        if self.cleanup_counter >= 100:
            self.limiter.cleanup_old_clients()
            self.cleanup_counter = 0

        return response

    def _get_client_ip(self, request: Request) -> str:
        """
        Extract client IP address from request.

        Handles proxies and load balancers.
        """
        # Check X-Forwarded-For header (for proxies)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take first IP in the chain
            return forwarded_for.split(",")[0].strip()

        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

        # Fallback to direct client IP
        client = request.client
        return client.host if client else "unknown"
