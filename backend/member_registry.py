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


def load_members(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [validate_member(item) for item in json.loads(path.read_text(encoding="utf-8")).get("members", [])]


def save_members(path: Path, members: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps({"members": [validate_member(item) for item in members]}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def list_workspace_members(path: Path, workspace_id: str) -> list[dict]:
    return [member for member in load_members(path) if member["workspace_id"] == workspace_id]


def update_member_status(members: list[dict], *, member_id: str, workspace_id: str, status: str, confirm: bool) -> dict:
    if not confirm:
        raise PermissionError("alteração de status exige confirmação explícita")
    if status not in STATUSES:
        raise ValueError("status de membro inválido")
    for member in members:
        if member["member_id"] == member_id and member["workspace_id"] == workspace_id:
            member["status"] = status
            return member
    raise ValueError("membro não encontrado no workspace")
def create_member(members: list[dict], *, member_id: str, workspace_id: str, role: str, confirm: bool) -> dict:
    if not confirm:
        raise PermissionError("criação de membro exige confirmação explícita")
    member = validate_member({"member_id": member_id, "workspace_id": workspace_id, "role": role, "status": "invited"})
    if any(item["member_id"] == member["member_id"] and item["workspace_id"] == member["workspace_id"] for item in members):
        raise ValueError("membro duplicado no workspace")
    members.append(member)
    return member
