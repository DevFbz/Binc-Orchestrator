#!/usr/bin/env python3
"""Public Binc smoke test; prints status only, never response bodies."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "https://binc-orchestrator.vercel.app"


def request(path: str, method: str = "GET", payload: dict | None = None):
    body = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(BASE + path, data=body, method=method, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.status, response.headers
    except urllib.error.HTTPError as exc:
        return exc.code, exc.headers


def main() -> int:
    checks = {path: request(path)[0] for path in ("/", "/terminal", "/history", "/projects", "/docs", "/api/control-plane")}
    for path, status in checks.items():
        print(f"{path}={status}")
    status, headers = request("/api/control-plane", method="POST", payload={"kind": "admin_message", "conversation_id": "smoke-no-send", "text": "smoke", "idempotency_key": "smoke-no-send", "confirm": False})
    print(f"confirmation_gate={status}")
    print(f"nosniff={headers.get('X-Content-Type-Options')}")
    print(f"cache={headers.get('Cache-Control')}")
    ok = all(status == 200 for status in checks.values()) and status == 400 and headers.get("X-Content-Type-Options") == "nosniff" and headers.get("Cache-Control") == "no-store"
    print(f"result={'PASS' if ok else 'FAIL'}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
