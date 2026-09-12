import time

from rate_limiter import RateLimiter


def test_rate_limiter_allows_limit_then_blocks():
    limiter = RateLimiter(limit=2, window_seconds=60, clock=lambda: 100.0)
    assert limiter.allow("client") is True
    assert limiter.allow("client") is True
    assert limiter.allow("client") is False


def test_rate_limiter_expires_window():
    current = [100.0]
    limiter = RateLimiter(limit=1, window_seconds=10, clock=lambda: current[0])
    assert limiter.allow("client") is True
    assert limiter.allow("client") is False
    current[0] = 111.0
    assert limiter.allow("client") is True
