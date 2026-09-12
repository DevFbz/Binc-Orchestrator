"""Workspace-scoped member registry for Binc Orchestrator."""
from __future__ import annotations

import json
from pathlib import Path

ROLES = {"global_admin", "workspace_admin", "reviewer", "reader"}
STATUSES = {"active", "invited", "suspended"}


def validate_member(member: dict) -> dict:
    required = {"member_id", "workspace_id", "role", "status"}
    if not required.issubset(member):
        raise ValueError("membro inválido")
    result = dict(member)
    for key in ("member_id", "workspace_id", "role", "status"):
        if not isinstance(result[key], str) or not result[key].strip():
            raise ValueError("membro inválido")
        result[key] = result[key].strip()
    if result["role"] not in ROLES or result["status"] not in STATUSES:
        raise ValueError("membro inválido")
    return result


def _load(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [validate_member(item) for item in json.loads(path.read_text(encoding="utf-8")).get("members", [])]


def list_workspace_members(path: Path, workspace_id: str) -> list[dict]:
    return [member for member in _load(path) if member["workspace_id"] == workspace_id]
