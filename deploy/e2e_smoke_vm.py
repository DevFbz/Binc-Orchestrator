#!/usr/bin/env python3
"""Read-only end-to-end smoke test for the Binc execution plane."""
from __future__ import annotations

import sys
import urllib.error
import urllib.request


CHECKS = [
    ("binc_health", "http://127.0.0.1:8791/api/health", 200),
    ("binc_projects_requires_auth", "http://127.0.0.1:8791/api/projects", 401),
    ("binc_events_requires_auth", "http://127.0.0.1:8791/api/events/telegram", 401),
    ("instagram_health", "http://127.0.0.1:8787/api/health", 200),
    ("cofrinia_health", "http://127.0.0.1:8790/health", 200),
]


def status(url: str) -> int:
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return response.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except (OSError, urllib.error.URLError):
        return 0


def main() -> int:
    results = []
    for name, url, expected in CHECKS:
        actual = status(url)
        ok = actual == expected
        results.append(ok)
        print(f"{name}={actual} expected={expected}")
    print(f"result={'PASS' if all(results) else 'FAIL'}")
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
