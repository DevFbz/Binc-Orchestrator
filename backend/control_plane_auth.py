"""Authentication helpers for the server-to-server control plane."""
from __future__ import annotations

import hmac


def is_authorized(authorization: str | None, expected_token: str) -> bool:
    if not authorization or not expected_token or not authorization.startswith("Bearer "):
        return False
    supplied = authorization.removeprefix("Bearer ").strip()
    return bool(supplied) and hmac.compare_digest(supplied, expected_token)
