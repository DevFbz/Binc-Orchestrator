"""Workspace-scoped RBAC policy."""
from __future__ import annotations

ROLES = {"global_admin", "workspace_admin", "reviewer", "reader"}


def can_access_project(role: str, actor_workspace_id: str, project: dict) -> bool:
    if role not in ROLES:
        return False
    if role == "global_admin":
        return True
    return actor_workspace_id == project.get("workspace_id")
