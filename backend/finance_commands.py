"""Confirmed financial mutations for Binc Orchestrator."""
from __future__ import annotations

from finance import add_entry


def create_financial_entry(entries: list[dict], *, workspace_id: str, entry_type: str, amount_cents: int, category: str, account_id: str | None = None, accounts: list[dict] | None = None, occurred_on, description: str, confirm: bool) -> dict:
    if not confirm:
        raise PermissionError("lançamento financeiro exige confirmação explícita")
    if account_id and not any(
        item.get("account_id") == account_id
        and item.get("workspace_id") == workspace_id
        and item.get("active", True)
        for item in (accounts or [])
    ):
        raise ValueError("conta não pertence ao workspace")
    return add_entry(entries, workspace_id=workspace_id, entry_type=entry_type, amount_cents=amount_cents, category=category, account_id=account_id, occurred_on=occurred_on, description=description)
