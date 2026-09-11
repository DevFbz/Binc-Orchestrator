"""Minimal, workspace-scoped personal finance ledger."""
from __future__ import annotations

from datetime import date
from uuid import uuid4

ENTRY_TYPES = {"income", "expense"}


def _iso(value: date | str) -> str:
    return value.isoformat() if isinstance(value, date) else value


def add_entry(entries: list[dict], *, workspace_id: str, entry_type: str, amount_cents: int, category: str, occurred_on: date | str, description: str) -> dict:
    if not workspace_id or entry_type not in ENTRY_TYPES or amount_cents <= 0 or not category or not description:
        raise ValueError("lançamento financeiro inválido")
    record = {
        "entry_id": str(uuid4()),
        "workspace_id": workspace_id,
        "entry_type": entry_type,
        "amount_cents": int(amount_cents),
        "category": category.strip(),
        "occurred_on": _iso(occurred_on),
        "description": description.strip(),
    }
    entries.append(record)
    return record


def summarize_period(entries: list[dict], workspace_id: str, start: date, end: date) -> dict:
    if start > end:
        raise ValueError("período inválido")
    scoped = [entry for entry in entries if entry.get("workspace_id") == workspace_id and start.isoformat() <= entry.get("occurred_on", "") <= end.isoformat()]
    income = sum(entry.get("amount_cents", 0) for entry in scoped if entry.get("entry_type") == "income")
    expense = sum(entry.get("amount_cents", 0) for entry in scoped if entry.get("entry_type") == "expense")
    return {"income_cents": income, "expense_cents": expense, "balance_cents": income - expense, "entries": len(scoped)}
