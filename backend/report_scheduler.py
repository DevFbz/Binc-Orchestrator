"""Deterministic schedule definitions for executive reports."""
from __future__ import annotations

from datetime import datetime

FREQUENCIES = {"weekly", "monthly"}
CHANNELS = {"telegram"}


def build_schedule(frequency: str, workspace_id: str, project_id: str, delivery_channel: str) -> dict:
    if frequency not in FREQUENCIES or delivery_channel not in CHANNELS or not workspace_id or not project_id:
        raise ValueError("agenda de relatório inválida")
    return {"schedule_id": schedule_key(frequency, workspace_id, project_id), "frequency": frequency, "workspace_id": workspace_id, "project_id": project_id, "delivery_channel": delivery_channel, "status": "paused", "approval_required": True}


def is_due(next_run_at: str, now: datetime) -> bool:
    return datetime.fromisoformat(next_run_at) <= now


def schedule_key(frequency: str, workspace_id: str, period_key: str) -> str:
    return f"{frequency}|{workspace_id}|{period_key}"
