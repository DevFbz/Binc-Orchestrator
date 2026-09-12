"""Health and operational metrics for Binc Orchestrator."""
from __future__ import annotations


def summarize_health(services: list[dict]) -> dict:
    return {
        "total": len(services),
        "operational": sum(item.get("status") == "operational" for item in services),
        "degraded": sum(item.get("status") == "degraded" for item in services),
        "failed": sum(item.get("status") == "failed" for item in services),
    }


def summarize_metrics(events: list[dict], audit_events: list[dict], jobs: list[dict]) -> dict:
    return {
        "events_total": len(events),
        "inbound_events": sum(item.get("direction") == "inbound" for item in events),
        "outbound_events": sum(item.get("direction") == "outbound" for item in events),
        "delivery_failures": sum(item.get("delivery_status") == "failed" for item in events),
        "audit_failures": sum(item.get("result") in {"failed", "error"} for item in audit_events),
        "jobs_active": sum(item.get("status") == "active" for item in jobs),
        "jobs_paused": sum(item.get("status") == "paused" for item in jobs),
    }
