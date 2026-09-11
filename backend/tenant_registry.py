"""Tenant registry for isolated Instagram Automation Post Hermes clients."""
from __future__ import annotations

import json
from pathlib import Path

DEFAULT_TENANTS_DIR = Path(__file__).resolve().parents[1] / "data" / "tenants"


def _read_tenant(path: Path) -> dict:
    record = json.loads(path.read_text(encoding="utf-8"))
    required = {"tenant_id", "name", "active"}
    missing = required.difference(record)
    if missing:
        raise ValueError(f"Tenant inválido em {path.name}: faltam {sorted(missing)}")
    return record


def list_tenants(directory: Path = DEFAULT_TENANTS_DIR) -> list[dict]:
    if not directory.exists():
        return []
    return sorted((_read_tenant(path) for path in directory.glob("*.json")), key=lambda tenant: tenant["name"])


def get_tenant(tenant_id: str, directory: Path = DEFAULT_TENANTS_DIR) -> dict:
    for tenant in list_tenants(directory):
        if tenant["tenant_id"] == tenant_id:
            return tenant
    raise KeyError(tenant_id)
