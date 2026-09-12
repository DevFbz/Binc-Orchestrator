"""Workspace-scoped finance setup entities."""
from __future__ import annotations

from datetime import date
from uuid import uuid4

ENTRY_TYPES = {"income", "expense"}
ACCOUNT_TYPES = {"checking", "savings", "cash", "credit_card"}
FREQUENCIES = {"weekly", "monthly", "yearly"}


def scoped_setup(setup: dict, workspace_id: str) -> dict:
    workspace_id = workspace_id.strip()
    return {
        key: [
            item
            for item in setup.get(key, [])
            if item.get("workspace_id") == workspace_id
        ]
        for key in ("categories", "accounts", "recurrences")
    }


def _iso(value: date | str) -> str:
    return value.isoformat() if isinstance(value, date) else str(value)


def create_recurrence(
    setup: dict,
    *,
    workspace_id: str,
    entry_type: str,
    amount_cents: int,
    category_id: str,
    account_id: str,
    frequency: str,
    next_due_on: date | str,
    description: str,
    confirm: bool,
) -> dict:
    if not confirm:
        raise PermissionError("recorrência financeira exige confirmação explícita")
    workspace_id = workspace_id.strip()
    if (
        not workspace_id
        or entry_type not in ENTRY_TYPES
        or amount_cents <= 0
        or frequency not in FREQUENCIES
        or not description.strip()
    ):
        raise ValueError("recorrência financeira inválida")
    category = next(
        (item for item in setup.get("categories", []) if item.get("category_id") == category_id),
        None,
    )
    if not category or category.get("workspace_id") != workspace_id:
        raise ValueError("categoria não pertence ao workspace")
    if category.get("entry_type") != entry_type:
        raise ValueError("categoria incompatível com o tipo de lançamento")
    account = next(
        (item for item in setup.get("accounts", []) if item.get("account_id") == account_id),
        None,
    )
    if not account or account.get("workspace_id") != workspace_id:
        raise ValueError("conta não pertence ao workspace")
    recurrence = {
        "recurrence_id": str(uuid4()),
        "workspace_id": workspace_id,
        "entry_type": entry_type,
        "amount_cents": int(amount_cents),
        "category_id": category_id,
        "account_id": account_id,
        "frequency": frequency,
        "next_due_on": _iso(next_due_on),
        "description": description.strip(),
        "active": True,
    }
    setup.setdefault("recurrences", []).append(recurrence)
    return recurrence


def create_account(
    setup: dict,
    *,
    workspace_id: str,
    name: str,
    account_type: str,
    confirm: bool,
) -> dict:
    if not confirm:
        raise PermissionError("conta financeira exige confirmação explícita")
    workspace_id = workspace_id.strip()
    name = name.strip()
    if not workspace_id or not name or account_type not in ACCOUNT_TYPES:
        raise ValueError("conta financeira inválida")
    accounts = setup.setdefault("accounts", [])
    if any(
        item.get("workspace_id") == workspace_id
        and str(item.get("name", "")).casefold() == name.casefold()
        for item in accounts
    ):
        raise ValueError("conta já existe neste workspace")
    account = {
        "account_id": str(uuid4()),
        "workspace_id": workspace_id,
        "name": name,
        "account_type": account_type,
        "currency": "BRL",
        "active": True,
    }
    accounts.append(account)
    return account


def create_category(
    setup: dict,
    *,
    workspace_id: str,
    name: str,
    entry_type: str,
    confirm: bool,
) -> dict:
    if not confirm:
        raise PermissionError("categoria financeira exige confirmação explícita")
    workspace_id = workspace_id.strip()
    name = name.strip()
    if not workspace_id or not name or entry_type not in ENTRY_TYPES:
        raise ValueError("categoria financeira inválida")
    categories = setup.setdefault("categories", [])
    if any(
        item.get("workspace_id") == workspace_id
        and str(item.get("name", "")).casefold() == name.casefold()
        for item in categories
    ):
        raise ValueError("categoria já existe neste workspace")
    category = {
        "category_id": str(uuid4()),
        "workspace_id": workspace_id,
        "name": name,
        "entry_type": entry_type,
    }
    categories.append(category)
    return category
