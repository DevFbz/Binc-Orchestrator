"""Deterministic executive report builder for Binc Orchestrator."""
from __future__ import annotations


def scope_report_data(projects: list[dict], campaigns: list[dict], project_id: str) -> tuple[list[dict], list[dict]]:
    if not project_id:
        return projects, campaigns
    selected_projects = [project for project in projects if project.get("project_id") == project_id]
    return selected_projects, campaigns if project_id == "instagram-content-operations" else []


def scope_finance_summary(summary: dict, project_id: str) -> dict:
    if not project_id or project_id == "cofrinia-finance":
        return summary
    return {key: 0 for key in ("income_cents", "expense_cents", "balance_cents", "entries")}


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
