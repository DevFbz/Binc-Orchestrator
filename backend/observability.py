"""Health summaries for Binc Orchestrator services."""
from __future__ import annotations


def summarize_health(services: list[dict]) -> dict:
    return {
        "total": len(services),
        "operational": sum(item.get("status") == "operational" for item in services),
        "degraded": sum(item.get("status") == "degraded" for item in services),
        "failed": sum(item.get("status") == "failed" for item in services),
    }
