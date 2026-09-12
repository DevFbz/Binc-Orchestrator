"""Confirmed financial mutations for Binc Orchestrator."""
from __future__ import annotations

from finance import add_entry


def create_financial_entry(entries: list[dict], *, workspace_id: str, entry_type: str, amount_cents: int, category: str, occurred_on, description: str, confirm: bool) -> dict:
    if not confirm:
        raise PermissionError("lançamento financeiro exige confirmação explícita")
    return add_entry(entries, workspace_id=workspace_id, entry_type=entry_type, amount_cents=amount_cents, category=category, occurred_on=occurred_on, description=description)
