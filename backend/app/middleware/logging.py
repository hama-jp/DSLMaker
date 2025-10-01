"""
Request Logging Middleware
Logs all requests with timing and status information
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import time
import uuid

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests with timing and metadata."""

    async def dispatch(self, request: Request, call_next):
        """Process and log request."""

        # Generate unique request ID
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        # Skip logging for health checks (too verbose)
        skip_logging = request.url.path in ["/health", "/docs", "/openapi.json", "/redoc"]

        if not skip_logging:
            logger.info(
                f"[{request_id}] ➡️  {request.method} {request.url.path} "
                f"from {request.client.host if request.client else 'unknown'}"
            )

        # Record start time
        start_time = time.time()

        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log error
            duration = time.time() - start_time
            logger.error(
                f"[{request_id}] ❌ {request.method} {request.url.path} "
                f"failed after {duration:.2f}s: {str(e)}",
                exc_info=True
            )
            raise

        # Calculate duration
        duration = time.time() - start_time

        # Add custom headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration:.3f}s"

        # Log response
        if not skip_logging:
            # Determine log level based on status code
            status_code = response.status_code
            if status_code >= 500:
                log_level = logging.ERROR
                emoji = "❌"
            elif status_code >= 400:
                log_level = logging.WARNING
                emoji = "⚠️"
            elif status_code >= 300:
                log_level = logging.INFO
                emoji = "↩️"
            else:
                log_level = logging.INFO
                emoji = "✅"

            logger.log(
                log_level,
                f"[{request_id}] {emoji} {request.method} {request.url.path} "
                f"→ {status_code} in {duration:.2f}s"
            )

        return response
