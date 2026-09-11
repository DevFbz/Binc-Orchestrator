"""Deterministic executive report builder for Binc Orchestrator."""
from __future__ import annotations


def build_overview_report(start: str, end: str, projects: list[dict], jobs: dict, campaigns: dict, finance: dict) -> dict:
    if start > end:
        raise ValueError("período inválido")
    return {
        "period": {"start": start, "end": end},
        "generated_by": "binc-orchestrator",
        "sources": ["project_registry", "job_registry", "campaign_history", "finance_ledger"],
        "limitations": ["Insights externos dependem das permissões e disponibilidade da API Meta.", "Dados financeiros representam somente lançamentos registrados no workspace."],
        "sections": {
            "projects": {"total": len(projects), "items": projects},
            "jobs": jobs,
            "campaigns": campaigns,
            "finance": finance,
        },
    }
